import 'server-only';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool, types, type PoolClient, type QueryResultRow } from 'pg';
import { AppError, ConfigError, ConflictError, DatabaseError } from './errors';
import { logger } from './logger';

// BIGINT (ids) → number; DATE → 'YYYY-MM-DD' sin conversión de zona horaria.
types.setTypeParser(20, (v) => Number(v));
types.setTypeParser(1082, (v) => v);

declare global {
  // eslint-disable-next-line no-var
  var __fenixPool: Pool | undefined;
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

function createPool(): Pool {
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

  const max = Math.min(Math.max(Number(process.env.DATABASE_POOL_MAX) || 3, 1), 10);
  const pool = new Pool({
    connectionString: url.toString(),
    ssl: sslOff ? false : ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
    max,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    statement_timeout: 15_000,
    query_timeout: 20_000,
    allowExitOnIdle: true,
  });
  pool.on('error', (err) => logger.error('db.pool_error', err));
  return pool;
}

export function getPool(): Pool {
  if (!globalThis.__fenixPool) globalThis.__fenixPool = createPool();
  return globalThis.__fenixPool;
}

/** Ejecuta una consulta parametrizada. Los errores de pg se registran y se traducen a DatabaseError. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  try {
    const result = await getPool().query<T>(text, params);
    return result.rows;
  } catch (err) {
    if (err instanceof ConfigError) throw err;
    logger.error('db.query_failed', err, { sql: text.slice(0, 120) });
    throw new DatabaseError(err);
  }
}

/**
 * Ejecuta `fn` dentro de una transacción. Si algo lanza, se hace ROLLBACK y la excepción original
 * se propaga (los errores de pg se traducen a DatabaseError).
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  let client: PoolClient;
  try {
    client = await getPool().connect();
  } catch (err) {
    if (err instanceof ConfigError) throw err;
    logger.error('db.connect_failed', err);
    throw new DatabaseError(err);
  }
  try {
    await client.query('BEGIN');
    const result = await fn(client);
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
  } finally {
    client.release();
  }
}
