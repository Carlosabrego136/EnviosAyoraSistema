'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Animaciones de entrada del diseño:
 *  - blur: desenfoque 20px + transparencia → nítido (1.2 s)
 *  - rise: sube 30px + aparece (0.6 s), con retraso escalonado
 * Se activan una sola vez al entrar en pantalla. Sin JavaScript o con "reducir movimiento" se muestran de inmediato.
 */
export function Motion({
  children,
  kind = 'rise',
  delay = 0,
  className = '',
  as: Tag = 'div',
  style,
}: {
  children: ReactNode;
  kind?: 'blur' | 'rise';
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article' | 'h1' | 'h2' | 'h3' | 'p' | 'span';
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`lx-${kind} ${shown ? 'is-in' : ''} ${className}`.trim()}
      style={{ ...(delay ? ({ '--d': `${delay}ms` } as CSSProperties) : null), ...style }}
    >
      {children}
    </Tag>
  );
}
