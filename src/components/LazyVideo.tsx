'use client';

import { useEffect, useRef } from 'react';

/**
 * Video decorativo de fondo, mismo aspecto que antes pero más ligero:
 *  - Solo se reproduce mientras está en pantalla (se pausa al salir y se reanuda al volver).
 *  - `lazy`: el archivo no se descarga hasta que la sección está por aparecer.
 *  - Con "reducir movimiento" no se reproduce solo, y con "ahorro de datos" los videos diferidos no se descargan.
 */
export function LazyVideo({ src, className, lazy = false }: { src: string; className?: string; lazy?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

    if (reduce) {
      video.pause();
      video.removeAttribute('autoplay');
    }
    if (typeof IntersectionObserver === 'undefined') return;

    let loaded = !lazy;
    let visible = false;
    const load = () => {
      if (loaded || saveData) return;
      loaded = true;
      video.src = src;
      video.load();
    };
    // Al terminar de cargar, si la sección sigue a la vista, se reproduce.
    const onReady = () => {
      if (visible && !reduce) video.play().catch(() => undefined);
    };
    video.addEventListener('loadeddata', onReady);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible = e.isIntersecting;
          if (e.isIntersecting) {
            load();
            if (!reduce && loaded) video.play().catch(() => undefined);
          } else if (loaded) {
            video.pause();
          }
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(video);
    return () => {
      io.disconnect();
      video.removeEventListener('loadeddata', onReady);
    };
  }, [src, lazy]);

  return lazy ? (
    <video ref={ref} className={className} loop muted playsInline autoPlay preload="none" aria-hidden="true" tabIndex={-1} />
  ) : (
    <video ref={ref} className={className} loop muted playsInline autoPlay preload="auto" aria-hidden="true" tabIndex={-1}>
      <source src={src} type="video/mp4" />
    </video>
  );
}
