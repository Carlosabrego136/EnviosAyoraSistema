'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { cancelFolioAction, createFolioAction, updateFolioAction } from '@/app/fenix/actions';
import { Icon } from '@/components/Icon';
import type { ActionState } from '@/lib/errors';

const INITIAL: ActionState = {};
const COLLECTOR_KEY = 'fenix_recolector';

export interface SizeOption {
  id: number;
  name: string;
  maxKg: number;
  price: number;
}

export interface BranchOption {
  id: number;
  name: string;
}

export interface FolioValues {
  sender_name: string;
  sender_phone: string;
  recipient_name: string;
  weight_kg: string;
  collector: string;
  branch_id: string;
  notes: string;
  paid: boolean;
}

function Submit({ label, pendingLabel = 'Guardando…', danger = false }: { label: string; pendingLabel?: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn ${danger ? 'btn--ghost fol-danger' : 'btn--solid'} fol-submit`} disabled={pending} aria-busy={pending}>
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

function money(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

/** Vista previa del tamaño y precio (el servidor vuelve a calcularlos: esto solo orienta al recolector). */
function sizePreview(sizes: SizeOption[], raw: string): { text: string; ok: boolean } | null {
  const t = raw.trim().replace(',', '.');
  if (!t) return null;
  const w = Number(t);
  if (!Number.isFinite(w) || w <= 0 || !/^\d{1,4}(\.\d{1,2})?$/.test(t)) return { text: 'Peso inválido', ok: false };
  const sorted = [...sizes].sort((a, b) => a.maxKg - b.maxKg);
  const found = sorted.find((s) => w <= s.maxKg + 1e-9);
  if (!found) {
    const top = sorted[sorted.length - 1];
    return { text: top ? `Máximo ${top.maxKg} kg por folio` : 'Sin tamaños disponibles', ok: false };
  }
  return { text: `${found.name} · ${money(found.price)}`, ok: true };
}

function FolioFields({
  state,
  sizes,
  collectors,
  branches,
  initial,
}: {
  state: ActionState;
  sizes: SizeOption[];
  collectors: string[];
  branches: BranchOption[];
  initial?: FolioValues;
}) {
  const v = state.values ?? {};
  const val = (name: keyof FolioValues, fallback = '') => v[name] ?? (initial ? String(initial[name] ?? '') : fallback);
  const [weight, setWeight] = useState(val('weight_kg'));
  const collectorRef = useRef<HTMLInputElement>(null);

  // Comodidad por dispositivo: recuerda el último recolector. Si el navegador no lo permite, simplemente no se usa.
  useEffect(() => {
    if (initial || !collectorRef.current || collectorRef.current.value) return;
    try {
      const saved = window.localStorage.getItem(COLLECTOR_KEY);
      if (saved) collectorRef.current.value = saved.slice(0, 60);
    } catch {
      /* sin almacenamiento disponible */
    }
  }, [initial]);

  const preview = useMemo(() => sizePreview(sizes, weight), [sizes, weight]);
  const paidChecked = v.paid ? v.paid === 'on' : initial ? initial.paid : false;

  return (
    <div className="adm-form__grid">
      <div className="field">
        <label htmlFor="collector">Recolector *</label>
        <input id="collector" name="collector" ref={collectorRef} type="text" list="fol-collectors" defaultValue={val('collector')} maxLength={60} autoComplete="off" placeholder="Quién recoge el paquete" aria-invalid={Boolean(state.fieldErrors?.collector)} />
        <datalist id="fol-collectors">
          {collectors.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Err state={state} name="collector" />
      </div>
      <div className="field">
        <label htmlFor="weight_kg">Peso del paquete (kg) *</label>
        <input id="weight_kg" name="weight_kg" type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} maxLength={8} autoComplete="off" placeholder="Ej. 1.5" aria-invalid={Boolean(state.fieldErrors?.weight_kg)} />
        {preview && <span className={`fol-preview ${preview.ok ? 'is-ok' : 'is-bad'}`}>{preview.text}</span>}
        <Err state={state} name="weight_kg" />
      </div>
      <div className="field">
        <label htmlFor="sender_name">Remitente (quien solicita el servicio) *</label>
        <input id="sender_name" name="sender_name" type="text" defaultValue={val('sender_name')} maxLength={100} autoComplete="off" aria-invalid={Boolean(state.fieldErrors?.sender_name)} />
        <Err state={state} name="sender_name" />
      </div>
      <div className="field">
        <label htmlFor="sender_phone">WhatsApp del remitente</label>
        <input id="sender_phone" name="sender_phone" type="tel" inputMode="tel" defaultValue={val('sender_phone')} maxLength={20} autoComplete="off" placeholder="10 dígitos" aria-invalid={Boolean(state.fieldErrors?.sender_phone)} />
        <span className="field__hint">Para enviarle su comprobante. Es opcional.</span>
        <Err state={state} name="sender_phone" />
      </div>
      <div className="field">
        <label htmlFor="recipient_name">Quien recibe el paquete *</label>
        <input id="recipient_name" name="recipient_name" type="text" defaultValue={val('recipient_name')} maxLength={100} autoComplete="off" placeholder="Nombre de quien lo recoge" aria-invalid={Boolean(state.fieldErrors?.recipient_name)} />
        <Err state={state} name="recipient_name" />
      </div>
      <div className="field">
        <label htmlFor="branch_id">Sucursal de entrega *</label>
        <select id="branch_id" name="branch_id" defaultValue={val('branch_id', branches[0] ? String(branches[0].id) : '')} aria-invalid={Boolean(state.fieldErrors?.branch_id)}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <Err state={state} name="branch_id" />
      </div>
      <div className="field field--wide">
        <label htmlFor="notes">Notas</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={val('notes')} maxLength={300} />
        <Err state={state} name="notes" />
      </div>
      <div className="field field--check field--wide">
        <input id="paid" name="paid" type="checkbox" defaultChecked={paidChecked} />
        <label htmlFor="paid">Ya se cobró</label>
      </div>
    </div>
  );
}

export function NewFolioForm({ requestId, sizes, collectors, branches }: { requestId: string; sizes: SizeOption[]; collectors: string[]; branches: BranchOption[] }) {
  const [state, action] = useActionState(createFolioAction, INITIAL);
  return (
    <form
      action={action}
      className="adm-form"
      noValidate
      onSubmit={(e) => {
        try {
          const c = (e.currentTarget.elements.namedItem('collector') as HTMLInputElement | null)?.value.trim();
          if (c) window.localStorage.setItem(COLLECTOR_KEY, c.slice(0, 60));
        } catch {
          /* sin almacenamiento disponible */
        }
      }}
    >
      <input type="hidden" name="request_id" value={requestId} />
      <Alert state={state} />
      <FolioFields state={state} sizes={sizes} collectors={collectors} branches={branches} />
      <div className="adm-form__actions">
        <Submit label="Generar folio" pendingLabel="Generando folio…" />
      </div>
    </form>
  );
}

export function EditFolioForm({ id, initial, sizes, collectors, branches }: { id: number; initial: FolioValues; sizes: SizeOption[]; collectors: string[]; branches: BranchOption[] }) {
  const [state, action] = useActionState(updateFolioAction.bind(null, id), INITIAL);
  return (
    <form action={action} className="adm-form" noValidate>
      <Alert state={state} />
      <FolioFields state={state} sizes={sizes} collectors={collectors} branches={branches} initial={initial} />
      <div className="adm-form__actions">
        <Submit label="Guardar corrección" />
      </div>
    </form>
  );
}

export function CancelFolioForm({ id }: { id: number }) {
  const [state, action] = useActionState(cancelFolioAction.bind(null, id), INITIAL);
  return (
    <form action={action} className="adm-form" noValidate>
      <Alert state={state} />
      <div className="field">
        <label htmlFor="reason">Motivo de la cancelación *</label>
        <input id="reason" name="reason" type="text" defaultValue={state.values?.reason ?? ''} maxLength={200} autoComplete="off" placeholder="Ej. Se capturó mal el peso" aria-invalid={Boolean(state.fieldErrors?.reason)} />
        <Err state={state} name="reason" />
      </div>
      <p className="field__hint">El folio no se borra: queda en el historial como cancelado y su número no se reutiliza.</p>
      <div className="adm-form__actions">
        <Submit label="Cancelar este folio" pendingLabel="Cancelando…" danger />
      </div>
    </form>
  );
}

export function PrintNow({ auto, label = 'Imprimir etiqueta' }: { auto: boolean; label?: string }) {
  useEffect(() => {
    if (!auto) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [auto]);
  return (
    <button type="button" className="btn btn--solid" onClick={() => window.print()}>
      <Icon name="box" size={16} /> {label}
    </button>
  );
}
