import type { ReactNode } from 'react';
import type { SettingsMap } from '@/lib/settings';
import { LxTopBar } from './LxTopBar';
import { Motion } from './Motion';

interface Block {
  heading?: string;
  paragraphs: string[];
}

/** Convierte el texto editable en bloques: una primera línea corta sin punto final es un subtítulo. */
export function parseLegal(text: string): Block[] {
  return text
    .split(/\n{2,}/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
      const first = lines[0] ?? '';
      const looksLikeHeading = first.length <= 70 && !/[.:;,]$/.test(first);
      if (looksLikeHeading && lines.length > 1) return { heading: first, paragraphs: lines.slice(1) };
      if (looksLikeHeading && lines.length === 1) return { heading: first, paragraphs: [] };
      return { paragraphs: lines };
    });
}

export function LegalDocument({
  title,
  updated,
  text,
  footer,
  settings,
}: {
  title: string;
  updated?: string;
  text: string;
  footer?: ReactNode;
  settings: SettingsMap;
}) {
  const blocks = parseLegal(text);
  return (
    <>
      <div className="lx-subhero">
        <LxTopBar settings={settings} />
      </div>
      <section className="lx-page">
        <div className="lx-page__inner">
          <Motion kind="blur" className="lx-head">
            <p className="lx-head__tag">[información legal]</p>
            <h1 className="lx-head__title">{title}</h1>
            {updated && <p className="lx-legal__updated">{updated}</p>}
          </Motion>
          <Motion className="lx-chamfer" style={{ ['--c' as string]: '20px' }}>
            <div className="lx-chamfer__in lx-legal">
              {blocks.map((b, i) => (
                <div key={i}>
                  {b.heading && <h2>{b.heading}</h2>}
                  {b.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              ))}
              {footer}
            </div>
          </Motion>
        </div>
      </section>
    </>
  );
}
