import 'server-only';
import { z } from 'zod';
import { writeAudit, type Actor } from './audit';
import { assertStrongPassword, createSession, hashPassword, verifyPassword } from './auth';
import { query, withTransaction } from './db';
import { AuthError, ConflictError, ForbiddenError, NotFoundError, RateLimitError, ValidationError } from './errors';
import { logger } from './logger';
import { assertLoginAllowed, recordLoginAttempt } from './rate-limit';
import type { Role } from './permissions';
import { cleanLine, type RequestContext } from './security';

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export interface UserRecord {
  id: number;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Correo no válido.')
  .max(120, 'Correo demasiado largo.');
const nameSchema = z.string().trim().min(2, 'Escribe el nombre completo.').max(80, 'Nombre demasiado largo.');
const roleSchema = z.enum(['admin', 'worker'], { errorMap: () => ({ message: 'Rol no válido.' }) });

function zodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function parseWith<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new ValidationError(zodErrors(result.error));
  return result.data;
}

// ── Inicio de sesión ───────────────────────────────────────────

interface LoginRow {
  id: number;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  is_active: boolean;
  failed_attempts: number;
  locked_until: Date | null;
  token_version: number;
}

export async function authenticate(rawEmail: unknown, rawPassword: unknown, ctx: RequestContext): Promise<void> {
  const email = cleanLine(rawEmail, 120).toLowerCase();
  const password = typeof rawPassword === 'string' ? rawPassword.slice(0, 200) : '';
  if (!email || !password) throw new AuthError();

  await assertLoginAllowed(email, ctx.ipHash);

  const rows = await query<LoginRow>(
    `SELECT id, email, name, role, password_hash, is_active, failed_attempts, locked_until, token_version
     FROM users WHERE lower(email) = lower($1)`,
    [email],
  );
  const user = rows[0];

  if (user?.locked_until && user.locked_until.getTime() > Date.now()) {
    await recordLoginAttempt(email, ctx.ipHash, false);
    throw new RateLimitError(`Cuenta bloqueada temporalmente por intentos fallidos. Inténtalo en ${LOCK_MINUTES} minutos.`);
  }

  const passwordOk = await verifyPassword(password, user?.password_hash ?? null);

  if (!user || !user.is_active || !passwordOk) {
    await recordLoginAttempt(email, ctx.ipHash, false);
    if (user) {
      await withTransaction(async (client) => {
        const { rows: updated } = await client.query<{ failed_attempts: number }>(
          `UPDATE users
             SET failed_attempts = failed_attempts + 1,
                 locked_until = CASE WHEN failed_attempts + 1 >= $2 THEN now() + make_interval(mins => $3) ELSE locked_until END
           WHERE id = $1 RETURNING failed_attempts`,
          [user.id, MAX_FAILED, LOCK_MINUTES],
        );
        await writeAudit(client, {
          actor: { id: user.id, email: user.email, name: user.name, role: user.role },
          action: 'auth.login_failed',
          entity: 'users',
          entityId: user.id,
          summary: `Intento de acceso fallido (${updated[0]?.failed_attempts ?? '?'} seguido/s)`,
          ctx,
        });
      }).catch((err) => logger.error('auth.failed_login_bookkeeping', err));
    }
    throw new AuthError();
  }

  // Acceso correcto: reinicia contador y deja constancia en la bitácora (misma transacción).
  await withTransaction(async (client) => {
    await client.query('UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = now() WHERE id = $1', [user.id]);
    await writeAudit(client, {
      actor: { id: user.id, email: user.email, name: user.name, role: user.role },
      action: 'auth.login',
      entity: 'users',
      entityId: user.id,
      summary: 'Inicio de sesión',
      ctx,
    });
  });
  await recordLoginAttempt(email, ctx.ipHash, true).catch((err) => logger.warn('auth.attempt_log_failed', { error: String(err) }));
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, token_version: user.token_version });
}

// ── Gestión de usuarios (solo administradores) ─────────────────

export async function listUsers(): Promise<UserRecord[]> {
  return query<UserRecord>(
    'SELECT id, email, name, role, is_active, last_login_at, created_at FROM users ORDER BY is_active DESC, role, name',
  );
}

export async function getUser(id: number): Promise<UserRecord | null> {
  const rows = await query<UserRecord>(
    'SELECT id, email, name, role, is_active, last_login_at, created_at FROM users WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}

export async function createUser(raw: Record<string, unknown>, actor: Actor, ctx: RequestContext): Promise<number> {
  const input = parseWith(
    z.object({ name: nameSchema, email: emailSchema, role: roleSchema, password: z.string().max(128) }),
    { name: raw.name, email: raw.email, role: raw.role, password: raw.password },
  );
  assertStrongPassword(input.password);
  const hash = await hashPassword(input.password);

  return withTransaction(async (client) => {
    const { rows } = await client.query<UserRecord>(
      `INSERT INTO users (email, name, password_hash, role) VALUES ($1,$2,$3,$4)
       RETURNING id, email, name, role, is_active`,
      [input.email, input.name, hash, input.role],
    ).catch((err: { code?: string }) => {
      if (err.code === '23505') throw new ConflictError('Ya existe un usuario con ese correo.');
      throw err;
    });
    const created = rows[0];
    await writeAudit(client, {
      actor,
      action: 'users.create',
      entity: 'users',
      entityId: created.id,
      summary: `Creó usuario ${created.email} (${created.role})`,
      after: created,
      ctx,
    });
    return created.id;
  });
}

export async function updateUser(id: number, raw: Record<string, unknown>, actor: Actor, ctx: RequestContext): Promise<void> {
  const input = parseWith(
    z.object({ name: nameSchema, role: roleSchema, is_active: z.boolean() }),
    { name: raw.name, role: raw.role, is_active: raw.is_active },
  );

  await withTransaction(async (client) => {
    // Bloquea a todos los administradores activos para validar la regla del "último admin" sin carreras.
    const { rows: admins } = await client.query<{ id: number }>(
      `SELECT id FROM users WHERE role = 'admin' AND is_active FOR UPDATE`,
    );
    const { rows } = await client.query<UserRecord & { token_version: number }>(
      'SELECT id, email, name, role, is_active, token_version FROM users WHERE id = $1 FOR UPDATE',
      [id],
    );
    const before = rows[0];
    if (!before) throw new NotFoundError('El usuario no existe.');

    const losesAdmin = before.role === 'admin' && before.is_active && (input.role !== 'admin' || !input.is_active);
    if (losesAdmin) {
      if (before.id === actor.id) throw new ForbiddenError('No puedes quitarte tu propio acceso de administrador ni desactivarte.');
      if (admins.length <= 1) throw new ForbiddenError('Debe quedar al menos un administrador activo.');
    }

    const sessionAffected = before.role !== input.role || before.is_active !== input.is_active;
    const { rows: updated } = await client.query<UserRecord>(
      `UPDATE users SET name = $2, role = $3, is_active = $4,
              token_version = token_version + $5::int
       WHERE id = $1 RETURNING id, email, name, role, is_active`,
      [id, input.name, input.role, input.is_active, sessionAffected ? 1 : 0],
    );
    const after = updated[0];
    const { token_version: _tv, ...beforeClean } = before;
    void _tv;

    if (JSON.stringify(beforeClean) === JSON.stringify(after)) return;
    await writeAudit(client, {
      actor,
      action: 'users.update',
      entity: 'users',
      entityId: id,
      summary: `Editó usuario ${after.email}`,
      before: beforeClean,
      after,
      ctx,
    });
  });
}

export async function resetUserPassword(id: number, newPassword: string, actor: Actor, ctx: RequestContext): Promise<void> {
  assertStrongPassword(newPassword, 'password');
  const hash = await hashPassword(newPassword);
  await withTransaction(async (client) => {
    const { rows } = await client.query<{ email: string }>(
      `UPDATE users SET password_hash = $2, failed_attempts = 0, locked_until = NULL, token_version = token_version + 1
       WHERE id = $1 RETURNING email`,
      [id, hash],
    );
    if (!rows[0]) throw new NotFoundError('El usuario no existe.');
    await writeAudit(client, {
      actor,
      action: 'users.password_reset',
      entity: 'users',
      entityId: id,
      summary: `Restableció la contraseña de ${rows[0].email}`,
      ctx,
    });
  });
}

/** Cambia la contraseña propia. Invalida todas las sesiones abiertas de la cuenta. */
export async function changeOwnPassword(actor: Actor, current: string, next: string, ctx: RequestContext): Promise<void> {
  assertStrongPassword(next, 'next');
  const rows = await query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [actor.id]);
  const ok = await verifyPassword(current, rows[0]?.password_hash ?? null);
  if (!ok) throw new ValidationError({ current: 'La contraseña actual no es correcta.' });
  if (current === next) throw new ValidationError({ next: 'La nueva contraseña debe ser distinta.' });

  const hash = await hashPassword(next);
  await withTransaction(async (client) => {
    await client.query('UPDATE users SET password_hash = $2, token_version = token_version + 1 WHERE id = $1', [actor.id, hash]);
    await writeAudit(client, {
      actor,
      action: 'users.password_change',
      entity: 'users',
      entityId: actor.id ?? '',
      summary: 'Cambió su propia contraseña',
      ctx,
    });
  });
}
