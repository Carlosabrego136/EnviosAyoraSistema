'use server';

import { isDbConfigured } from '@/lib/db';
import { ConfigError, echoValues, toActionState, type ActionState } from '@/lib/errors';
import { submitLead } from '@/lib/leads';
import { getRequestContext } from '@/lib/security';

/** Formulario público (registro de comunidad / consulta). Nunca expone detalles internos. */
export async function submitLeadAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    if (!isDbConfigured()) {
      throw new ConfigError('El formulario estará disponible en breve. Mientras tanto, escríbenos por WhatsApp.');
    }
    const ctx = await getRequestContext();
    await submitLead(formData, ctx);
    return {
      ok: true,
      message: 'Nuestro equipo te contactará muy pronto. Si es urgente, escríbenos directamente por WhatsApp.',
    };
  } catch (err) {
    return { ...toActionState(err, 'lead.submit'), values: echoValues(formData) };
  }
}
