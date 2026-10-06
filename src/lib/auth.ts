import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { query } from './db';
import { AuthError, ConfigError, ForbiddenError, ValidationError } from './errors';
import { logger } from './logger';
import { can, type Permission, type Role } from './permissions';

export const SESSION_COOKIE = 'fenix_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas
const BCRYPT_COST = 12;

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  token_version: number;
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new ConfigError('Falta SESSION_SECRET (mínimo 32 caracteres) en las variables de entorno.');
  }
  return new TextEncoder().encode(secret);
}

// ── Contraseñas ────────────────────────────────────────────────

const COMMON_PASSWORDS = new Set([
  'password1234',
  '123456789012',
  'qwertyuiop12',
  'contrasena123',
  'administrador',
  'fenix1234567',
]);

export function assertStrongPassword(password: string, field = 'password'): void {
  const problems: string[] = [];
  if (password.length < 12) problems.push('mínimo 12 caracteres');
  if (password.length > 128) problems.push('máximo 128 caracteres');
  if (!/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(password) || !/\d/.test(password)) problems.push('combina letras y números');
  if (COMMON_PASSWORDS.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) problems.push('es demasiado común');
  if (problems.length) {
    throw new ValidationError({ [field]: `Contraseña débil: ${problems.join(', ')}.` });
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

// Hash ficticio para igualar tiempos de respuesta cuando el correo no existe.
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO5Kq9zq1Vv3hO1iUq6mJ2c0w3m1nQe7y';

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  try {
    const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
    return hash !== null && ok;
  } catch (err) {
    logger.error('auth.bcrypt_failed', err);
    return false;
  }
}

// ── Sesión (JWT firmado en cookie httpOnly) ────────────────────

export async function createSession(user: SessionUser & { token_version: number }): Promise<void> {
  const token = await new SignJWT({ role: user.role, tv: user.token_version })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Devuelve el usuario de la sesión actual validando firma, expiración y que la cuenta siga activa
 * con la misma versión de token (se invalida al cambiar contraseña, rol o desactivar la cuenta).
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  let token: string | undefined;
  try {
    token = (await cookies()).get(SESSION_COOKIE)?.value;
  } catch {
    return null;
  }
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id)) return null;

    const rows = await query<UserRow>(
      'SELECT id, email, name, role, is_active, token_version FROM users WHERE id = $1',
      [id],
    );
    const row = rows[0];
    if (!row || !row.is_active || row.token_version !== payload.tv) return null;
    return { id: row.id, email: row.email, name: row.name, role: row.role };
  } catch (err) {
    // Token inválido/expirado o base de datos no disponible → sin sesión (estado seguro).
    if (!(err instanceof Error && err.name.startsWith('JWT'))) {
      logger.warn('auth.session_check_failed', { error: String(err) });
    }
    return null;
  }
});

/** Exige sesión; si no hay, redirige al login. Opcionalmente exige un permiso. */
export async function requireUser(permission?: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (permission && !can(user.role, permission)) {
    throw new ForbiddenError();
  }
  return user;
}

/** Versión para páginas: en vez de lanzar error, redirige al panel con aviso. */
export async function requirePageUser(permission?: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  if (permission && !can(user.role, permission)) redirect('/admin?aviso=sin-permiso');
  return user;
}

export { AuthError };
