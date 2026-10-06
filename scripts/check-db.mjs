// Verifica que las credenciales de Aiven funcionen y que el esquema esté aplicado.
// Uso: npm run db:check
import { createClient, fail } from './_db.mjs';

async function main() {
  const client = createClient();
  await client.connect();
  const { rows } = await client.query('SELECT version() AS v, now() AS t');
  console.log(`✔ Conexión correcta · ${rows[0].v.split(',')[0]}`);

  const { rows: tables } = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1`,
  );
  const names = new Set(tables.map((t) => t.table_name));
  const required = ['users', 'audit_log', 'slides', 'services', 'pickups', 'announcements', 'stats', 'leads', 'site_settings'];
  const missing = required.filter((t) => !names.has(t));
  if (missing.length) {
    console.log(`⚠ Faltan tablas: ${missing.join(', ')} → ejecuta: npm run db:migrate`);
  } else {
    console.log('✔ Esquema completo.');
  }
  await client.end();
}

main().catch((err) => fail(`No se pudo conectar: ${err.message}`));
