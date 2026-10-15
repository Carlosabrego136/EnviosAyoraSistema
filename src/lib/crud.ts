import 'server-only';
import type { PoolClient } from 'pg';
import { writeAudit, type Actor } from './audit';
import { query, withTransaction } from './db';
import { ConflictError, NotFoundError, ValidationError } from './errors';
import { logger } from './logger';
import { writableFields, type FieldDef, type ResourceDef } from './resources';
import { cleanLine, cleanMultiline, type RequestContext } from './security';

export type Row = Record<string, unknown> & { id: number };

const q = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

// ── Lectura ────────────────────────────────────────────────────

export async function listRows(
  def: ResourceDef,
  opts: { limit?: number; offset?: number; filters?: Record<string, string>; search?: string } = {},
): Promise<{ rows: Row[]; total: number }> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
  const offset = Math.max(opts.offset ?? 0, 0);

  const where: string[] = [];
  const params: unknown[] = [];
  const allowed = new Set(def.fields.map((f) => f.name));
  for (const [column, value] of Object.entries(opts.filters ?? {})) {
    if (!allowed.has(column) || !value) continue; // solo columnas de la lista blanca
    params.push(value);
    where.push(`${q(column)} = $${params.length}`);
  }
  const term = (opts.search ?? '').trim().slice(0, 80);
  if (term && def.searchColumns?.length) {
    params.push(`%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    const idx = params.length;
    where.push(`(${def.searchColumns.map((c) => `${q(c)}::text ILIKE $${idx}`).join(' OR ')})`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = await query<Row>(
    `SELECT * FROM ${q(def.table)} ${whereSql} ORDER BY ${def.orderBy} LIMIT ${limit} OFFSET ${offset}`,
    params,
  );
  const count = await query<{ n: number }>(`SELECT count(*)::int AS n FROM ${q(def.table)} ${whereSql}`, params);
  return { rows, total: count[0]?.n ?? 0 };
}

export async function getRow(def: ResourceDef, id: number): Promise<Row | null> {
  const rows = await query<Row>(`SELECT * FROM ${q(def.table)} WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

// ── Lectura y validación del formulario ────────────────────────

function parseField(field: FieldDef, raw: FormDataEntryValue | null, errors: Record<string, string>): unknown {
  const label = field.label;

  if (field.type === 'checkbox') return raw === 'on' || raw === 'true' || raw === '1';
  if (field.type === 'image') return undefined; // las imágenes se procesan aparte (ver actions)

  const text =
    field.type === 'textarea' ? cleanMultiline(raw, field.max ?? 2000) : cleanLine(raw, field.max ?? 200);

  if (text === '') {
    if (field.required) errors[field.name] = `${label} es obligatorio.`;
    if (field.type === 'number' || field.type === 'decimal') return field.required ? 0 : null;
    return field.type === 'date' || field.type === 'time' ? null : '';
  }

  switch (field.type) {
    case 'number': {
      const n = Number(text);
      if (!Number.isInteger(n)) {
        errors[field.name] = `${label} debe ser un número entero.`;
        return 0;
      }
      if (field.min !== undefined && n < field.min) errors[field.name] = `${label} debe ser al menos ${field.min}.`;
      if (field.max !== undefined && n > field.max) errors[field.name] = `${label} no puede ser mayor a ${field.max}.`;
      return n;
    }
    case 'decimal': {
      const n = Number(text.replace(',', '.'));
      if (!Number.isFinite(n)) {
        errors[field.name] = `${label} debe ser un número.`;
        return 0;
      }
      const rounded = Math.round(n * 100) / 100;
      if (field.min !== undefined && rounded < field.min) errors[field.name] = `${label} debe ser al menos ${field.min}.`;
      if (field.max !== undefined && rounded > field.max) errors[field.name] = `${label} no puede ser mayor a ${field.max}.`;
      return rounded;
    }
    case 'url': {
      if (!/^https:\/\/[^\s]+$/.test(text)) errors[field.name] = `${label}: el enlace debe empezar con https://`;
      return text;
    }
    case 'date': {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
      const valid =
        m &&
        (() => {
          const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
          return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
        })();
      if (!valid) errors[field.name] = `${label} no es una fecha válida.`;
      return text;
    }
    case 'time': {
      const m = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(text);
      if (!m) {
        errors[field.name] = `${label} no es una hora válida.`;
        return text;
      }
      return `${m[1]}:${m[2]}`;
    }
    case 'select': {
      if (!field.options?.some((o) => o.value === text)) errors[field.name] = `${label}: opción no válida.`;
      return text;
    }
    default:
      return text;
  }
}

export function parseForm(def: ResourceDef, formData: FormData, editing: boolean): Record<string, unknown> {
  const errors: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  for (const field of writableFields(def, editing)) {
    const parsed = parseField(field, formData.get(field.name), errors);
    if (parsed !== undefined) values[field.name] = parsed;
  }
  if (Object.keys(errors).length === 0 && def.validate) Object.assign(errors, def.validate(values));
  if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  return values;
}

// ── Escritura con auditoría obligatoria ────────────────────────

function normalize(field: FieldDef | undefined, value: unknown): string {
  if (value === null || value === undefined) return '';
  if (field?.type === 'time') return String(value).slice(0, 5);
  if (field?.type === 'date') return String(value).slice(0, 10);
  return String(value);
}

function diff(def: ResourceDef, before: Row, after: Row): string[] {
  const fieldMap = new Map(def.fields.map((f) => [f.name, f]));
  const changed: string[] = [];
  for (const [name, field] of fieldMap) {
    if (field.displayOnly) continue;
    if (normalize(field, before[name]) !== normalize(field, after[name])) changed.push(name);
  }
  return changed;
}

function imageColumns(def: ResourceDef): string[] {
  return def.fields.filter((f) => f.type === 'image').map((f) => f.name);
}

/** Borra de la tabla media las imágenes que dejaron de usarse (misma transacción). */
async function dropMedia(client: PoolClient, ids: unknown[]): Promise<void> {
  for (const id of ids) {
    if (typeof id === 'number' && id > 0) await client.query('DELETE FROM media WHERE id = $1', [id]);
  }
}

function mapConflict(def: ResourceDef, err: unknown): never {
  if (err instanceof ConflictError && def.conflictField) {
    throw new ValidationError({ [def.conflictField.name]: def.conflictField.message });
  }
  throw err;
}

async function lockRow(client: PoolClient, def: ResourceDef, id: number): Promise<Row> {
  const { rows } = await client.query<Row>(`SELECT * FROM ${q(def.table)} WHERE id = $1 FOR UPDATE`, [id]);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function createRow(
  def: ResourceDef,
  values: Record<string, unknown>,
  actor: Actor,
  ctx: RequestContext,
): Promise<number> {
  const columns = Object.keys(values);
  if (columns.length === 0) throw new ValidationError({}, 'No hay datos para guardar.');

  const id = await withTransaction(async (client) => {
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await client.query<Row>(
      `INSERT INTO ${q(def.table)} (${columns.map(q).join(', ')}) VALUES (${placeholders}) RETURNING *`,
      columns.map((c) => values[c]),
    );
    const created = rows[0];
    await writeAudit(client, {
      actor,
      action: `${def.key}.create`,
      entity: def.table,
      entityId: created.id,
      summary: `Creó ${def.singular}: ${def.titleOf(created)}`,
      after: created,
      ctx,
    });
    return created.id;
  }).catch((err) => mapConflict(def, err));
  logger.info('crud.create', { entity: def.table, id, actor: actor.id });
  return id;
}

export async function updateRow(
  def: ResourceDef,
  id: number,
  values: Record<string, unknown>,
  actor: Actor,
  ctx: RequestContext,
): Promise<{ changed: string[] }> {
  const result = await withTransaction(async (client) => {
    const before = await lockRow(client, def, id);
    const columns = Object.keys(values);
    const sets = columns.map((c, i) => `${q(c)} = $${i + 1}`).join(', ');
    const { rows } = await client.query<Row>(
      `UPDATE ${q(def.table)} SET ${sets} WHERE id = $${columns.length + 1} RETURNING *`,
      [...columns.map((c) => values[c]), id],
    );
    const after = rows[0];
    const changed = diff(def, before, after);
    if (changed.length === 0) return { changed };

    // Si se reemplazó o quitó una imagen, la anterior se elimina para no acumular archivos huérfanos.
    await dropMedia(
      client,
      imageColumns(def).filter((c) => before[c] && before[c] !== after[c]).map((c) => before[c]),
    );

    await writeAudit(client, {
      actor,
      action: `${def.key}.update`,
      entity: def.table,
      entityId: id,
      summary: `Editó ${def.singular}: ${def.titleOf(after)} (campos: ${changed.join(', ')})`,
      before,
      after,
      ctx,
    });
    return { changed };
  }).catch((err) => mapConflict(def, err));
  logger.info('crud.update', { entity: def.table, id, actor: actor.id, changed: result.changed });
  return result;
}

export async function deleteRow(def: ResourceDef, id: number, actor: Actor, ctx: RequestContext): Promise<void> {
  await withTransaction(async (client) => {
    const before = await lockRow(client, def, id);
    await client.query(`DELETE FROM ${q(def.table)} WHERE id = $1`, [id]);
    await dropMedia(client, imageColumns(def).map((c) => before[c]));
    await writeAudit(client, {
      actor,
      action: `${def.key}.delete`,
      entity: def.table,
      entityId: id,
      summary: `Eliminó ${def.singular}: ${def.titleOf(before)}`,
      before, // instantánea completa: permite recuperar el dato borrado
      ctx,
    });
  });
  logger.info('crud.delete', { entity: def.table, id, actor: actor.id });
}
