'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { fenixLoginAction, fenixLogoutAction } from '@/app/fenix/actions';
import { Icon } from '@/components/Icon';
import type { ActionState } from '@/lib/errors';

const INITIAL: ActionState = {};

function Enter() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--solid btn--block" disabled={pending} aria-busy={pending}>
      {pending ? 'Verificando…' : 'Entrar'}
    </button>
  );
}

export function FenixLoginForm() {
  const [state, action] = useActionState(fenixLoginAction, INITIAL);
  return (
    <form action={action} className="adm-form adm-form--login" noValidate>
      {state.error && (
        <p className="form-alert" role="alert">
          <Icon name="alert" size={16} /> {state.error}
        </p>
      )}
      <div className="field">
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.values?.email} autoFocus />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Enter />
    </form>
  );
}

export function FenixLogoutButton() {
  return (
    <form action={fenixLogoutAction}>
      <button type="submit" className="adm-logout">Cerrar sesión</button>
    </form>
  );
}
