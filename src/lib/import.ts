import 'server-only';
import { writeAudit, type Actor } from './audit';
import { withTransaction } from './db';
import { ValidationError } from './errors';
import { logger } from './logger';
import { cleanLine, cleanMultiline, type RequestContext } from './security';

const MAX_ROWS = 2000;

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Convierte texto pegado desde Excel/CSV en filas de celdas. Detecta tabulador, ; | o coma. */
export function parseTable(raw: string): string[][] {
  const lines = cleanMultiline(raw, 400_000)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const sample = lines[0];
  const delim = sample.includes('\t') ? '\t' : sample.includes(';') ? ';' : sample.includes('|') ? '|' : ',';
  return lines.map((l) => l.split(delim).map((c) => c.trim().replace(/^"(.*)"$/, '$1').trim()));
}

function toNum(input: string): number {
  let t = input.replace(/[$\s]/g, '');
  if (t.includes(',') && t.includes('.')) t = t.replace(/,/g, '');
  else if (t.includes(',')) t = /^\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
  return Number(t);
}

function lineErrors(errors: string[]): never {
  const shown = errors.slice(0, 8).join('\n');
  const more = errors.length > 8 ? `\n…y ${errors.length - 8} error(es) más.` : '';
  throw new ValidationError({ data: `No se importó nada. Corrige estas líneas:\n${shown}${more}` }, 'Hay líneas con errores.');
}

// ── Tarifas ────────────────────────────────────────────────────

const SERVICE_ALIASES: Record<string, string> = {
  aereo: 'aereo',
  aerea: 'aereo',
  terrestre: 'terrestre',
  bajapack: 'bajapack',
  'baja pack': 'bajapack',
  tarimas: 'tarimas',
  tarima: 'tarimas',
  'gran volumen': 'tarimas',
};

interface RateInput {
  service_slug: string;
  carrier: string;
  destination: string;
  weight_from: number;
  weight_to: number;
  price: number;
  price_type: 'fixed' | 'per_kg';
}

export function parseRates(raw: string): RateInput[] {
  const table = parseTable(raw);
  if (table.length === 0) throw new ValidationError({ data: 'Pega la tabla de tarifas.' });
  if (table.length > MAX_ROWS + 1) throw new ValidationError({ data: `Máximo ${MAX_ROWS} filas por importación.` });

  const out: RateInput[] = [];
  const errors: string[] = [];
  table.forEach((cells, i) => {
    const lineNo = i + 1;
    if (cells.length < 6) {
      if (i === 0) return; // encabezado incompleto
      errors.push(`Línea ${lineNo}: faltan columnas (se esperan 6 o 7).`);
      return;
    }
    const [svc, carrier, destination, fromRaw, toRaw, priceRaw, typeRaw = ''] = cells;
    const from = toNum(fromRaw);
    const to = toNum(toRaw);
    const price = toNum(priceRaw);
    if (i === 0 && (!Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(price))) return; // encabezado
    const slug = SERVICE_ALIASES[strip(svc)];
    if (!slug) return void errors.push(`Línea ${lineNo}: servicio "${svc}" no válido (aereo, terrestre, bajapack o tarimas).`);
    if (!Number.isFinite(from) || from < 0) return void errors.push(`Línea ${lineNo}: peso inicial no válido.`);
    if (!Number.isFinite(to) || to <= 0 || to < from) return void errors.push(`Línea ${lineNo}: peso final no válido.`);
    if (!Number.isFinite(price) || price < 0) return void errors.push(`Línea ${lineNo}: precio no válido.`);
    const t = strip(typeRaw);
    const price_type: 'fixed' | 'per_kg' = /kg|kilo/.test(t) ? 'per_kg' : 'fixed';
    out.push({
      service_slug: slug,
      carrier: cleanLine(carrier, 60),
      destination: cleanLine(destination, 80),
      weight_from: Math.round(from * 100) / 100,
      weight_to: Math.round(to * 100) / 100,
      price: Math.round(price * 100) / 100,
      price_type,
    });
  });
  if (errors.length) lineErrors(errors);
  if (out.length === 0) throw new ValidationError({ data: 'No se encontraron filas de tarifas.' });
  return out;
}

export async function importRates(raw: string, replace: boolean, actor: Actor, ctx: RequestContext): Promise<number> {
  const rows = parseRates(raw);
  await withTransaction(async (client) => {
    if (replace) await client.query('DELETE FROM rates');
    for (const r of rows) {
      await client.query(
        `INSERT INTO rates (service_slug, carrier, destination, weight_from, weight_to, price, price_type)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [r.service_slug, r.carrier, r.destination, r.weight_from, r.weight_to, r.price, r.price_type],
      );
    }
    await writeAudit(client, {
      actor,
      action: 'tarifas.import',
      entity: 'rates',
      entityId: 'import',
      summary: `Importó ${rows.length} tarifa(s)${replace ? ' reemplazando el tabulador anterior' : ''}`,
      after: { count: rows.length, replace },
      ctx,
    });
  });
  logger.info('rates.imported', { count: rows.length, replace, actor: actor.id });
  return rows.length;
}

// ── Comerciantes ───────────────────────────────────────────────

const STATUS_ALIASES: Record<string, string> = {
  activo: 'activo',
  activa: 'activo',
  baja: 'inactivo',
  inactivo: 'inactivo',
  inactiva: 'inactivo',
  renovacion: 'renovacion',
  'renovacion pendiente': 'renovacion',
  'pendiente de renovacion': 'renovacion',
  pendiente: 'renovacion',
  riesgo: 'riesgo',
};

interface MerchantInput {
  name: string;
  category: string;
  status: string;
  facebook_url: string;
  zone: string;
}

/** Acepta "facebook.com/…" sin https y lo completa; solo se permiten enlaces https. */
function cleanProfileUrl(raw: string): string | null {
  let u = raw.trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u) && /^(www\.|m\.)?(facebook|fb)\.com\//i.test(u)) u = `https://${u}`;
  return /^https:\/\/[^\s]{4,240}$/i.test(u) ? u : null;
}

/**
 * Columnas (en este orden): nombre ; categoría ; estatus ; enlace de Facebook ; zona.
 * Solo el nombre es obligatorio. No se importan teléfonos ni datos personales.
 */
export function parseMerchants(raw: string): MerchantInput[] {
  const table = parseTable(raw);
  if (table.length === 0) throw new ValidationError({ data: 'Pega la lista de comerciantes.' });
  if (table.length > MAX_ROWS + 1) throw new ValidationError({ data: `Máximo ${MAX_ROWS} filas por importación.` });

  const byName = new Map<string, MerchantInput>();
  const errors: string[] = [];
  table.forEach((cells, i) => {
    const lineNo = i + 1;
    const [nameRaw = '', catRaw = '', statusRaw = '', fbRaw = '', zoneRaw = ''] = cells;
    if (i === 0 && /^(nombre|comerciante|vendedor)/.test(strip(nameRaw)) && /categ/.test(strip(catRaw))) return; // encabezado
    const name = cleanLine(nameRaw, 100);
    if (!name) return void errors.push(`Línea ${lineNo}: falta el nombre.`);
    const status = statusRaw ? STATUS_ALIASES[strip(statusRaw)] : 'activo';
    if (!status) return void errors.push(`Línea ${lineNo}: estatus "${cleanLine(statusRaw, 30)}" no válido (activo, pendiente de renovación, baja o riesgo).`);
    const facebook_url = cleanProfileUrl(fbRaw);
    if (facebook_url === null) return void errors.push(`Línea ${lineNo}: el enlace de Facebook debe empezar con https:// (columna 4).`);
    // Si el nombre se repite en la lista, gana la última fila.
    byName.set(name.toLowerCase(), {
      name,
      category: cleanLine(catRaw, 50) || 'Variado',
      status,
      facebook_url,
      zone: cleanLine(zoneRaw, 60),
    });
  });
  if (errors.length) lineErrors(errors);
  if (byName.size === 0) throw new ValidationError({ data: 'No se encontraron comerciantes.' });
  return Array.from(byName.values());
}

/** Importación en bloque (pocas consultas aunque sean miles de filas): inserta nuevos y actualiza existentes por nombre. */
export async function importMerchants(raw: string, actor: Actor, ctx: RequestContext): Promise<{ created: number; updated: number }> {
  const rows = parseMerchants(raw);
  const result = await withTransaction(async (client) => {
    const names = rows.map((m) => m.name.toLowerCase());
    const existing = await client.query<{ id: number; lname: string }>(
      'SELECT DISTINCT ON (lower(name)) id, lower(name) AS lname FROM merchants WHERE lower(name) = ANY($1::text[]) ORDER BY lower(name), id',
      [names],
    );
    const idByName = new Map(existing.rows.map((r) => [r.lname, Number(r.id)]));
    const toUpdate = rows.filter((m) => idByName.has(m.name.toLowerCase()));
    const toInsert = rows.filter((m) => !idByName.has(m.name.toLowerCase()));

    if (toUpdate.length) {
      await client.query(
        `UPDATE merchants AS t SET category = v.category, status = v.status,
                zone = CASE WHEN v.zone <> '' THEN v.zone ELSE t.zone END,
                facebook_url = CASE WHEN v.facebook_url <> '' THEN v.facebook_url ELSE t.facebook_url END
         FROM unnest($1::bigint[], $2::text[], $3::text[], $4::text[], $5::text[]) AS v(id, category, status, zone, facebook_url)
         WHERE t.id = v.id`,
        [
          toUpdate.map((m) => idByName.get(m.name.toLowerCase())),
          toUpdate.map((m) => m.category),
          toUpdate.map((m) => m.status),
          toUpdate.map((m) => m.zone),
          toUpdate.map((m) => m.facebook_url),
        ],
      );
    }
    if (toInsert.length) {
      await client.query(
        `INSERT INTO merchants (name, category, status, zone, facebook_url)
         SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[])`,
        [
          toInsert.map((m) => m.name),
          toInsert.map((m) => m.category),
          toInsert.map((m) => m.status),
          toInsert.map((m) => m.zone),
          toInsert.map((m) => m.facebook_url),
        ],
      );
    }
    const created = toInsert.length;
    const updated = toUpdate.length;
    await writeAudit(client, {
      actor,
      action: 'comerciantes.import',
      entity: 'merchants',
      entityId: 'import',
      summary: `Importó comerciantes: ${created} nuevo(s), ${updated} actualizado(s)`,
      after: { created, updated },
      ctx,
    });
    return { created, updated };
  });
  logger.info('merchants.imported', { ...result, actor: actor.id });
  return result;
}
