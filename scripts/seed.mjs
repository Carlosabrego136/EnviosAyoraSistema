// Crea el primer administrador y carga contenido de ejemplo (solo en tablas vacías).
// Uso: npm run db:seed        (agrega --no-sample para omitir el contenido de ejemplo)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { createClient, fail } from './_db.mjs';

const withSample = !process.argv.includes('--no-sample');

function nextDates(weekdays, weeks) {
  // Próximas fechas (hoy incluido) para los días de la semana indicados (0=dom … 6=sáb).
  const out = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < weeks * 7 && out.length < weeks * weekdays.length; i += 1) {
    if (weekdays.includes(cursor.getDay())) {
      out.push(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`,
      );
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

async function audit(client, action, entity, entityId, summary, after) {
  await client.query(
    `INSERT INTO audit_log (action, entity, entity_id, summary, after_data)
     VALUES ($1, $2, $3, $4, $5)`,
    [action, entity, String(entityId), summary, after ? JSON.stringify(after) : null],
  );
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || 'Administrador';
  const password = process.env.ADMIN_PASSWORD ?? '';

  const client = createClient();
  await client.connect();
  console.log('✔ Conectado a la base de datos.');

  try {
    await client.query('BEGIN');

    // ── Primer administrador ───────────────────────────────
    const { rows: userRows } = await client.query('SELECT count(*)::int AS n FROM users');
    if (userRows[0].n === 0) {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Define ADMIN_EMAIL (correo válido) para crear el primer administrador.');
      }
      if (password.length < 12) {
        throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
      }
      const hash = await bcrypt.hash(password, 12);
      const { rows } = await client.query(
        `INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, 'admin') RETURNING id`,
        [email, name, hash],
      );
      await audit(client, 'user.create', 'users', rows[0].id, `Primer administrador creado (${email})`, {
        email,
        name,
        role: 'admin',
      });
      console.log(`✔ Administrador creado: ${email}`);
    } else {
      console.log('• Ya existen usuarios: no se crea administrador.');
    }

    // ── Contenido de ejemplo (solo si la tabla está vacía) ──
    if (withSample) {
      const data = JSON.parse(readFileSync(resolve(process.cwd(), 'db/seed-data.json'), 'utf8'));
      const isEmpty = async (table) =>
        (await client.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n === 0;

      if (await isEmpty('slides')) {
        for (const s of data.slides) {
          await client.query(
            `INSERT INTO slides (eyebrow, title, subtitle, body, cta_label, cta_href, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [s.eyebrow, s.title, s.subtitle, s.body, s.cta_label, s.cta_href, s.sort_order],
          );
        }
        console.log(`✔ ${data.slides.length} slides de ejemplo`);
      }
      if (await isEmpty('stats')) {
        for (const s of data.stats) {
          await client.query(
            'INSERT INTO stats (value, label, caption, sort_order) VALUES ($1,$2,$3,$4)',
            [s.value, s.label, s.caption, s.sort_order],
          );
        }
        console.log(`✔ ${data.stats.length} indicadores de ejemplo`);
      }
      if (await isEmpty('services')) {
        for (const s of data.services) {
          await client.query(
            `INSERT INTO services (name, description, eta_text, icon, status, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [s.name, s.description, s.eta_text, s.icon, s.status, s.sort_order],
          );
        }
        console.log(`✔ ${data.services.length} servicios de ejemplo`);
      }
      if (await isEmpty('announcements')) {
        for (const a of data.announcements) {
          await client.query(
            `INSERT INTO announcements (category, title, body, published_on)
             VALUES ($1,$2,$3, CURRENT_DATE - $4::int)`,
            [a.category, a.title, a.body, a.days_ago],
          );
        }
        console.log(`✔ ${data.announcements.length} comunicados de ejemplo`);
      }
      if (await isEmpty('pickups')) {
        // Viernes (11:00–16:00) y sábado (10:00–13:00): ajusta los horarios reales desde el panel.
        const fridays = nextDates([5], 3);
        const saturdays = nextDates([6], 3);
        for (const d of fridays) {
          await client.query(
            `INSERT INTO pickups (pickup_date, start_time, end_time) VALUES ($1,'11:00','16:00')`,
            [d],
          );
        }
        for (const d of saturdays) {
          await client.query(
            `INSERT INTO pickups (pickup_date, start_time, end_time) VALUES ($1,'10:00','13:00')`,
            [d],
          );
        }
        console.log(`✔ ${fridays.length + saturdays.length} recolecciones de ejemplo`);
      }
      await audit(client, 'system.seed', 'system', 'seed', 'Contenido de ejemplo cargado');
    }

    await client.query('COMMIT');
    console.log('\nListo. Ingresa a /admin/login con el correo y la contraseña configurados.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((err) => fail(err.message));
