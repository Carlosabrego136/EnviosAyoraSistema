import 'server-only';
import { query } from './db';
import { RateLimitError } from './errors';

const LOGIN_WINDOW_MIN = 15;
const LOGIN_MAX_PER_IP = 12;
const LOGIN_MAX_PER_EMAIL = 6;

/** Bloquea si hay demasiados intentos fallidos recientes por IP o por correo. */
export async function assertLoginAllowed(email: string, ipHash: string): Promise<void> {
  const rows = await query<{ by_ip: number; by_email: number }>(
    `SELECT
       count(*) FILTER (WHERE ip_hash = $1)::int AS by_ip,
       count(*) FILTER (WHERE lower(email) = lower($2))::int AS by_email
     FROM login_attempts
     WHERE success = FALSE AND created_at > now() - make_interval(mins => $3)`,
    [ipHash, email, LOGIN_WINDOW_MIN],
  );
  const r = rows[0];
  if (r && (r.by_ip >= LOGIN_MAX_PER_IP || r.by_email >= LOGIN_MAX_PER_EMAIL)) {
    throw new RateLimitError(`Demasiados intentos fallidos. Espera ${LOGIN_WINDOW_MIN} minutos e inténtalo de nuevo.`);
  }
}

export async function recordLoginAttempt(email: string, ipHash: string, success: boolean): Promise<void> {
  await query('INSERT INTO login_attempts (email, ip_hash, success) VALUES ($1, $2, $3)', [
    email.slice(0, 200),
    ipHash,
    success,
  ]);
  // Limpieza ocasional de registros viejos (≈2 % de las veces) para que la tabla no crezca sin límite.
  if (Math.random() < 0.02) {
    await query(`DELETE FROM login_attempts WHERE created_at < now() - interval '7 days'`).catch(() => undefined);
  }
}

/** Limita los envíos de formularios públicos por IP y a nivel global. */
export async function assertLeadAllowed(ipHash: string): Promise<void> {
  const rows = await query<{ by_ip: number; total: number }>(
    `SELECT
       count(*) FILTER (WHERE ip_hash = $1)::int AS by_ip,
       count(*)::int AS total
     FROM leads WHERE created_at > now() - interval '1 hour'`,
    [ipHash],
  );
  const r = rows[0];
  if (r && (r.by_ip >= 5 || r.total >= 300)) {
    throw new RateLimitError('Recibimos varias solicitudes desde tu conexión. Inténtalo de nuevo en una hora o escríbenos por WhatsApp.');
  }
}
