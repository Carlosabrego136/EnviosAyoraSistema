'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from './Icon';

export interface LxLink {
  href: string;
  label: string;
  /** id de la sección (para resaltar el enlace activo) */
  section?: string;
}

/** Marco redondeado, barra de navegación flotante, indicador "01 — 06" y menú móvil. */
export function LxChrome({ links, whatsappHref }: { links: LxLink[]; whatsappHref: string }) {
  const pathname = usePathname();
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(0);
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-lx-section]'));
    setTotal(nodes.length);
    if (nodes.length === 0) {
      setCurrent(0);
      setActiveId('');
      return;
    }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const line = window.innerHeight * 0.5;
      let idx = 0;
      nodes.forEach((n, i) => {
        if (n.getBoundingClientRect().top <= line) idx = i;
      });
      setCurrent(idx);
      setActiveId(nodes[idx]?.id ?? '');
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <>
      <div className="lx-frame" aria-hidden="true" />

      <nav className="lx-nav" aria-label="Principal">
        <span className="lx-nav__corner lx-nav__corner--l" aria-hidden="true" />
        <span className="lx-nav__corner lx-nav__corner--r" aria-hidden="true" />
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={l.section && l.section === activeId ? 'is-active' : undefined}
            aria-current={l.section && l.section === activeId ? 'true' : undefined}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="lx-menu-btn"
        aria-label="Abrir menú"
        aria-expanded={open}
        aria-controls="lx-sheet"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" size={20} />
      </button>

      {open && (
        <div className="lx-sheet" id="lx-sheet" role="dialog" aria-modal="true" aria-label="Menú">
          <button type="button" className="lx-sheet__close" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
            <Icon name="close" size={22} />
          </button>
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <a className="lx-cta lx-cta--sheet" href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={16} /> WhatsApp
          </a>
        </div>
      )}

      {total > 0 && (
        <>
          <div className="lx-indicator lx-indicator--right" aria-hidden="true">
            <span>{pad(current + 1)}</span>
            <i />
            <span>{pad(total)}</span>
          </div>
          <div className="lx-indicator lx-indicator--left" aria-hidden="true">
            Desliza para descubrir
          </div>
        </>
      )}
    </>
  );
}
