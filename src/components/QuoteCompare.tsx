'use client';

import { useMemo, useState } from 'react';
import { findPalletRate, findQuote, formatKg, formatMXN, volumetricKg, type Rate } from '@/lib/quote';
import type { QuoteService } from './QuoteTool';
import { Icon } from './Icon';

export const MX_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
];

const MAX_WEIGHT = 60;
const BAJA_ONLY = ['Baja California'];

interface Option {
  key: string;
  service: QuoteService;
  carrier: string;
  total: number;
  rangeLabel: string;
}

interface Props {
  rates: Rate[];
  services: QuoteService[];
  whatsappBase: string;
  brandName: string;
  extendedFee: number;
  extendedUrl: string;
}

/** Compara todas las paqueterías y servicios con un solo formulario: destino + peso (y medidas opcionales). */
export function QuoteCompare({ rates, services, whatsappBase, brandName, extendedFee, extendedUrl }: Props) {
  const [state, setState] = useState('');
  const [weight, setWeight] = useState('');
  const [dimL, setDimL] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [extended, setExtended] = useState(false);

  const num = (v: string) => Number(v.replace(',', '.'));
  const realKg = Number.isFinite(num(weight)) && num(weight) > 0 ? num(weight) : 0;
  const volKg = volumetricKg(num(dimL), num(dimW), num(dimH));
  const billedKg = Math.max(realKg, volKg);
  const fee = extended && extendedFee > 0 ? extendedFee : 0;
  const ready = Boolean(state) && billedKg > 0;
  const tooHeavy = ready && billedKg > MAX_WEIGHT;

  const { priced, manual, pallets } = useMemo(() => {
    const priced: Option[] = [];
    const manual: { service: QuoteService; carrier: string }[] = [];
    const pallets: { carrier: string; price: number }[] = [];
    if (!ready) return { priced, manual, pallets };
    for (const sv of services) {
      if (sv.slug === 'tarimas') {
        for (const c of sv.carriers) {
          const r = findPalletRate(rates, { carrier: c, destination: state });
          if (r) pallets.push({ carrier: c, price: r.price });
        }
        continue;
      }
      if (sv.slug === 'bajapack' && !BAJA_ONLY.includes(state)) continue;
      const carriers = sv.carriers.length ? sv.carriers : [''];
      for (const c of carriers) {
        const q = findQuote(rates, { service: sv.slug, carrier: c, destination: state, weight: billedKg });
        if (q) {
          priced.push({
            key: `${sv.slug}|${c}`,
            service: sv,
            carrier: q.rate.carrier || c || sv.name,
            total: Math.round((q.total + fee) * 100) / 100,
            rangeLabel: `${formatKg(q.rate.weight_from)} a ${formatKg(q.rate.weight_to)}`,
          });
        } else if (c) {
          manual.push({ service: sv, carrier: c });
        }
      }
    }
    priced.sort((a, b) => a.total - b.total);
    return { priced, manual, pallets };
  }, [rates, services, state, billedKg, fee, ready]);

  const waHref = (lines: string[]) => `${whatsappBase}?text=${encodeURIComponent(lines.join('\n'))}`;
  const baseLines = () => {
    const l = [`Hola ${brandName}, quiero cotizar un envío.`, `Destino: ${state}`];
    if (realKg > 0) l.push(`Peso real: ${formatKg(realKg)}`);
    if (volKg > 0) l.push(`Medidas: ${dimL} x ${dimW} x ${dimH} cm (peso volumétrico ${formatKg(volKg)})`);
    l.push(`Peso a cobrar: ${formatKg(billedKg)}`);
    if (fee > 0) l.push(`Zona extendida: sí (+${formatMXN(fee)})`);
    return l;
  };

  const cheapest = priced[0]?.key;

  return (
    <div className="lx-cmp">
      <div className="lx-quote__grid">
        <div className="field field--wide">
          <label htmlFor="c-state">¿A qué estado lo envías?</label>
          <select id="c-state" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Elige el estado de destino…</option>
            {MX_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <div className="field field--wide">
          <label htmlFor="c-weight">Peso real del paquete (kg)</label>
          <input id="c-weight" type="number" inputMode="decimal" min={0} step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ej. 3.5" />
        </div>
        <fieldset className="field field--wide lx-quote__dims">
          <legend>Medidas de la caja en cm (opcional, para el peso volumétrico)</legend>
          <div>
            <input aria-label="Largo en centímetros" type="number" inputMode="decimal" min={0} step="0.1" value={dimL} onChange={(e) => setDimL(e.target.value)} placeholder="Largo" />
            <input aria-label="Ancho en centímetros" type="number" inputMode="decimal" min={0} step="0.1" value={dimW} onChange={(e) => setDimW(e.target.value)} placeholder="Ancho" />
            <input aria-label="Alto en centímetros" type="number" inputMode="decimal" min={0} step="0.1" value={dimH} onChange={(e) => setDimH(e.target.value)} placeholder="Alto" />
          </div>
          {volKg > 0 && (
            <small>
              Peso volumétrico: {formatKg(volKg)}{realKg > 0 ? ` · Peso real: ${formatKg(realKg)}` : ''} · <strong>Se cobra el mayor: {formatKg(billedKg)}</strong>
            </small>
          )}
        </fieldset>
        {extendedFee > 0 && (
          <div className="field field--check field--wide lx-quote__ext">
            <input id="c-ext" type="checkbox" checked={extended} onChange={(e) => setExtended(e.target.checked)} />
            <label htmlFor="c-ext">
              Mi destino es zona extendida (+{formatMXN(extendedFee)}).{' '}
              {extendedUrl && <a href={extendedUrl} target="_blank" rel="noopener noreferrer">Consultar si mi destino aplica</a>}
            </label>
          </div>
        )}
      </div>

      <div aria-live="polite">
        {!state || !(billedKg > 0) ? (
          <div className="lx-quote__result"><p>Elige el estado y escribe el peso (o las medidas) para ver todas las opciones con su precio.</p></div>
        ) : tooHeavy ? (
          <div className="lx-quote__result">
            <p>Para más de {MAX_WEIGHT} kg cotizamos de forma personalizada (también contamos con envío en tarimas).</p>
          </div>
        ) : priced.length === 0 ? (
          <div className="lx-quote__result"><p>No tenemos tarifas publicadas para ese destino. Cotízalo directo por WhatsApp y te respondemos al momento.</p></div>
        ) : (
          <ul className="lx-cmp__list">
            {priced.map((o) => (
              <li key={o.key} className={`lx-cmp__opt ${o.key === cheapest ? 'is-best' : ''}`}>
                <div className="lx-cmp__info">
                  {o.key === cheapest && <span className="lx-cmp__best">Más económico</span>}
                  <strong>{o.carrier}</strong>
                  <span>{o.service.name}{o.service.eta ? ` · ${o.service.eta}` : ''}</span>
                  <small>Peso a cobrar {formatKg(billedKg)} · rango {o.rangeLabel}</small>
                </div>
                <div className="lx-cmp__buy">
                  <b>{formatMXN(o.total)}</b>
                  <a
                    className="lx-cta lx-cta--wa lx-cta--sm"
                    href={waHref([...baseLines(), `Servicio: ${o.service.name}`, `Paquetería: ${o.carrier}`, `Precio estimado en el sitio: ${formatMXN(o.total)}`])}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="whatsapp" size={14} /> Solicitar
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {ready && !tooHeavy && manual.length > 0 && (
        <p className="lx-cmp__manual">
          También enviamos con {manual.map((m) => `${m.carrier} (${m.service.name.replace(/^Envío /, '').toLowerCase()})`).join(', ')}: se cotiza por{' '}
          <a href={waHref([...baseLines(), 'Quisiera cotizar con otra paquetería.'])} target="_blank" rel="noopener noreferrer">WhatsApp</a>.
        </p>
      )}

      {ready && billedKg >= 30 && pallets.length > 0 && (
        <div className="lx-cmp__pallets">
          <strong>Gran volumen · Tarimas a {state}</strong>
          <ul>
            {pallets.map((p) => (
              <li key={p.carrier}>
                <span>{p.carrier}</span>
                <b>{formatMXN(p.price)} por tarima</b>
              </li>
            ))}
          </ul>
          <small>El precio final se confirma según medidas y peso. Para tarimas usa la pestaña &quot;Elegir servicio&quot;.</small>
        </div>
      )}
    </div>
  );
}
