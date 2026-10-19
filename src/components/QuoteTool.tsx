'use client';

import { useMemo, useState } from 'react';
import { carriersFor, destinationsFor, findPalletRate, findQuote, formatKg, formatMXN, volumetricKg, type Rate } from '@/lib/quote';
import { Icon } from './Icon';
import { QuoteCompare } from './QuoteCompare';

export interface QuoteService {
  slug: string;
  name: string;
  carriers: string[];
  coverage: string;
  eta?: string;
}

interface Props {
  rates: Rate[];
  services: QuoteService[];
  whatsappBase: string; // https://wa.me/52…
  brandName: string;
  note: string;
  initialSlug?: string;
  /** Cargo extra por zona extendida (pesos); 0 = no se ofrece la casilla. */
  extendedFee?: number;
  extendedUrl?: string;
}

const OTHER = '__otro';

/** Cotizador: calcula con el tabulador cargado en el panel y confirma por WhatsApp con el mensaje ya armado. */
export function QuoteTool({ rates, services, whatsappBase, brandName, note, initialSlug, extendedFee = 0, extendedUrl = '' }: Props) {
  const [mode, setMode] = useState<'compare' | 'service'>(initialSlug ? 'service' : 'compare');
  const [slug, setSlug] = useState(services.some((s) => s.slug === initialSlug) ? (initialSlug as string) : (services[0]?.slug ?? ''));
  const [carrier, setCarrier] = useState('');
  const [dest, setDest] = useState('');
  const [destText, setDestText] = useState('');
  const [weight, setWeight] = useState('');
  const [pallets, setPallets] = useState('');
  const [details, setDetails] = useState('');
  const [dimL, setDimL] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [extended, setExtended] = useState(false);

  const service = services.find((s) => s.slug === slug) ?? services[0];
  const isPallet = slug === 'tarimas';
  const serviceHasRates = rates.some((r) => r.service_slug === slug);

  const carrierOptions = useMemo(() => {
    const fromRates = carriersFor(rates, slug);
    const all = [...fromRates, ...(service?.carriers ?? []).filter((c) => !fromRates.includes(c))];
    return all;
  }, [rates, slug, service]);

  const carrierValue = carrierOptions.includes(carrier) ? carrier : carrierOptions.length === 1 ? carrierOptions[0] : carrier;
  const destOptions = useMemo(() => destinationsFor(rates, slug, carrierValue), [rates, slug, carrierValue]);
  const destinationValue = destOptions.length > 0 ? (dest === OTHER ? destText : dest) : destText;

  const num = (v: string) => Number(v.replace(',', '.'));
  const realKg = Number.isFinite(num(weight)) && num(weight) > 0 ? num(weight) : 0;
  const volKg = volumetricKg(num(dimL), num(dimW), num(dimH));
  // Se cobra el mayor entre el peso real y el volumétrico.
  const weightNum = Math.max(realKg, volKg);
  const fee = extended && extendedFee > 0 ? extendedFee : 0;
  const quote =
    !isPallet && serviceHasRates && weightNum > 0
      ? findQuote(rates, { service: slug, carrier: carrierValue, destination: destinationValue, weight: weightNum })
      : null;
  const palletCount = Math.min(99, Math.max(1, Math.floor(Number(pallets)) || 1));
  const palletRate = isPallet ? findPalletRate(rates, { carrier: carrierValue, destination: destinationValue }) : null;
  const palletTotal = palletRate ? Math.round(palletRate.price * palletCount * 100) / 100 : 0;
  const grandTotal = quote ? Math.round((quote.total + fee) * 100) / 100 : 0;

  const message = useMemo(() => {
    const lines = [`Hola ${brandName}, quiero cotizar un envío.`, `Servicio: ${service?.name ?? ''}`];
    if (carrierValue) lines.push(`Paquetería: ${carrierValue}`);
    if (destinationValue) lines.push(`Destino: ${destinationValue}`);
    if (isPallet) {
      if (pallets) lines.push(`Tarimas: ${pallets}`);
      if (palletRate) lines.push(`Precio estimado en el sitio: ${formatMXN(palletTotal)} (${formatMXN(palletRate.price)} por tarima × ${palletCount})`);
      if (weightNum > 0) lines.push(`Peso aproximado: ${formatKg(weightNum)}`);
      if (details) lines.push(`Detalles: ${details}`);
    } else if (weightNum > 0) {
      if (realKg > 0) lines.push(`Peso real: ${formatKg(realKg)}`);
      if (volKg > 0) lines.push(`Medidas: ${dimL} x ${dimW} x ${dimH} cm (peso volumétrico ${formatKg(volKg)})`);
      lines.push(`Peso a cobrar: ${formatKg(weightNum)}`);
      if (fee > 0) lines.push(`Zona extendida: sí (+${formatMXN(fee)})`);
      if (quote) lines.push(`Precio estimado en el sitio: ${formatMXN(grandTotal)}`);
    }
    return lines.join('\n');
  }, [brandName, service, carrierValue, destinationValue, isPallet, pallets, palletRate, palletTotal, palletCount, weightNum, realKg, volKg, dimL, dimW, dimH, fee, grandTotal, details, quote]);

  const waHref = `${whatsappBase}?text=${encodeURIComponent(message)}`;

  const needCarrier = carrierOptions.length > 1 && !carrierValue;
  const needDest = destOptions.length > 0 && !destinationValue;

  if (services.length === 0) return null;

  return (
    <div className="lx-quote">
      <div className="lx-quote__head">
        <span className="lx-quote__icon"><Icon name="calc" size={20} /></span>
        <div>
          <h3>Calcula tu envío</h3>
          <p>{mode === 'compare' ? 'Escribe el destino y el peso y compara todas las opciones.' : 'Elige el servicio, el destino y el peso.'}</p>
        </div>
      </div>

      <div className="lx-quote__body">
        <div className="lx-quote__mode" role="tablist" aria-label="Tipo de cotización">
          <button type="button" role="tab" aria-selected={mode === 'compare'} className={mode === 'compare' ? 'is-active' : undefined} onClick={() => setMode('compare')}>Comparar opciones</button>
          <button type="button" role="tab" aria-selected={mode === 'service'} className={mode === 'service' ? 'is-active' : undefined} onClick={() => setMode('service')}>Elegir servicio</button>
        </div>
        {mode === 'compare' ? (
          <QuoteCompare rates={rates} services={services} whatsappBase={whatsappBase} brandName={brandName} extendedFee={extendedFee} extendedUrl={extendedUrl} />
        ) : (
        <>
        <div className="lx-quote__tabs" role="tablist" aria-label="Servicio">
          {services.map((s) => (
            <button
              key={s.slug}
              type="button"
              role="tab"
              aria-selected={s.slug === slug}
              className={s.slug === slug ? 'is-active' : undefined}
              onClick={() => {
                setSlug(s.slug);
                setCarrier('');
                setDest('');
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {service?.coverage && (
          <p className="lx-quote__cover"><Icon name="pin" size={14} /> Cobertura: {service.coverage}</p>
        )}

        <div className="lx-quote__grid">
          {carrierOptions.length > 0 && (
            <div className="field">
              <label htmlFor="q-carrier">Paquetería</label>
              <select id="q-carrier" value={carrierValue} onChange={(e) => { setCarrier(e.target.value); setDest(''); }}>
                <option value="">{carrierOptions.length > 1 ? 'Elige una…' : ''}</option>
                {carrierOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {destOptions.length > 0 ? (
            <div className="field">
              <label htmlFor="q-dest">Destino o zona</label>
              <select id="q-dest" value={dest} onChange={(e) => setDest(e.target.value)}>
                <option value="">Elige un destino…</option>
                {destOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value={OTHER}>Otro destino…</option>
              </select>
              {dest === OTHER && (
                <input type="text" value={destText} onChange={(e) => setDestText(e.target.value)} placeholder="Ciudad y estado" maxLength={80} aria-label="Otro destino" />
              )}
            </div>
          ) : (
            <div className="field">
              <label htmlFor="q-dest-text">Ciudad o estado de destino</label>
              <input id="q-dest-text" type="text" value={destText} onChange={(e) => setDestText(e.target.value)} placeholder="Ej. Guadalajara, Jalisco" maxLength={80} />
            </div>
          )}

          {isPallet ? (
            <>
              <div className="field">
                <label htmlFor="q-pallets">Número de tarimas</label>
                <input id="q-pallets" type="number" inputMode="numeric" min={1} max={99} value={pallets} onChange={(e) => setPallets(e.target.value)} placeholder="1" />
              </div>
              <div className="field">
                <label htmlFor="q-weight">Peso aproximado (kg)</label>
                <input id="q-weight" type="number" inputMode="decimal" min={0} step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="field field--wide">
                <label htmlFor="q-details">Qué envías y medidas aproximadas</label>
                <input id="q-details" type="text" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Ej. Cajas de ropa, tarima de 1.2 × 1 × 1.5 m" maxLength={160} />
              </div>
            </>
          ) : (
            <>
              <div className="field field--wide">
                <label htmlFor="q-weight">Peso real del paquete (kg)</label>
                <input id="q-weight" type="number" inputMode="decimal" min={0} step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ej. 1.2" />
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
                    Peso volumétrico: {formatKg(volKg)}{realKg > 0 ? ` · Peso real: ${formatKg(realKg)}` : ''} · <strong>Se cobra el mayor: {formatKg(weightNum)}</strong>
                  </small>
                )}
              </fieldset>
            </>
          )}
          {extendedFee > 0 && !isPallet && (
            <div className="field field--check field--wide lx-quote__ext">
              <input id="q-ext" type="checkbox" checked={extended} onChange={(e) => setExtended(e.target.checked)} />
              <label htmlFor="q-ext">
                Mi destino es zona extendida (+{formatMXN(extendedFee)}).{' '}
                {extendedUrl && (
                  <a href={extendedUrl} target="_blank" rel="noopener noreferrer">Consultar si mi destino aplica</a>
                )}
              </label>
            </div>
          )}
        </div>

        <div className={`lx-quote__result ${quote ? 'is-priced' : ''}`} aria-live="polite">
          {isPallet && palletRate ? (
            <>
              <span className="lx-quote__label">Precio estimado</span>
              <strong>{formatMXN(palletTotal)}</strong>
              <small>
                {palletRate.carrier} · {palletRate.destination} · {formatMXN(palletRate.price)} por tarima × {palletCount} {palletCount === 1 ? 'tarima' : 'tarimas'}
              </small>
              <small>El precio final se confirma según las medidas y el peso de la tarima.</small>
            </>
          ) : isPallet && needCarrier ? (
            <p>Elige la paquetería para ver el precio estimado por tarima.</p>
          ) : isPallet && needDest ? (
            <p>Elige el estado de destino para ver el precio estimado por tarima.</p>
          ) : isPallet ? (
            <p>Los envíos de gran volumen se cotizan de forma personalizada. Mándanos los datos y te respondemos por WhatsApp.</p>
          ) : !serviceHasRates ? (
            <p>Para este servicio te cotizamos directo por WhatsApp. Escribe el peso y el destino y te enviamos el precio.</p>
          ) : quote ? (
            <>
              <span className="lx-quote__label">Precio estimado</span>
              <strong>{formatMXN(grandTotal)}</strong>
              <small>
                {quote.rate.carrier || service?.name}
                {quote.rate.destination ? ` · ${quote.rate.destination}` : ''} · {formatKg(quote.rate.weight_from)} a {formatKg(quote.rate.weight_to)}
                {quote.rate.price_type === 'per_kg' ? ` · ${formatMXN(quote.rate.price)} por kg × ${quote.billedKg} kg` : ''}
              </small>
              {fee > 0 && <small>Incluye cargo por zona extendida de {formatMXN(fee)}.</small>}
              {volKg > realKg && volKg > 0 && <small>Se cobró el peso volumétrico ({formatKg(volKg)}) por ser mayor que el real.</small>}
              {quote.rate.note && <small>{quote.rate.note}</small>}
            </>
          ) : needCarrier ? (
            <p>Elige la paquetería para ver el precio estimado.</p>
          ) : needDest ? (
            <p>Elige el destino o zona para ver el precio estimado.</p>
          ) : !(weightNum > 0) ? (
            <p>Escribe el peso de tu paquete (o sus medidas) para ver el precio estimado.</p>
          ) : (
            <p>No tenemos una tarifa publicada para ese peso o destino. Cotízalo directo por WhatsApp y te respondemos al momento.</p>
          )}
        </div>

        <a className="lx-cta lx-cta--wa lx-cta--block" href={waHref} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={16} /> {quote || palletRate ? 'Confirmar por WhatsApp' : 'Cotizar por WhatsApp'}
        </a>
        </>
        )}
        <p className="lx-quote__note">{note}</p>
      </div>
    </div>
  );
}
