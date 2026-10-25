'use client';

import { useMemo, useState } from 'react';
import { STATUS_META, STATUS_ORDER, type MerchantStatus, type PublicMerchant } from '@/lib/merchant-status';
import { MERCHANT_CATEGORIES } from '@/lib/categories';
import { Icon } from './Icon';

const PAGE = 24;

/** Solo se abren enlaces https:// */
const profileUrl = (u: string): string | null => (/^https:\/\/[^\s]+$/i.test(u) ? u : null);

/** Tono propio por categoría (para el avatar y la etiqueta). */
const hueOf = (cat: string) => {
  const i = (MERCHANT_CATEGORIES as readonly string[]).indexOf(cat);
  return ((i < 0 ? 7 : i) * 47 + 215) % 360;
};

/** Sin enlace directo, el botón busca el perfil por su nombre en Facebook. */
const fbSearch = (name: string) => `https://www.facebook.com/search/top?q=${encodeURIComponent(name)}`;

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status as MerchantStatus] ?? STATUS_META.inactivo;
  return (
    <span className={`lx-st lx-st--${m.tone}`}>
      <i aria-hidden="true" /> {m.label}
    </span>
  );
}

export function MerchantAvatar({ m, size = 'md', hue }: { m: Pick<PublicMerchant, 'name' | 'photo_id'>; size?: 'md' | 'lg'; hue?: number }) {
  if (m.photo_id) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={`lx-avatar lx-avatar--${size}`} src={`/media/${m.photo_id}`} alt="" loading="lazy" width={64} height={64} />
    );
  }
  const initials = m.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const tint = hue === undefined ? undefined : ({ '--h': hue } as React.CSSProperties);
  return <span className={`lx-avatar lx-avatar--${size} lx-avatar--txt${tint ? ' lx-avatar--tint' : ''}`} style={tint} aria-hidden="true">{initials || '•'}</span>;
}

/** Directorio con búsqueda por nombre/categoría/zona, filtros por categoría y estatus. */
export function MerchantDirectory({ merchants, initialQuery = '' }: { merchants: PublicMerchant[]; initialQuery?: string }) {
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'' | MerchantStatus>('');
  const [shown, setShown] = useState(PAGE);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of merchants) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
  }, [merchants]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of merchants) c[m.status] = (c[m.status] ?? 0) + 1;
    return c;
  }, [merchants]);

  const filtered = useMemo(() => {
    const term = norm(q.trim());
    return merchants.filter((m) => {
      if (category && m.category !== category) return false;
      if (status && m.status !== status) return false;
      if (!term) return true;
      return norm(`${m.name} ${m.category} ${m.zone}`).includes(term);
    });
  }, [merchants, q, category, status]);

  const visible = filtered.slice(0, shown);

  return (
    <div className="lx-dir">
      <div className="lx-dir__stats" aria-label="Resumen del directorio">
        <div><strong>{merchants.length}</strong><span>comerciantes</span></div>
        <div><strong>{statusCounts.activo ?? 0}</strong><span>activos</span></div>
        <div><strong>{categories.length}</strong><span>categorías</span></div>
        {(statusCounts.renovacion ?? 0) > 0 && <div><strong>{statusCounts.renovacion}</strong><span>pendientes de renovación</span></div>}
        {(statusCounts.riesgo ?? 0) > 0 && <div><strong>{statusCounts.riesgo}</strong><span>en riesgo</span></div>}
      </div>

      <div className="lx-dir__bar lx-dir__bar--one">
        <div className="lx-dir__search">
          <Icon name="search" size={18} />
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setShown(PAGE); }}
            placeholder="Busca por nombre del vendedor…"
            aria-label="Buscar comerciante"
            maxLength={80}
          />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="lx-dir__cats" role="group" aria-label="Filtrar por categoría">
          <button type="button" className={category === '' ? 'is-active' : undefined} onClick={() => { setCategory(''); setShown(PAGE); }}>
            Todas <small>{merchants.length}</small>
          </button>
          {categories.map(([c, n]) => (
            <button
              key={c}
              type="button"
              className={category === c ? 'is-active' : undefined}
              style={{ '--h': hueOf(c) } as React.CSSProperties}
              onClick={() => { setCategory(category === c ? '' : c); setShown(PAGE); }}
            >
              <i aria-hidden="true" /> {c} <small>{n}</small>
            </button>
          ))}
        </div>
      )}

      {Object.keys(statusCounts).length > 1 && (
      <div className="lx-dir__chips" role="group" aria-label="Filtrar por estatus">
        <button type="button" className={status === '' ? 'is-active' : undefined} onClick={() => { setStatus(''); setShown(PAGE); }}>
          Todos
        </button>
        {STATUS_ORDER.map((s) => (
          <button key={s} type="button" className={status === s ? 'is-active' : undefined} onClick={() => { setStatus(s); setShown(PAGE); }}>
            {STATUS_META[s].label}
            <small>{statusCounts[s] ?? 0}</small>
          </button>
        ))}
      </div>
      )}

      <p className="lx-dir__count" aria-live="polite">
        {filtered.length === 0
          ? 'Sin resultados'
          : `${filtered.length.toLocaleString('es-MX')} de ${merchants.length.toLocaleString('es-MX')} comerciante${merchants.length === 1 ? '' : 's'}`}
        {(q || category || status) && (
          <button type="button" className="lx-dir__clear" onClick={() => { setQ(''); setCategory(''); setStatus(''); setShown(PAGE); }}>
            ✕ Limpiar filtros
          </button>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="lx-empty lx-empty--center">
          {merchants.length === 0
            ? 'Pronto publicaremos el directorio de comerciantes.'
            : 'No encontramos comerciantes con esos filtros. Prueba con otra búsqueda.'}
        </div>
      ) : (
        <ul className="lx-dir__grid">
          {visible.map((m) => (
            <li key={m.id} className={`lx-mcard lx-mcard--${STATUS_META[m.status]?.tone ?? 'off'}`}>
              <div className="lx-mcard__top">
                <MerchantAvatar m={m} hue={hueOf(m.category)} />
                <div className="lx-mcard__id">
                  <h3>{m.name}</h3>
                  <span className="lx-mcard__cat" style={{ '--h': hueOf(m.category) } as React.CSSProperties}>
                    {m.category}{m.zone ? ` · ${m.zone}` : ''}
                  </span>
                </div>
              </div>
              <StatusBadge status={m.status} />
              <a
                className="lx-mcard__btn"
                href={profileUrl(m.facebook_url) ?? fbSearch(m.name)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {profileUrl(m.facebook_url) ? 'Visitar perfil' : 'Buscar en Facebook'} <Icon name="arrow" size={14} />
              </a>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > shown && (
        <div className="lx-center-actions">
          <button type="button" className="lx-cta lx-cta--dark lx-cta--flat" onClick={() => setShown((n) => n + PAGE)}>
            Ver más comerciantes
          </button>
        </div>
      )}
    </div>
  );
}
