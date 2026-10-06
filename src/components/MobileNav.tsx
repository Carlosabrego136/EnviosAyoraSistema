'use client';

import { useEffect, useState } from 'react';
import { Icon } from './Icon';

export interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({ links, whatsappHref }: { links: NavLink[]; whatsappHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="icon-btn nav-toggle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? 'close' : 'menu'} size={22} />
      </button>

      <div id="mobile-menu" className={`mobile-menu ${open ? 'is-open' : ''}`} hidden={!open}>
        <nav aria-label="Menú principal">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
              <Icon name="arrow" size={16} />
            </a>
          ))}
        </nav>
        <a className="btn btn--wa btn--block" href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <Icon name="whatsapp" size={18} /> Hablar por WhatsApp
        </a>
      </div>
    </>
  );
}
