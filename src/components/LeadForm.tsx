'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitLeadAction } from '@/app/actions';
import type { ActionState } from '@/lib/errors';
import { Icon } from './Icon';

const INITIAL: ActionState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--solid btn--block" disabled={pending} aria-busy={pending}>
      {pending ? 'Enviando…' : 'Enviar solicitud'}
      {!pending && <Icon name="arrow" size={16} />}
    </button>
  );
}

export function LeadForm({ whatsappHref }: { whatsappHref: string }) {
  const [state, action] = useActionState(submitLeadAction, INITIAL);
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="form-success" role="status">
        <span className="form-success__icon">
          <Icon name="check" size={26} />
        </span>
        <h3>¡Recibimos tu solicitud!</h3>
        <p>{state.message}</p>
        <a className="btn btn--wa" href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={18} /> Escribirnos por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="form" noValidate>
      {state.error && !state.fieldErrors && (
        <p className="form-alert" role="alert">
          <Icon name="alert" size={16} /> {state.error}
        </p>
      )}

      <div className="field">
        <label htmlFor="kind">¿Qué necesitas?</label>
        <select id="kind" name="kind" defaultValue={v.kind ?? 'registro'}>
          <option value="registro">Registrarme como comerciante</option>
          <option value="contacto">Hacer una consulta</option>
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="name">Nombre *</label>
          <input id="name" name="name" type="text" autoComplete="name" maxLength={120} required defaultValue={v.name} aria-invalid={Boolean(fe.name)} aria-describedby={fe.name ? 'err-name' : undefined} />
          {fe.name && <span id="err-name" className="field__error">{fe.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="business">Negocio</label>
          <input id="business" name="business" type="text" autoComplete="organization" maxLength={120} defaultValue={v.business} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="phone">Teléfono / WhatsApp *</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} required defaultValue={v.phone} aria-invalid={Boolean(fe.phone)} aria-describedby={fe.phone ? 'err-phone' : undefined} />
          {fe.phone && <span id="err-phone" className="field__error">{fe.phone}</span>}
        </div>
        <div className="field">
          <label htmlFor="email">Correo (opcional)</label>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={120} defaultValue={v.email} aria-invalid={Boolean(fe.email)} aria-describedby={fe.email ? 'err-email' : undefined} />
          {fe.email && <span id="err-email" className="field__error">{fe.email}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="message">Mensaje (opcional)</label>
        <textarea id="message" name="message" rows={3} maxLength={1500} defaultValue={v.message} placeholder="Cuéntanos qué envías y a dónde." />
      </div>

      {/* Campo trampa anti-bots: invisible para personas. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">No llenar</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field field--check">
        <input id="consent" name="consent" type="checkbox" defaultChecked={v.consent === 'on'} aria-invalid={Boolean(fe.consent)} />
        <label htmlFor="consent">
          Acepto el <Link href="/privacidad">aviso de privacidad</Link>.
        </label>
        {fe.consent && <span className="field__error">{fe.consent}</span>}
      </div>

      <Submit />
    </form>
  );
}
