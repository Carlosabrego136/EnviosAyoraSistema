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
export interface LxNotice {
  id: number;
  category: string;
  title: string;
}

export function LxChrome({
  links,
  whatsappHref,
  notices = [],
}: {
  links: LxLink[];
  whatsappHref: string;
  notices?: LxNotice[];
}) {
  const pathname = usePathname();
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(0);
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(false);
  const [noticeIdx, setNoticeIdx] = useState(0);
  const [noticePaused, setNoticePaused] = useState(false);
  const [noticeClosed, setNoticeClosed] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem('lx-notice-closed') === '1') setNoticeClosed(true);
    } catch {
      /* sin almacenamiento: se muestra normal */
    }
  }, []);

  useEffect(() => {
    if (notices.length < 2 || noticePaused || noticeClosed) return;
    const id = window.setInterval(() => setNoticeIdx((i) => (i + 1) % notices.length), 5000);
    return () => window.clearInterval(id);
  }, [notices.length, noticePaused, noticeClosed]);

  const closeNotice = () => {
    setNoticeClosed(true);
    try {
      window.sessionStorage.setItem('lx-notice-closed', '1');
    } catch {
      /* ignorar */
    }
  };

  useEffect(() => {
    setOpen(false);
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-lx-section]'));
    setTotal(nodes.length);
    if (nodes.length === 0) {
      setCurrent(0);
      setActiveId('');
      return;
    }
    // La sección "actual" es la que cruza la línea del 50 % de la pantalla. Con IntersectionObserver no se mide el
    // diseño en cada cuadro del desplazamiento (antes se leía la posición de todas las secciones en cada scroll).
    const select = (i: number) => {
      setCurrent(i);
      setActiveId(nodes[i]?.id ?? '');
    };
    select(0);
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) select(nodes.indexOf(e.target as HTMLElement));
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
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

      {total > 0 && !noticeClosed && notices.length > 0 && activeId !== 'comunicados' && activeId !== 'ruta' && (
        <div
          className="lx-notice"
          role="region"
          aria-label="Aviso reciente"
          onMouseEnter={() => setNoticePaused(true)}
          onMouseLeave={() => setNoticePaused(false)}
        >
          <Link href="/comunicados" className="lx-notice__link">
            <span className="lx-notice__dot" aria-hidden="true" />
            <span className="lx-notice__txt" key={notices[noticeIdx % notices.length].id}>
              <b>{notices[noticeIdx % notices.length].category}</b>
              <span>{notices[noticeIdx % notices.length].title}</span>
            </span>
            <Icon name="arrow" size={14} />
          </Link>
          <button type="button" className="lx-notice__x" aria-label="Cerrar aviso" onClick={closeNotice}>
            <Icon name="close" size={14} />
          </button>
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
