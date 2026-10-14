import type { Announcement } from '@/lib/content';
import { dateParts } from '@/lib/format';
import { Motion } from './Motion';

const clip = (text: string, max?: number) =>
  max && text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

/** Comunicado destacado: panel oscuro grande con fecha, categoría y texto. */
export function NewsFeatured({ item, max }: { item: Announcement; max?: number }) {
  const d = dateParts(item.published_on);
  return (
    <Motion className="lx-feat" kind="rise">
      <div className="lx-feat__top">
        <span className="lx-feat__tag">{item.category}</span>
        <span className="lx-feat__new"><i aria-hidden="true" /> Más reciente</span>
      </div>
      <div className="lx-feat__date" aria-label={`${d.day} de ${d.month} de ${d.year}`}>
        <strong>{d.day}</strong>
        <span>{d.month} {d.year}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="pre">{clip(item.body, max)}</p>
    </Motion>
  );
}

/** Comunicado en lista: tarjeta compacta biselada. */
export function NewsItem({ item, index = 0, max }: { item: Announcement; index?: number; max?: number }) {
  const d = dateParts(item.published_on);
  return (
    <Motion as="li" delay={Math.min(index, 5) * 120} className="lx-chamfer" style={{ ['--c' as string]: '14px' }}>
      <div className="lx-chamfer__in lx-newsitem">
        <div className="lx-date" aria-hidden="true">
          <strong>{d.day}</strong>
          <span>{d.month}</span>
          <small>{d.year}</small>
        </div>
        <div className="lx-newsitem__body">
          <div className="lx-newsitem__tags">
            <span className="lx-pill">{item.category}</span>
          </div>
          <h3>{item.title}</h3>
          <p className="pre">{clip(item.body, max)}</p>
        </div>
      </div>
    </Motion>
  );
}

/** Cinta de avisos que se desliza (se pausa al pasar el cursor). */
export function NewsMarquee({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;
  const row = (hidden: boolean) => (
    <div className="lx-marquee__row" aria-hidden={hidden || undefined}>
      {items.map((a) => (
        <span key={`${hidden}-${a.id}`} className="lx-marquee__item">
          <b>{a.category}</b> {a.title}
          <i aria-hidden="true" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="lx-marquee" role="group" aria-label="Avisos recientes">
      <span className="lx-marquee__badge"><i aria-hidden="true" /> Avisos</span>
      <div className="lx-marquee__viewport">
        <div className="lx-marquee__track">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
}
