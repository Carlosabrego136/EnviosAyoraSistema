import 'server-only';
import { z } from 'zod';
import type { PoolClient } from 'pg';
import { writeAudit, type Actor } from './audit';
import { query, withTransaction } from './db';
import { AppError, ConflictError, DatabaseError, ForbiddenError, NotFoundError, ValidationError } from './errors';
import { logger } from './logger';
import { cleanLine, cleanMultiline, type RequestContext } from './security';

// ── Constantes de seguridad operativa (Fail-Safe: todo tiene tope) ─────────
export const FOLIO_MAX = 99999;
const CREATE_MAX_ATTEMPTS = 3; // reintentos acotados ante bloqueo/deadlock del contador
const RETRY_DELAYS_MS = [150, 400];
const LOCK_TIMEOUT = '4s';
export const LIST_LIMIT = 300;
export const EXPORT_LIMIT = 20000;

export interface Folio {
  id: number;
  folio_number: number;
  request_id: string;
  branch: string;
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  weight_kg: string | null;
  size_id: number | null;
  size_name: string;
  price: string;
  collector: string;
  paid: boolean;
  paid_at: Date | null;
  carrier_guide: string;
  notes: string;
  status: 'activo' | 'cancelado';
  cancel_reason: string;
  cancelled_at: Date | null;
  cancelled_by: string;
  created_by: number | null;
  created_by_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface FolioSize {
  id: number;
  name: string;
  min_kg: string;
  max_kg: string;
  price: string;
  sort_order: number;
  is_active: boolean;
}

// ── Validación de entradas ─────────────────────────────────────────────────
const line = (label: string, max: number, required: boolean) =>
  z
    .unknown()
    .transform((v) => cleanLine(v, max))
    .refine((v) => !required || v.length > 0, { message: `${label} es obligatorio.` });

export function normalizePhone(raw: unknown): string {
  const digits = cleanLine(raw, 40).replace(/\D/g, '');
  return digits.slice(-15);
}

const phoneField = z
  .unknown()
  .transform((v) => normalizePhone(v))
  .refine((v) => v === '' || (v.length >= 10 && v.length <= 15), { message: 'Escribe un teléfono de 10 dígitos (o déjalo vacío).' });

const weightField = z.unknown().transform((v, ctx) => {
  const text = cleanLine(v, 12).replace(',', '.');
  if (!text) {
    ctx.addIssue({ code: 'custom', message: 'Escribe el peso en kg.' });
    return z.NEVER;
  }
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(text)) {
    ctx.addIssue({ code: 'custom', message: 'Peso inválido. Ejemplo: 1.5' });
    return z.NEVER;
  }
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0) {
    ctx.addIssue({ code: 'custom', message: 'El peso debe ser mayor a 0.' });
    return z.NEVER;
  }
  return Math.round(n * 100) / 100;
});

const baseFields = {
  sender_name: line('El nombre del remitente', 100, true),
  sender_phone: phoneField,
  recipient_name: line('El destinatario', 100, false),
  collector: line('El recolector', 60, true),
  carrier_guide: line('La guía', 60, false),
  notes: z.unknown().transform((v) => cleanMultiline(v, 300)),
  weight_kg: weightField,
};

export const createFolioSchema = z.object({
  request_id: z.string().uuid('Solicitud inválida. Recarga la página e inténtalo de nuevo.'),
  paid: z.boolean(),
  ...baseFields,
});

export const updateFolioSchema = z.object({
  paid: z.boolean(),
  ...baseFields,
});

export const cancelSchema = z.object({
  reason: line('El motivo', 200, true).refine((v) => v.length >= 4, { message: 'Explica el motivo con al menos 4 letras.' }),
});

export function fieldErrorsOf(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input);
  if (!r.success) throw new ValidationError(fieldErrorsOf(r.error));
  return r.data;
}

// ── Lectura ────────────────────────────────────────────────────────────────
export async function listSizes(onlyActive = false): Promise<FolioSize[]> {
  return query<FolioSize>(
    `SELECT id, name, min_kg::text, max_kg::text, price::text, sort_order, is_active
       FROM folio_sizes ${onlyActive ? 'WHERE is_active' : ''} ORDER BY sort_order, max_kg, id`,
  );
}

export async function getFolio(id: number): Promise<Folio | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const rows = await query<Folio>(
    `SELECT id, folio_number, request_id, branch, sender_name, sender_phone, recipient_name, weight_kg::text, size_id,
            size_name, price::text, collector, paid, paid_at, carrier_guide, notes, status, cancel_reason,
            cancelled_at, cancelled_by, created_by, created_by_name, created_at, updated_at
       FROM folios WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export interface FolioFilters {
  q?: string;
  from?: string; // YYYY-MM-DD (zona horaria del negocio)
  to?: string;
  collector?: string;
  status?: 'activo' | 'cancelado' | '';
  paid?: 'si' | 'no' | '';
  /** Solo los de hoy (vista del recolector). */
  today?: boolean;
  limit?: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function buildWhere(f: FolioFilters, tz: string): { where: string; params: unknown[] } {
  const conds: string[] = [];
  const params: unknown[] = [];
  const add = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  const q = cleanLine(f.q, 80);
  if (q) {
    const digits = q.replace(/\D/g, '');
    const like = add(`%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    const parts = [`sender_name ILIKE ${like}`, `recipient_name ILIKE ${like}`, `carrier_guide ILIKE ${like}`];
    if (digits && digits.length <= 5) parts.push(`folio_number = ${add(Number(digits))}`);
    if (digits.length >= 4) parts.push(`sender_phone LIKE ${add(`%${digits}%`)}`);
    conds.push(`(${parts.join(' OR ')})`);
  }
  const tzp = add(tz);
  if (f.today) conds.push(`(created_at AT TIME ZONE ${tzp})::date = (now() AT TIME ZONE ${tzp})::date`);
  if (f.from && DATE_RE.test(f.from)) conds.push(`(created_at AT TIME ZONE ${tzp})::date >= ${add(f.from)}::date`);
  if (f.to && DATE_RE.test(f.to)) conds.push(`(created_at AT TIME ZONE ${tzp})::date <= ${add(f.to)}::date`);
  const collector = cleanLine(f.collector, 60);
  if (collector) conds.push(`lower(collector) = lower(${add(collector)})`);
  if (f.status === 'activo' || f.status === 'cancelado') conds.push(`status = ${add(f.status)}`);
  if (f.paid === 'si') conds.push('paid');
  if (f.paid === 'no') conds.push('NOT paid');
  return { where: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

export async function listFolios(f: FolioFilters, tz: string, limit = LIST_LIMIT): Promise<Folio[]> {
  const { where, params } = buildWhere(f, tz);
  const max = Math.min(Math.max(1, Math.trunc(limit) || LIST_LIMIT), EXPORT_LIMIT);
  return query<Folio>(
    `SELECT id, folio_number, request_id, branch, sender_name, sender_phone, recipient_name, weight_kg::text, size_id,
            size_name, price::text, collector, paid, paid_at, carrier_guide, notes, status, cancel_reason,
            cancelled_at, cancelled_by, created_by, created_by_name, created_at, updated_at
       FROM folios ${where} ORDER BY folio_number DESC LIMIT ${max}`,
    params,
  );
}

export interface FolioSummary {
  total: number;
  active: number;
  cancelled: number;
  paid_count: number;
  pending_count: number;
  paid_amount: string;
  pending_amount: string;
}

/** Totales de folios ACTIVOS (los cancelados no suman dinero). */
export async function summarize(f: FolioFilters, tz: string): Promise<FolioSummary> {
  const { where, params } = buildWhere(f, tz);
  const rows = await query<FolioSummary>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status = 'activo')::int AS active,
            count(*) FILTER (WHERE status = 'cancelado')::int AS cancelled,
            count(*) FILTER (WHERE status = 'activo' AND paid)::int AS paid_count,
            count(*) FILTER (WHERE status = 'activo' AND NOT paid)::int AS pending_count,
            coalesce(sum(price) FILTER (WHERE status = 'activo' AND paid), 0)::text AS paid_amount,
            coalesce(sum(price) FILTER (WHERE status = 'activo' AND NOT paid), 0)::text AS pending_amount
       FROM folios ${where}`,
    params,
  );
  return rows[0];
}

export async function recentCollectors(): Promise<string[]> {
  const rows = await query<{ collector: string }>(
    `SELECT collector FROM folios WHERE collector <> '' GROUP BY collector ORDER BY max(created_at) DESC LIMIT 30`,
  );
  return rows.map((r) => r.collector);
}

// ── Tamaño y precio: SIEMPRE se calculan en el servidor ────────────────────
export function pickSize(sizes: FolioSize[], weight: number): FolioSize {
  const active = sizes.filter((s) => s.is_active);
  if (active.length === 0) throw new ValidationError({ weight_kg: 'No hay tamaños activos. Avisa al administrador.' });
  const sorted = [...active].sort((a, b) => Number(a.max_kg) - Number(b.max_kg));
  const found = sorted.find((s) => weight <= Number(s.max_kg) + 1e-9);
  if (!found) {
    const top = sorted[sorted.length - 1];
    throw new ValidationError({
      weight_kg: `El peso máximo para folio es ${Number(top.max_kg)} kg. Consulta con el administrador para paquetes más pesados.`,
    });
  }
  return found;
}

// ── Escritura ──────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pgCodeOf(err: unknown): string | undefined {
  const direct = (err as { code?: unknown } | null)?.code;
  if (typeof direct === 'string') return direct;
  const cause = (err as { cause?: { code?: unknown } } | null)?.cause?.code;
  return typeof cause === 'string' ? cause : undefined;
}

/** Bloqueo no obtenido a tiempo (55P03), deadlock (40P01) o fallo de serialización (40001): se puede reintentar. */
function isRetryable(err: unknown): boolean {
  const code = pgCodeOf(err);
  return code === '55P03' || code === '40P01' || code === '40001';
}

function actorLabel(a: Actor): string {
  return a.name || a.email;
}

async function findByRequestId(requestId: string): Promise<Folio | null> {
  const rows = await query<{ id: number }>('SELECT id FROM folios WHERE request_id = $1', [requestId]);
  return rows[0] ? getFolio(rows[0].id) : null;
}

export interface CreateResult {
  folio: Folio;
  /** true si la misma solicitud ya se había procesado (doble toque / reintento): no se duplicó. */
  duplicate: boolean;
}

export async function createFolio(
  input: unknown,
  branch: string,
  actor: Actor,
  ctx: RequestContext,
): Promise<CreateResult> {
  const data = parseOrThrow(createFolioSchema, input);
  const branchName = cleanLine(branch, 80) || 'Fénix Tijuana Matriz';

  // Idempotencia: si ya existe un folio con esta solicitud, se devuelve el mismo.
  const existing = await findByRequestId(data.request_id);
  if (existing) return { folio: existing, duplicate: true };

  const sizes = await listSizes(true);
  const size = pickSize(sizes, data.weight_kg);

  let lastError: unknown;
  for (let attempt = 1; attempt <= CREATE_MAX_ATTEMPTS; attempt++) {
    try {
      const id = await withTransaction(async (client) => {
        await client.query(`SET LOCAL lock_timeout = '${LOCK_TIMEOUT}'`);
        // El UPDATE bloquea la fila del contador: los folios se numeran uno por uno, sin saltos ni repetidos.
        const { rows: counter } = await client.query<{ last_number: number }>(
          'UPDATE folio_counter SET last_number = last_number + 1 WHERE id = 1 AND last_number < $1 RETURNING last_number',
          [FOLIO_MAX],
        );
        if (counter.length === 0) {
          throw new AppError('FOLIO_LIMIT', 'Se alcanzó el folio 99999. Avisa al administrador para reiniciar la numeración.', 409);
        }
        const number = counter[0].last_number;
        // Precio del tamaño al momento de crear (se guarda una copia; cambios futuros no lo alteran).
        const { rows: fresh } = await client.query<{ name: string; price: string }>(
          'SELECT name, price::text FROM folio_sizes WHERE id = $1 AND is_active',
          [size.id],
        );
        if (fresh.length === 0) throw new ValidationError({ weight_kg: 'El tamaño cambió mientras se guardaba. Inténtalo de nuevo.' });
        const { rows } = await client.query<{ id: number }>(
          `INSERT INTO folios
             (folio_number, request_id, branch, sender_name, sender_phone, recipient_name, weight_kg, size_id, size_name,
              price, collector, paid, paid_at, carrier_guide, notes, created_by, created_by_name)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, CASE WHEN $12 THEN now() END,$13,$14,$15,$16)
           RETURNING id`,
          [
            number, data.request_id, branchName, data.sender_name, data.sender_phone, data.recipient_name,
            data.weight_kg, size.id, fresh[0].name, fresh[0].price, data.collector, data.paid,
            data.carrier_guide, data.notes, actor.id, actorLabel(actor),
          ],
        );
        await writeAudit(client, {
          actor,
          action: 'folios.create',
          entity: 'folios',
          entityId: rows[0].id,
          summary: `Folio ${String(number).padStart(5, '0')} · ${fresh[0].name} · $${fresh[0].price} · ${data.collector}`,
          after: { folio_number: number, size: fresh[0].name, price: fresh[0].price, paid: data.paid, collector: data.collector },
          ctx,
        });
        return rows[0].id;
      });
      const folio = await getFolio(id);
      if (!folio) throw new NotFoundError();
      return { folio, duplicate: false };
    } catch (err) {
      lastError = err;
      if (err instanceof ConflictError) {
        // Dos envíos simultáneos con la misma solicitud: el segundo recupera el folio del primero.
        const again = await findByRequestId(data.request_id);
        if (again) return { folio: again, duplicate: true };
        throw err;
      }
      if (attempt < CREATE_MAX_ATTEMPTS && isRetryable(err)) {
        logger.warn('folios.create_retry', { attempt, code: pgCodeOf(err) });
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 400);
        continue;
      }
      throw err;
    }
  }
  logger.error('folios.create_exhausted', lastError);
  throw new DatabaseError(lastError);
}

async function lockFolio(client: PoolClient, id: number): Promise<Folio> {
  await client.query(`SET LOCAL lock_timeout = '${LOCK_TIMEOUT}'`);
  const { rows } = await client.query<Folio>(
    `SELECT id, folio_number, request_id, branch, sender_name, sender_phone, recipient_name, weight_kg::text, size_id,
            size_name, price::text, collector, paid, paid_at, carrier_guide, notes, status, cancel_reason,
            cancelled_at, cancelled_by, created_by, created_by_name, created_at, updated_at
       FROM folios WHERE id = $1 FOR UPDATE`,
    [id],
  );
  if (!rows[0]) throw new NotFoundError('El folio no existe.');
  if (rows[0].status === 'cancelado') throw new ForbiddenError('Este folio está cancelado y ya no se puede modificar.');
  return rows[0];
}

/** Corrige datos del folio. El número, la fecha, la sucursal y la solicitud nunca cambian. */
export async function updateFolio(id: number, input: unknown, actor: Actor, ctx: RequestContext): Promise<Folio> {
  const data = parseOrThrow(updateFolioSchema, input);
  const sizes = await listSizes(false);

  await withTransaction(async (client) => {
    const before = await lockFolio(client, id);
    // Si el peso no cambió se conserva el tamaño y el precio originales; si cambió se recalcula con el catálogo vigente.
    let sizeId = before.size_id;
    let sizeName = before.size_name;
    let price = before.price;
    if (before.weight_kg === null || Number(before.weight_kg) !== data.weight_kg) {
      const size = pickSize(sizes, data.weight_kg);
      sizeId = size.id;
      sizeName = size.name;
      price = size.price;
    }
    const paidAt = data.paid ? (before.paid ? before.paid_at : new Date()) : null;
    await client.query(
      `UPDATE folios SET sender_name=$2, sender_phone=$3, recipient_name=$4, weight_kg=$5, size_id=$6, size_name=$7,
              price=$8, collector=$9, paid=$10, paid_at=$11, carrier_guide=$12, notes=$13
        WHERE id=$1`,
      [id, data.sender_name, data.sender_phone, data.recipient_name, data.weight_kg, sizeId, sizeName, price,
        data.collector, data.paid, paidAt, data.carrier_guide, data.notes],
    );
    const pick = (f: Pick<Folio, 'sender_name' | 'recipient_name' | 'weight_kg' | 'size_name' | 'price' | 'collector' | 'paid' | 'carrier_guide'>) => ({
      sender_name: f.sender_name, recipient_name: f.recipient_name, weight_kg: f.weight_kg, size_name: f.size_name,
      price: f.price, collector: f.collector, paid: f.paid, carrier_guide: f.carrier_guide,
    });
    await writeAudit(client, {
      actor,
      action: 'folios.update',
      entity: 'folios',
      entityId: id,
      summary: `Corrección del folio ${String(before.folio_number).padStart(5, '0')}`,
      before: pick(before),
      after: pick({ ...before, sender_name: data.sender_name, recipient_name: data.recipient_name, weight_kg: String(data.weight_kg),
        size_name: sizeName, price, collector: data.collector, paid: data.paid, carrier_guide: data.carrier_guide }),
      ctx,
    });
  });
  const folio = await getFolio(id);
  if (!folio) throw new NotFoundError();
  return folio;
}

export async function setPaid(id: number, paid: boolean, actor: Actor, ctx: RequestContext): Promise<void> {
  await withTransaction(async (client) => {
    const before = await lockFolio(client, id);
    if (before.paid === paid) return;
    await client.query('UPDATE folios SET paid=$2, paid_at=CASE WHEN $2 THEN now() END WHERE id=$1', [id, paid]);
    await writeAudit(client, {
      actor,
      action: paid ? 'folios.paid' : 'folios.unpaid',
      entity: 'folios',
      entityId: id,
      summary: `Folio ${String(before.folio_number).padStart(5, '0')} marcado como ${paid ? 'cobrado' : 'pendiente de cobro'}`,
      before: { paid: before.paid },
      after: { paid },
      ctx,
    });
  });
}

/** Los folios nunca se borran: se cancelan con motivo y quedan en el historial. */
export async function cancelFolio(id: number, input: unknown, actor: Actor, ctx: RequestContext): Promise<void> {
  const { reason } = parseOrThrow(cancelSchema, input);
  await withTransaction(async (client) => {
    const before = await lockFolio(client, id);
    await client.query(
      `UPDATE folios SET status='cancelado', cancel_reason=$2, cancelled_at=now(), cancelled_by=$3 WHERE id=$1`,
      [id, reason, actorLabel(actor)],
    );
    await writeAudit(client, {
      actor,
      action: 'folios.cancel',
      entity: 'folios',
      entityId: id,
      summary: `Folio ${String(before.folio_number).padStart(5, '0')} cancelado: ${reason}`.slice(0, 480),
      before: { status: before.status, price: before.price },
      after: { status: 'cancelado', reason },
      ctx,
    });
  });
}

// ── Presentación ───────────────────────────────────────────────────────────
export const padFolio = (n: number) => String(n).padStart(5, '0');

export function moneyMx(value: string | number): string {
  const n = Number(value);
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
}

/** Enlace wa.me con el comprobante ya redactado. Devuelve null si no hay teléfono utilizable. */
export function whatsappLink(folio: Folio, template: string): string | null {
  const digits = folio.sender_phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const phone = digits.length === 10 ? `52${digits}` : digits;
  const values: Record<string, string> = {
    folio: padFolio(folio.folio_number),
    remitente: folio.sender_name,
    destinatario: folio.recipient_name || folio.branch,
    tamano: folio.size_name,
    precio: moneyMx(folio.price),
    sucursal: folio.branch,
    estado_pago: folio.paid ? 'pagado' : 'por cobrar',
  };
  const text = template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k] : m));
  return `https://wa.me/${phone}?text=${encodeURIComponent(text.slice(0, 900))}`;
}

function csvCell(v: unknown): string {
  let t = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; // evita inyección de fórmulas al abrir en Excel
  return `"${t.replace(/"/g, '""')}"`;
}

export function foliosToCsv(rows: Folio[], tz: string): string {
  const fmt = new Intl.DateTimeFormat('es-MX', { timeZone: tz, dateStyle: 'short', timeStyle: 'short' });
  const head = ['Folio', 'Fecha', 'Estado', 'Recolector', 'Remitente', 'Teléfono', 'Destinatario', 'Sucursal', 'Peso kg', 'Tamaño', 'Precio', 'Pago', 'Guía paquetería', 'Notas', 'Motivo cancelación'];
  const lines = [head.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push([
      padFolio(r.folio_number), fmt.format(r.created_at), r.status, r.collector, r.sender_name, r.sender_phone,
      r.recipient_name, r.branch, r.weight_kg ?? '', r.size_name, r.price, r.paid ? 'Cobrado' : 'Por cobrar',
      r.carrier_guide, r.notes, r.cancel_reason,
    ].map(csvCell).join(','));
  }
  return `﻿${lines.join('\r\n')}\r\n`;
}
