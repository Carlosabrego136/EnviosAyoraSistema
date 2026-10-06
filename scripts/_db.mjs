// Conexión compartida por los scripts de base de datos (Aiven for PostgreSQL con SSL).
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

export function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function loadCa() {
  const inline = process.env.DATABASE_CA_CERT?.trim();
  if (inline) return inline.replace(/\\n/g, '\n');
  const path = process.env.DATABASE_CA_CERT_PATH?.trim();
  if (path) {
    const full = resolve(process.cwd(), path);
    if (existsSync(full)) return readFileSync(full, 'utf8');
  }
  return undefined;
}

export function createClient() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    fail(
      'Falta DATABASE_URL. Copia .env.example a .env.local y pega la "Service URI" de Aiven.',
    );
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    fail('DATABASE_URL no es una URI válida.');
  }
  // El modo SSL se define explícitamente más abajo; se quita de la URI para evitar ambigüedades.
  url.searchParams.delete('sslmode');

  const sslOff = process.env.DATABASE_SSL === 'off' && process.env.NODE_ENV !== 'production';
  const ca = loadCa();
  if (!ca && !sslOff) {
    console.warn(
      '⚠ Sin certificado CA (DATABASE_CA_CERT / DATABASE_CA_CERT_PATH): la conexión va cifrada pero el servidor no se verifica.',
    );
  }

  return new pg.Client({
    connectionString: url.toString(),
    ssl: sslOff ? false : ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    statement_timeout: 60000,
  });
}
