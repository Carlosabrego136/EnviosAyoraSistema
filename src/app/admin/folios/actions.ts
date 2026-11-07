'use server';

import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { echoValues, toActionState, ValidationError, type ActionState } from '@/lib/errors';
import { cancelFolio, createFolio, setPaid, updateFolio } from '@/lib/folios';
import { getRequestContext } from '@/lib/security';
import { loadSettings } from '@/lib/site-settings';

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
    carrier_guide: formData.get('carrier_guide'),
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
    const settings = await loadSettings();
    const { folio } = await createFolio(readInput(formData), settings.folio_branch, actorOf(user), ctx);
    revalidatePath('/admin/folios');
    destination = `/admin/folios/${folio.id}?nuevo=1`;
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
    revalidatePath('/admin/folios', 'layout');
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
    revalidatePath('/admin/folios', 'layout');
    destination = `/admin/folios/${id}?cancelado=1`;
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
    revalidatePath('/admin/folios', 'layout');
    destination = `/admin/folios/${id}?ok=${paid ? 'cobrado' : 'pendiente'}`;
  } catch (err) {
    unstable_rethrow(err);
    destination = `/admin/folios/${id}?error=interno`;
  }
  redirect(destination);
}
