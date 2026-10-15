'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { importMerchantsAction, importRatesAction } from '@/app/admin/actions';
import { Icon } from '@/components/Icon';
import type { ActionState } from '@/lib/errors';

const INITIAL: ActionState = {};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--solid" disabled={pending} aria-busy={pending}>
      {pending ? 'Importando…' : label}
    </button>
  );
}

export function ImportForm({ kind }: { kind: 'rates' | 'merchants' }) {
  const [state, action] = useActionState(kind === 'rates' ? importRatesAction : importMerchantsAction, INITIAL);
  return (
    <form action={action} className="adm-import" noValidate>
      {state.error && (
        <p className="form-alert" role="alert">
          <Icon name="alert" size={16} /> {state.fieldErrors?.data ?? state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="form-ok" role="status">
          <Icon name="check" size={16} /> {state.message}
        </p>
      )}
      <div className="field field--wide">
        <label htmlFor={`data-${kind}`}>Pega aquí tu tabla</label>
        <textarea id={`data-${kind}`} name="data" rows={10} spellCheck={false} placeholder="Pega las filas copiadas desde Excel…" />
      </div>
      {kind === 'rates' && (
        <div className="field field--check field--wide">
          <input id="replace" name="replace" type="checkbox" />
          <label htmlFor="replace">Reemplazar todo el tabulador actual (borra las tarifas que ya están cargadas)</label>
        </div>
      )}
      <div className="adm-form__actions">
        <Submit label={kind === 'rates' ? 'Importar tarifas' : 'Importar comerciantes'} />
      </div>
    </form>
  );
}
