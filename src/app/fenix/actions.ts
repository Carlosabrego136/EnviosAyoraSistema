'use server';

import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { writeAudit } from '@/lib/audit';
import { destroySession, getCurrentUser, requireUser } from '@/lib/auth';
import { withTransaction } from '@/lib/db';
import { logger } from '@/lib/logger';
import { echoValues, toActionState, ValidationError, type ActionState } from '@/lib/errors';
import { cancelFolio, createFolio, setPaid, updateFolio } from '@/lib/folios';
import { getRequestContext } from '@/lib/security';
import { authenticate } from '@/lib/users';

function actorOf(user: { id: number; email: string; name: string; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function failure(err: unknown, context: string, formData: FormData): ActionState {
  unstable_rethrow(err); // deja pasar redirecciones internas de Next.js
  return { ...toActionState(err, context), values: echoValues(formData) };
}

function readInput(formData: FormData) {
  return {
    request_id: formData.get('request_id'),
    sender_name: formData.get('sender_name'),
    sender_phone: formData.get('sender_phone'),
    recipient_name: formData.get('recipient_name'),
    collector: formData.get('collector'),
    branch_id: formData.get('branch_id'),
    notes: formData.get('notes'),
    weight_kg: formData.get('weight_kg'),
    paid: formData.get('paid') === 'on',
  };
}

export async function createFolioAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let destination: string;
  try {
    const user = await requireUser('folios.operate');
    const ctx = await getRequestContext();
    const { folio } = await createFolio(readInput(formData), actorOf(user), ctx);
    revalidatePath('/fenix');
    destination = `/fenix/folio/${folio.id}?nuevo=1`;
  } catch (err) {
    return failure(err, 'folios.create', formData);
  }
  redirect(destination);
}

export async function updateFolioAction(id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser('folios.operate');
    if (!Number.isSafeInteger(id) || id <= 0) throw new ValidationError({}, 'Folio inválido.');
    const ctx = await getRequestContext();
    await updateFolio(id, readInput(formData), actorOf(user), ctx);
    revalidatePath('/fenix', 'layout');
    return { ok: true, message: 'Cambios guardados.' };
  } catch (err) {
    return failure(err, 'folios.update', formData);
  }
}

export async function cancelFolioAction(id: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  let destination: string;
  try {
    const user = await requireUser('folios.operate');
    if (!Number.isSafeInteger(id) || id <= 0) throw new ValidationError({}, 'Folio inválido.');
    const ctx = await getRequestContext();
    await cancelFolio(id, { reason: formData.get('reason') }, actorOf(user), ctx);
    revalidatePath('/fenix', 'layout');
    destination = `/fenix/folio/${id}?cancelado=1`;
  } catch (err) {
    return failure(err, 'folios.cancel', formData);
  }
  redirect(destination);
}

export async function togglePaidAction(id: number, paid: boolean): Promise<void> {
  let destination: string;
  try {
    const user = await requireUser('folios.operate');
    if (!Number.isSafeInteger(id) || id <= 0) throw new ValidationError({}, 'Folio inválido.');
    const ctx = await getRequestContext();
    await setPaid(id, paid === true, actorOf(user), ctx);
    revalidatePath('/fenix', 'layout');
    destination = `/fenix/folio/${id}?ok=${paid ? 'cobrado' : 'pendiente'}`;
  } catch (err) {
    unstable_rethrow(err);
    destination = `/fenix/folio/${id}?error=interno`;
  }
  redirect(destination);
}

// ── Acceso propio de la sección Fénix Point ────────────────────────────────
const PASSWORD_FIELDS = ['password'];

export async function fenixLoginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const ctx = await getRequestContext();
    await authenticate(formData.get('email'), formData.get('password'), ctx);
  } catch (err) {
    unstable_rethrow(err);
    return { ...toActionState(err, 'fenix.login'), values: echoValues(formData, PASSWORD_FIELDS) };
  }
  redirect('/fenix');
}

export async function fenixLogoutAction(): Promise<void> {
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
          summary: 'Cierre de sesión (Fénix Point)',
          ctx,
        }),
      );
    }
  } catch (err) {
    unstable_rethrow(err);
    logger.warn('fenix.logout_audit_failed', { error: String(err) });
  } finally {
    await destroySession().catch(() => undefined);
  }
  redirect('/fenix/login');
}
