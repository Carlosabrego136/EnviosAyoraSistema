'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveRecordAction } from '@/app/admin/actions';
import { Icon } from '@/components/Icon';
import type { ActionState } from '@/lib/errors';
import type { FieldDef } from '@/lib/resources';

const INITIAL: ActionState = {};

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn--solid" disabled={pending} aria-busy={pending}>
      {pending ? 'Guardando…' : label}
    </button>
  );
}

function display(field: FieldDef, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (field.type === 'select') return field.options?.find((o) => o.value === value)?.label ?? String(value);
  return String(value);
}

export function RecordForm({
  resourceKey,
  id,
  fields,
  values,
  backHref,
}: {
  resourceKey: string;
  id: number;
  fields: FieldDef[];
  values: Record<string, unknown>;
  backHref: string;
}) {
  const [state, action] = useActionState(saveRecordAction.bind(null, resourceKey, id), INITIAL);
  const errors = state.fieldErrors ?? {};
  const echoed = state.values;

  const valueOf = (f: FieldDef): string => {
    if (echoed && f.name in echoed) return echoed[f.name];
    const v = values[f.name];
    return v === null || v === undefined ? '' : String(v);
  };

  return (
    <form action={action} className="adm-form" noValidate>
      {state.error && (
        <p className="form-alert" role="alert">
          <Icon name="alert" size={16} /> {state.error}
        </p>
      )}

      <div className="adm-form__grid">
        {fields.map((f) => {
          const err = errors[f.name];
          const wide = f.wide || f.type === 'textarea';

          if (f.displayOnly) {
            return (
              <div key={f.name} className={`field ${wide ? 'field--wide' : ''}`}>
                <span className="field__label">{f.label}</span>
                <div className="readonly">{display(f, values[f.name])}</div>
              </div>
            );
          }

          if (f.type === 'checkbox') {
            const checked = echoed ? echoed[f.name] === 'on' : Boolean(values[f.name]);
            return (
              <div key={f.name} className="field field--check field--wide">
                <input id={f.name} name={f.name} type="checkbox" defaultChecked={checked} />
                <label htmlFor={f.name}>{f.label}</label>
              </div>
            );
          }

          return (
            <div key={f.name} className={`field ${wide ? 'field--wide' : ''}`}>
              <label htmlFor={f.name}>
                {f.label}
                {f.required ? ' *' : ''}
              </label>
              {f.type === 'textarea' ? (
                <textarea id={f.name} name={f.name} rows={5} maxLength={f.max} defaultValue={valueOf(f)} placeholder={f.placeholder} aria-invalid={Boolean(err)} />
              ) : f.type === 'select' ? (
                <select id={f.name} name={f.name} defaultValue={valueOf(f)} aria-invalid={Boolean(err)}>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text'}
                  defaultValue={valueOf(f)}
                  maxLength={f.type === 'text' ? f.max : undefined}
                  min={f.type === 'number' ? f.min : undefined}
                  max={f.type === 'number' ? f.max : undefined}
                  placeholder={f.placeholder}
                  aria-invalid={Boolean(err)}
                />
              )}
              {f.help && !err && <span className="field__help">{f.help}</span>}
              {err && <span className="field__error">{err}</span>}
            </div>
          );
        })}
      </div>

      <div className="adm-form__actions">
        <SaveButton label={id > 0 ? 'Guardar cambios' : 'Crear'} />
        <Link className="btn btn--ghost" href={backHref}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
