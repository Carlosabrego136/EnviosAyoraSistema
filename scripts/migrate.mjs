// Aplica las migraciones de db/migrations/*.sql en orden, cada una en su propia transacción.
// Uso: npm run db:migrate
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createClient, fail } from './_db.mjs';

const MIGRATIONS_DIR = resolve(process.cwd(), 'db/migrations');
const LOCK_KEY = 726_001; // advisory lock para evitar migraciones concurrentes

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();
  if (files.length === 0) fail('No hay migraciones en db/migrations.');

  const client = createClient();
  await client.connect();
  console.log('✔ Conectado a la base de datos.');

  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);

    const { rows } = await client.query('SELECT id FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.id));
    let count = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`• ${file} (ya aplicada)`);
        continue;
      }
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✔ ${file} aplicada`);
        count += 1;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw new Error(`Falló ${file}: ${err.message}`);
      }
    }
    console.log(count ? `\nListo: ${count} migración(es) aplicada(s).` : '\nBase de datos al día.');
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
    await client.end().catch(() => {});
  }
}

main().catch((err) => fail(err.message));
