import type { ReactNode } from 'react';

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

export function LegalDocument({ title, updated, text, footer }: { title: string; updated?: string; text: string; footer?: ReactNode }) {
  const blocks = parseLegal(text);
  return (
    <section className="page container legal">
      <header className="page__head">
        <p className="eyebrow"><span className="eyebrow__gem" aria-hidden="true" />Información legal</p>
        <h1 className="section__title section__title--left">{title}</h1>
        {updated && <p className="legal__updated">{updated}</p>}
      </header>
      <div className="card legal__body">
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
    </section>
  );
}
