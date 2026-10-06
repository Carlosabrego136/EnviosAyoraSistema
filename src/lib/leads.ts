import 'server-only';
import { z } from 'zod';
import { query } from './db';
import { ValidationError } from './errors';
import { logger } from './logger';
import { assertLeadAllowed } from './rate-limit';
import { cleanLine, cleanMultiline, type RequestContext } from './security';

const leadSchema = z.object({
  kind: z.enum(['registro', 'contacto']),
  name: z.string().min(2, 'Escribe tu nombre.').max(120),
  business: z.string().max(120),
  phone: z
    .string()
    .transform((v) => v.replace(/[^\d+]/g, ''))
    .refine((v) => v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 15, 'Escribe un teléfono válido (10 dígitos).'),
  email: z
    .string()
    .max(120)
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), 'Correo no válido.'),
  message: z.string().max(1500),
});

/**
 * Registra una solicitud del sitio público. Devuelve `false` si se detectó un bot (honeypot):
 * al visitante se le muestra éxito, pero no se guarda nada.
 */
export async function submitLead(formData: FormData, ctx: RequestContext): Promise<boolean> {
  // Campo trampa: los humanos no lo ven; los bots lo llenan.
  if (cleanLine(formData.get('website'), 100) !== '') {
    logger.warn('lead.honeypot_triggered', { ipHash: ctx.ipHash });
    return false;
  }

  const parsed = leadSchema.safeParse({
    kind: formData.get('kind') === 'contacto' ? 'contacto' : 'registro',
    name: cleanLine(formData.get('name'), 120),
    business: cleanLine(formData.get('business'), 120),
    phone: cleanLine(formData.get('phone'), 30),
    email: cleanLine(formData.get('email'), 120).toLowerCase(),
    message: cleanMultiline(formData.get('message'), 1500),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    throw new ValidationError(fieldErrors);
  }
  if (formData.get('consent') !== 'on') {
    throw new ValidationError({ consent: 'Debes aceptar el aviso de privacidad para continuar.' });
  }

  await assertLeadAllowed(ctx.ipHash);

  const d = parsed.data;
  await query(
    `INSERT INTO leads (kind, name, business, phone, email, message, ip_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [d.kind, d.name, d.business, d.phone, d.email, d.message, ctx.ipHash],
  );
  logger.info('lead.created', { kind: d.kind });
  return true;
}
