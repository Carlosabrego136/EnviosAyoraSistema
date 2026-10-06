'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  changeOwnPasswordAction,
  createUserAction,
  loginAction,
  logoutAction,
  resetPasswordAction,
  saveSettingsAction,
  updateUserAction,
} from '@/app/admin/actions';
import { Icon } from '@/components/Icon';
import type { ActionState } from '@/lib/errors';
import type { SettingDef } from '@/lib/settings';

const INITIAL: ActionState = {};

function Submit({ label, pendingLabel = 'Guardando…', block = false }: { label: string; pendingLabel?: string; block?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn--solid ${block ? 'btn--block' : ''}`} disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

function Alert({ state }: { state: ActionState }) {
  if (state.error && !state.fieldErrors) {
    return (
      <p className="form-alert" role="alert">
        <Icon name="alert" size={16} /> {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p className="form-ok" role="status">
        <Icon name="check" size={16} /> {state.message}
      </p>
    );
  }
  return null;
}

function Err({ state, name }: { state: ActionState; name: string }) {
  const msg = state.fieldErrors?.[name];
  return msg ? <span className="field__error">{msg}</span> : null;
}

// ── Inicio de sesión ───────────────────────────────────────────

export function LoginForm({ passwordChanged }: { passwordChanged: boolean }) {
  const [state, action] = useActionState(loginAction, INITIAL);
  return (
    <form action={action} className="adm-form adm-form--login" noValidate>
      {passwordChanged && (
        <p className="form-ok" role="status">
          <Icon name="check" size={16} /> Contraseña actualizada. Inicia sesión de nuevo.
        </p>
      )}
      <Alert state={state} />
      <div className="field">
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.values?.email} autoFocus />
      </div>
      <div className="field">
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Submit label="Entrar" pendingLabel="Verificando…" block />
    </form>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="adm-logout">
        Cerrar sesión
      </button>
    </form>
  );
}

// ── Ajustes del sitio ──────────────────────────────────────────

export function SettingsForm({ defs, values }: { defs: SettingDef[]; values: Record<string, string> }) {
  const [state, action] = useActionState(saveSettingsAction, INITIAL);
  const groups = Array.from(new Set(defs.map((d) => d.group)));
  const valueOf = (key: string) => state.values?.[key] ?? values[key] ?? '';

  return (
    <form action={action} className="adm-form" noValidate>
      <Alert state={state} />
      {groups.map((group) => (
        <fieldset key={group} className="adm-group">
          <legend>{group}</legend>
          <div className="adm-form__grid">
            {defs
              .filter((d) => d.group === group)
              .map((d) => (
                <div key={d.key} className={`field ${d.type === 'textarea' ? 'field--wide' : ''}`}>
                  <label htmlFor={d.key}>{d.label}</label>
                  {d.type === 'textarea' ? (
                    <textarea id={d.key} name={d.key} rows={d.max > 1000 ? 14 : 4} maxLength={d.max} defaultValue={valueOf(d.key)} aria-invalid={Boolean(state.fieldErrors?.[d.key])} />
                  ) : (
                    <input id={d.key} name={d.key} type={d.type === 'email' ? 'email' : d.type === 'phone' ? 'tel' : 'text'} maxLength={d.max} defaultValue={valueOf(d.key)} aria-invalid={Boolean(state.fieldErrors?.[d.key])} />
                  )}
                  {d.help && !state.fieldErrors?.[d.key] && <span className="field__help">{d.help}</span>}
                  <Err state={state} name={d.key} />
                </div>
              ))}
          </div>
        </fieldset>
      ))}
      <div className="adm-form__actions adm-form__actions--sticky">
        <Submit label="Guardar ajustes" />
      </div>
    </form>
  );
}

// ── Usuarios ───────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'worker', label: 'Trabajador (contenido y solicitudes)' },
  { value: 'admin', label: 'Administrador (todo)' },
];

export function NewUserForm() {
  const [state, action] = useActionState(createUserAction, INITIAL);
  const v = state.values ?? {};
  return (
    <form action={action} className="adm-form" noValidate>
      <Alert state={state} />
      <div className="adm-form__grid">
        <div className="field">
          <label htmlFor="name">Nombre *</label>
          <input id="name" name="name" type="text" defaultValue={v.name} maxLength={80} aria-invalid={Boolean(state.fieldErrors?.name)} />
          <Err state={state} name="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Correo *</label>
          <input id="email" name="email" type="email" autoComplete="off" defaultValue={v.email} maxLength={120} aria-invalid={Boolean(state.fieldErrors?.email)} />
          <Err state={state} name="email" />
        </div>
        <div className="field">
          <label htmlFor="role">Rol *</label>
          <select id="role" name="role" defaultValue={v.role ?? 'worker'}>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Err state={state} name="role" />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña inicial *</label>
          <input id="password" name="password" type="password" autoComplete="new-password" maxLength={128} aria-invalid={Boolean(state.fieldErrors?.password)} />
          <span className="field__help">Mínimo 12 caracteres, con letras y números.</span>
          <Err state={state} name="password" />
        </div>
      </div>
      <div className="adm-form__actions">
        <Submit label="Crear usuario" />
      </div>
    </form>
  );
}

export function EditUserForm({ id, name, role, isActive, isSelf }: { id: number; name: string; role: string; isActive: boolean; isSelf: boolean }) {
  const [state, action] = useActionState(updateUserAction.bind(null, id), INITIAL);
  const v = state.values ?? {};
  return (
    <form action={action} className="adm-form" noValidate>
      <Alert state={state} />
      <div className="adm-form__grid">
        <div className="field">
          <label htmlFor="name">Nombre *</label>
          <input id="name" name="name" type="text" defaultValue={v.name ?? name} maxLength={80} aria-invalid={Boolean(state.fieldErrors?.name)} />
          <Err state={state} name="name" />
        </div>
        <div className="field">
          <label htmlFor="role">Rol *</label>
          <select id="role" name="role" defaultValue={v.role ?? role} disabled={isSelf}>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {isSelf && <input type="hidden" name="role" value={role} />}
          <Err state={state} name="role" />
        </div>
        <div className="field field--check field--wide">
          <input id="is_active" name="is_active" type="checkbox" defaultChecked={isSelf ? true : v.is_active ? v.is_active === 'on' : isActive} disabled={isSelf} />
          {isSelf && <input type="hidden" name="is_active" value="on" />}
          <label htmlFor="is_active">Cuenta activa (puede iniciar sesión)</label>
        </div>
      </div>
      <div className="adm-form__actions">
        <Submit label="Guardar cambios" />
      </div>
    </form>
  );
}

export function ResetPasswordForm({ id }: { id: number }) {
  const [state, action] = useActionState(resetPasswordAction.bind(null, id), INITIAL);
  return (
    <form action={action} className="adm-form" noValidate>
      <Alert state={state} />
      <div className="adm-form__grid">
        <div className="field">
          <label htmlFor="password">Nueva contraseña</label>
          <input id="password" name="password" type="password" autoComplete="new-password" maxLength={128} aria-invalid={Boolean(state.fieldErrors?.password)} />
          <Err state={state} name="password" />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirmar contraseña</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" maxLength={128} aria-invalid={Boolean(state.fieldErrors?.confirm)} />
          <Err state={state} name="confirm" />
        </div>
      </div>
      <div className="adm-form__actions">
        <Submit label="Restablecer contraseña" />
      </div>
    </form>
  );
}

export function OwnPasswordForm() {
  const [state, action] = useActionState(changeOwnPasswordAction, INITIAL);
  return (
    <form action={action} className="adm-form" noValidate>
      <Alert state={state} />
      <div className="adm-form__grid">
        <div className="field field--wide">
          <label htmlFor="current">Contraseña actual</label>
          <input id="current" name="current" type="password" autoComplete="current-password" maxLength={128} aria-invalid={Boolean(state.fieldErrors?.current)} />
          <Err state={state} name="current" />
        </div>
        <div className="field">
          <label htmlFor="next">Nueva contraseña</label>
          <input id="next" name="next" type="password" autoComplete="new-password" maxLength={128} aria-invalid={Boolean(state.fieldErrors?.next)} />
          <span className="field__help">Mínimo 12 caracteres, con letras y números.</span>
          <Err state={state} name="next" />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirmar nueva contraseña</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" maxLength={128} aria-invalid={Boolean(state.fieldErrors?.confirm)} />
          <Err state={state} name="confirm" />
        </div>
      </div>
      <div className="adm-form__actions">
        <Submit label="Cambiar contraseña" />
      </div>
    </form>
  );
}
