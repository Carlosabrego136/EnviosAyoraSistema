'use client';

import { useState } from 'react';
import { CARRIERS, GUIDE_PATTERN } from '@/lib/carriers';
import { Icon } from './Icon';

/** Seguimiento de guía: lleva a la página oficial de cada paquetería con la guía ya puesta cuando es posible. */
export function TrackTool({ whatsappBase, brandName, trackingUrl }: { whatsappBase: string; brandName: string; trackingUrl: string }) {
  const [key, setKey] = useState(CARRIERS[0].key);
  const [guide, setGuide] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const carrier = CARRIERS.find((c) => c.key === key) ?? CARRIERS[0];
  const clean = guide.trim();

  const waHref = `${whatsappBase}?text=${encodeURIComponent(
    `Hola ${brandName}, quiero dar seguimiento a mi guía${clean ? ` ${clean}` : ''}${carrier ? ` (${carrier.name})` : ''}.`,
  )}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCopied(false);
    if (carrier.noPublicTracking) return;
    if (!GUIDE_PATTERN.test(clean)) {
      setError('Escribe tu número de guía (letras y números, entre 6 y 40 caracteres).');
      return;
    }
    if (carrier.url) {
      window.open(carrier.url.replace('{g}', encodeURIComponent(clean)), '_blank', 'noopener,noreferrer');
    } else {
      try {
        await navigator.clipboard.writeText(clean);
        setCopied(true);
      } catch {
        /* sin portapapeles: la persona la copia a mano */
      }
      window.open(carrier.home, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="lx-track">
      <form onSubmit={submit} className="lx-track__form" noValidate>
        <div className="lx-track__carriers" role="radiogroup" aria-label="Paquetería">
          {CARRIERS.map((c) => (
            <button
              key={c.key}
              type="button"
              role="radio"
              aria-checked={c.key === key}
              className={c.key === key ? 'is-active' : undefined}
              onClick={() => { setKey(c.key); setError(''); setCopied(false); }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {carrier.noPublicTracking ? (
          <div className="lx-track__info">
            <p><strong>{carrier.name}</strong> no ofrece rastreo público. Escríbenos con tu número de guía y te informamos el estado de tu envío.</p>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="t-guide">Número de guía</label>
            <input
              id="t-guide"
              type="text"
              inputMode="text"
              autoComplete="off"
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
              placeholder={carrier.hint}
              maxLength={40}
              aria-invalid={Boolean(error)}
            />
            {error && <span className="field__error">{error}</span>}
          </div>
        )}

        {!carrier.noPublicTracking && (
          <button type="submit" className="lx-cta">
            Rastrear en {carrier.name} <Icon name="arrow" size={14} />
          </button>
        )}

        {copied && (
          <p className="lx-track__tip">
            <Icon name="copy" size={14} /> Copiamos tu guía. En la página de {carrier.name}, pégala en el campo de rastreo.
          </p>
        )}
        {!carrier.url && !carrier.noPublicTracking && !copied && (
          <p className="lx-track__tip">Esta paquetería no permite precargar la guía: te llevamos a su página y la copiamos para que solo la pegues.</p>
        )}
      </form>

      <div className="lx-track__alt">
        <a className="lx-cta lx-cta--wa" href={waHref} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={16} /> Pedir seguimiento por WhatsApp
        </a>
        {trackingUrl && (
          <a className="lx-cta lx-cta--dark lx-cta--flat" href={trackingUrl} target="_blank" rel="noopener noreferrer">
            Sistema de rastreo {brandName} <Icon name="arrow" size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
