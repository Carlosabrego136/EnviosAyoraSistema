'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface HeroSlide {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  cta_label: string;
  cta_href: string;
}

const INTERVAL_MS = 7000;

export function HeroCarousel({ slides, whatsappHref }: { slides: HeroSlide[]; whatsappHref: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timer = useRef<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    timer.current = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [index, paused, reduceMotion, count, go]);

  if (count === 0) return null;
  const running = !paused && !reduceMotion && count > 1;

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Mensajes principales"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
    >
      <div className="carousel__stage" aria-live={running ? 'off' : 'polite'}>
        {slides.map((slide, i) => {
          const href = slide.cta_href === 'whatsapp' ? whatsappHref : slide.cta_href;
          const external = href.startsWith('http');
          const active = i === index;
          return (
            <article
              key={slide.id}
              className={`slide ${active ? 'is-active' : ''}`}
              aria-hidden={!active}
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${count}`}
            >
              {slide.eyebrow && (
                <p className="eyebrow">
                  <span className="eyebrow__gem" aria-hidden="true" />
                  {slide.eyebrow}
                </p>
              )}
              <h1 className="slide__title">{slide.title}</h1>
              {slide.subtitle && <p className="slide__subtitle">{slide.subtitle}</p>}
              {slide.body && <p className="slide__body">{slide.body}</p>}
              {slide.cta_label && href && (
                <a
                  className="btn btn--ghost"
                  href={href}
                  tabIndex={active ? 0 : -1}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {slide.cta_label}
                  <Icon name="arrow" size={16} />
                </a>
              )}
            </article>
          );
        })}
      </div>

      {count > 1 && (
        <div className="carousel__controls">
          <div className="carousel__dots" role="group" aria-label="Elegir diapositiva">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`dot ${i === index ? 'is-active' : ''}`}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <span className="carousel__count" aria-hidden="true">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          <button
            type="button"
            className="icon-btn"
            aria-label={paused ? 'Reanudar carrusel' : 'Pausar carrusel'}
            onClick={() => setPaused((p) => !p)}
          >
            <Icon name={paused ? 'play' : 'pause'} size={16} />
          </button>
        </div>
      )}

      {count > 1 && (
        <div className="carousel__progress" aria-hidden="true">
          <span
            key={`${index}-${running}`}
            className={running ? 'is-running' : ''}
            style={{ animationDuration: `${INTERVAL_MS}ms` }}
          />
        </div>
      )}
    </div>
  );
}
