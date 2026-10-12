'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface LxSlide {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  cta_label: string;
  cta_href: string;
}

const INTERVAL_MS = 7000;

/** Carrusel de portada: textos centrados con entrada de desenfoque, editable desde el panel. */
export function LxHero({ slides, whatsappHref }: { slides: LxSlide[]; whatsappHref: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const timer = useRef<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || reduce) return;
    timer.current = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, paused, reduce, count, go]);

  if (count === 0) return null;
  const running = !paused && !reduce && count > 1;

  return (
    <div
      className="lx-hero__carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Mensajes principales"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
    >
      <div className="lx-hero__stage" aria-live={running ? 'off' : 'polite'}>
        {slides.map((slide, i) => {
          const href = slide.cta_href === 'whatsapp' ? whatsappHref : slide.cta_href;
          const external = href.startsWith('http');
          const active = i === index;
          return (
            <article
              key={slide.id}
              className={`lx-slide ${active ? 'is-active' : ''}`}
              aria-hidden={!active}
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${count}`}
            >
              {slide.eyebrow && <p className="lx-eyebrow">{slide.eyebrow}</p>}
              <h1 className="lx-hero__title">{slide.title}</h1>
              {slide.subtitle && <p className="lx-hero__sub">{slide.subtitle}</p>}
              {slide.body && <p className="lx-hero__body">{slide.body}</p>}
              {slide.cta_label && href && (
                <a
                  className="lx-cta lx-cta--dark"
                  href={href}
                  tabIndex={active ? 0 : -1}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {slide.cta_label}
                  <Icon name="arrow" size={14} />
                </a>
              )}
            </article>
          );
        })}
      </div>

      {count > 1 && (
        <div className="lx-hero__controls">
          <div className="lx-dots" role="group" aria-label="Elegir diapositiva">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === index ? 'is-active' : ''}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
              >
                {i === index && (
                  <span
                    key={`${index}-${running}`}
                    className={running ? 'is-running' : ''}
                    style={{ animationDuration: `${INTERVAL_MS}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="lx-icon-btn"
            aria-label={paused ? 'Reanudar carrusel' : 'Pausar carrusel'}
            onClick={() => setPaused((p) => !p)}
          >
            <Icon name={paused ? 'play' : 'pause'} size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
