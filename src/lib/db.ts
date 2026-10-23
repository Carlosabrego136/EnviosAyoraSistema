import 'server-only';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client, types, type ClientConfig, type PoolClient, type QueryResultRow } from 'pg';
import { AppError, ConfigError, ConflictError, DatabaseError } from './errors';
import { logger } from './logger';

// BIGINT (ids) → number; DATE → 'YYYY-MM-DD' sin conversión de zona horaria.
types.setTypeParser(20, (v) => Number(v));
types.setTypeParser(1082, (v) => v);

declare global {
  // eslint-disable-next-line no-var
  var __fenixDb: { config?: ClientConfig; active: number; waiting: Array<() => void> } | undefined;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function loadCa(): string | undefined {
  const inline = process.env.DATABASE_CA_CERT?.trim();
  if (inline) return inline.replace(/\\n/g, '\n');
  const path = process.env.DATABASE_CA_CERT_PATH?.trim();
  if (path) {
    try {
      const full = resolve(process.cwd(), path);
      if (existsSync(full)) return readFileSync(full, 'utf8');
    } catch (err) {
      logger.warn('db.ca_read_failed', { path, error: String(err) });
    }
  }
  return undefined;
}

/**
 * El servidor de Aiven se comparte con otros proyectos y solo admite 20 conexiones en total.
 * Por eso NO se usa Pool: cada consulta (o transacción) abre su propia conexión y la cierra al terminar,
 * y como máximo hay MAX_CONCURRENT a la vez por instancia (las demás esperan en cola).
 */
const MAX_CONCURRENT = 2;
const RETRY_DELAYS_MS = [300, 700, 1300];
const RETRYABLE_CONNECT_CODES = new Set(['53300', '57P03', 'ECONNRESET', 'ETIMEDOUT']);

function state() {
  if (!globalThis.__fenixDb) globalThis.__fenixDb = { active: 0, waiting: [] };
  return globalThis.__fenixDb;
}

function buildConfig(): ClientConfig {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) throw new ConfigError('La base de datos no está configurada (DATABASE_URL).');

  let url: URL;
  try {
    url = new URL(raw);
  } catch (err) {
    throw new ConfigError('DATABASE_URL no es una URI válida.');
  }
  // El modo SSL se fija explícitamente; se retira de la URI para evitar ambigüedades entre versiones de pg.
  url.searchParams.delete('sslmode');

  const ca = loadCa();
  if (!ca && process.env.DATABASE_SSL !== 'off') {
    logger.warn('db.ssl_without_ca', {
      note: 'Conexión cifrada sin verificar el servidor. Configura DATABASE_CA_CERT para verificación completa.',
    });
  }

  // Solo para PostgreSQL local de desarrollo. En producción SIEMPRE se usa SSL.
  const sslOff = process.env.DATABASE_SSL === 'off' && process.env.NODE_ENV !== 'production';

  return {
    connectionString: url.toString(),
    ssl: sslOff ? false : ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
    connectionTimeoutMillis: 12_000,
    statement_timeout: 15_000,
    query_timeout: 15_000,
  };
}

function getConfig(): ClientConfig {
  const s = state();
  if (!s.config) s.config = buildConfig();
  return s.config;
}

/** Semáforo simple: espera turno si ya hay MAX_CONCURRENT conexiones en uso. */
async function acquire(): Promise<void> {
  const s = state();
  if (s.active < MAX_CONCURRENT) {
    s.active++;
    return;
  }
  await new Promise<void>((resolve) => s.waiting.push(resolve)); // el turno se hereda de quien libera
}

function release(): void {
  const s = state();
  const next = s.waiting.shift();
  if (next) next();
  else s.active--;
}

function isRetryableConnectError(err: unknown): boolean {
  const e = err as { code?: unknown; message?: unknown } | null;
  if (typeof e?.code === 'string' && RETRYABLE_CONNECT_CODES.has(e.code)) return true;
  // pg no asigna código al vencer connectionTimeoutMillis; es un fallo de conexión de tipo ETIMEDOUT.
  return typeof e?.message === 'string' && /timeout expired|connection timeout/i.test(e.message);
}

/** Abre una conexión nueva. SOLO los fallos al conectar se reintentan (hasta 3 veces); los errores de SQL nunca. */
async function openClient(): Promise<Client> {
  const config = getConfig();
  for (let attempt = 0; ; attempt++) {
    const client = new Client(config);
    client.on('error', () => undefined);
    try {
      await client.connect();
      return client;
    } catch (err) {
      await client.end().catch(() => undefined);
      if (isRetryableConnectError(err) && attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] + Math.floor(Math.random() * 201)));
        continue;
      }
      throw err;
    }
  }
}

/** Ejecuta una consulta parametrizada. Los errores de pg se registran y se traducen a DatabaseError. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await acquire();
  let client: Client | undefined;
  try {
    client = await openClient();
    const result = await client.query<T>(text, params);
    return result.rows;
  } catch (err) {
    if (err instanceof ConfigError) throw err;
    logger.error('db.query_failed', err, { sql: text.slice(0, 120) });
    throw new DatabaseError(err);
  } finally {
    if (client) await client.end().catch(() => undefined);
    release();
  }
}

/**
 * Ejecuta `fn` dentro de una transacción con su propia conexión (se cierra al terminar).
 * Si algo lanza, se hace ROLLBACK y la excepción original se propaga (los errores de pg se traducen a DatabaseError).
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  await acquire();
  let client: Client | undefined;
  try {
    try {
      client = await openClient();
    } catch (err) {
      if (err instanceof ConfigError) throw err;
      logger.error('db.connect_failed', err);
      throw new DatabaseError(err);
    }
    try {
      await client.query('BEGIN');
      // Quienes llaman solo usan client.query(); el tipo PoolClient se conserva para no tocar sus firmas.
      const result = await fn(client as unknown as PoolClient);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        logger.error('db.rollback_failed', rollbackErr);
      }
      if (err instanceof AppError) throw err;
      const code = (err as { code?: unknown } | null)?.code;
      if (code === '23505') {
        // unique_violation: dato duplicado (p. ej. correo ya registrado)
        throw new ConflictError();
      }
      logger.error('db.transaction_failed', err, { pgCode: typeof code === 'string' ? code : undefined });
      throw new DatabaseError(err);
    }
  } finally {
    if (client) await client.end().catch(() => undefined);
    release();
  }
}
