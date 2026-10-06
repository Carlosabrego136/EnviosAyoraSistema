'use server';

import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { writeAudit } from '@/lib/audit';
import { destroySession, getCurrentUser, requireUser } from '@/lib/auth';
import { createRow, deleteRow, parseForm, updateRow } from '@/lib/crud';
import { withTransaction } from '@/lib/db';
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  echoValues,
  toActionState,
  type ActionState,
} from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { Permission } from '@/lib/permissions';
import { getResource, type ResourceDef } from '@/lib/resources';
import { getRequestContext } from '@/lib/security';
import { saveSettings } from '@/lib/site-settings';
import { authenticate, changeOwnPassword, createUser, resetUserPassword, updateUser } from '@/lib/users';

const PASSWORD_FIELDS = ['password', 'current', 'next', 'confirm'];

function permissionFor(def: ResourceDef, mode: 'write' | 'delete'): Permission {
  if (def.permission === 'leads') return 'leads.manage';
  return mode === 'delete' ? 'content.delete' : 'content.write';
}

function actorOf(user: { id: number; email: string; name: string; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** Los cambios de contenido se reflejan de inmediato en el sitio público. */
function refreshPublicSite() {
  revalidatePath('/', 'layout');
}

function failure(err: unknown, context: string, formData: FormData): ActionState {
  unstable_rethrow(err); // deja pasar redirecciones internas de Next.js
  return { ...toActionState(err, context), values: echoValues(formData, PASSWORD_FIELDS) };
}

// ── Sesión ─────────────────────────────────────────────────────

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const ctx = await getRequestContext();
    await authenticate(formData.get('email'), formData.get('password'), ctx);
  } catch (err) {
    return failure(err, 'auth.login', formData);
  }
  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (user) {
      const ctx = await getRequestContext();
      await withTransaction((client) =>
        writeAudit(client, {
          actor: actorOf(user),
          action: 'auth.logout',
          entity: 'users',
          entityId: user.id,
          summary: 'Cierre de sesión',
          ctx,
        }),
      );
    }
  } catch (err) {
    unstable_rethrow(err);
    logger.warn('auth.logout_audit_failed', { error: String(err) });
  } finally {
    // Pase lo que pase, la sesión se cierra (estado seguro).
    await destroySession().catch(() => undefined);
  }
  redirect('/admin/login');
}

// ── Contenido (carrusel, comunicados, servicios, etc.) ─────────

export async function saveRecordAction(
  resourceKey: string,
  id: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let destination: string;
  try {
    const def = getResource(resourceKey);
    if (!def) throw new NotFoundError('El módulo solicitado no existe.');
    const editing = id > 0;
    if (!editing && !def.canCreate) throw new ForbiddenError('Este módulo no permite crear registros manualmente.');

    const user = await requireUser(permissionFor(def, 'write'));
    const values = parseForm(def, formData, editing);
    const ctx = await getRequestContext();

    if (editing) await updateRow(def, id, values, actorOf(user), ctx);
    else await createRow(def, values, actorOf(user), ctx);

    refreshPublicSite();
    destination = `/admin/c/${def.key}?ok=${editing ? 'editado' : 'creado'}`;
  } catch (err) {
    return failure(err, 'record.save', formData);
  }
  redirect(destination);
}

export async function deleteRecordAction(resourceKey: string, id: number): Promise<void> {
  let destination: string;
  try {
    const def = getResource(resourceKey);
    if (!def || !def.canDelete) throw new NotFoundError('El módulo solicitado no existe.');
    const user = await requireUser(permissionFor(def, 'delete'));
    const ctx = await getRequestContext();
    await deleteRow(def, id, actorOf(user), ctx);
    refreshPublicSite();
    destination = `/admin/c/${def.key}?ok=eliminado`;
  } catch (err) {
    unstable_rethrow(err);
    const key = err instanceof AppError ? err.code.toLowerCase() : 'interno';
    if (!(err instanceof AppError)) logger.error('record.delete.unexpected', err);
    destination = `/admin/c/${encodeURIComponent(resourceKey)}?error=${encodeURIComponent(key)}`;
  }
  redirect(destination);
}

// ── Ajustes del sitio ──────────────────────────────────────────

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser('settings.write');
    const ctx = await getRequestContext();
    const changed = await saveSettings(formData, actorOf(user), ctx);
    refreshPublicSite();
    return {
      ok: true,
      message: changed.length ? `Guardado: ${changed.length} ajuste(s) actualizado(s).` : 'No hubo cambios que guardar.',
    };
  } catch (err) {
    return failure(err, 'settings.save', formData);
  }
}

// ── Usuarios ───────────────────────────────────────────────────

export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser('users.manage');
    const ctx = await getRequestContext();
    await createUser(Object.fromEntries(formData.entries()), actorOf(user), ctx);
  } catch (err) {
    return failure(err, 'user.create', formData);
  }
  redirect('/admin/usuarios?ok=creado');
}

export async function updateUserAction(id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser('users.manage');
    const ctx = await getRequestContext();
    await updateUser(
      id,
      {
        name: formData.get('name'),
        role: formData.get('role'),
        is_active: formData.get('is_active') === 'on',
      },
      actorOf(user),
      ctx,
    );
  } catch (err) {
    return failure(err, 'user.update', formData);
  }
  redirect('/admin/usuarios?ok=editado');
}

export async function resetPasswordAction(id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser('users.manage');
    const ctx = await getRequestContext();
    const password = String(formData.get('password') ?? '');
    const confirm = String(formData.get('confirm') ?? '');
    if (password !== confirm) throw new ValidationError({ confirm: 'Las contraseñas no coinciden.' });
    await resetUserPassword(id, password, actorOf(user), ctx);
    return { ok: true, message: 'Contraseña restablecida. Se cerraron las sesiones abiertas de esa cuenta.' };
  } catch (err) {
    return failure(err, 'user.reset_password', formData);
  }
}

export async function changeOwnPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const ctx = await getRequestContext();
    const current = String(formData.get('current') ?? '');
    const next = String(formData.get('next') ?? '');
    const confirm = String(formData.get('confirm') ?? '');
    if (next !== confirm) throw new ValidationError({ confirm: 'Las contraseñas no coinciden.' });
    await changeOwnPassword(actorOf(user), current, next, ctx);
  } catch (err) {
    return failure(err, 'user.change_password', formData);
  }
  // La contraseña cambió: todas las sesiones previas quedan invalidadas, incluida esta.
  await destroySession().catch(() => undefined);
  redirect('/admin/login?cambio=1');
}
