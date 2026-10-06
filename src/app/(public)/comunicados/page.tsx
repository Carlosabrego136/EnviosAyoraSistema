import type { Metadata } from 'next';
import { Reveal } from '@/components/Reveal';
import { getSiteContent } from '@/lib/content';
import { dateParts } from '@/lib/format';
import { whatsappLink } from '@/lib/settings';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Comunicados',
  description: 'Avisos oficiales y novedades de operación.',
};

export default async function AnnouncementsPage() {
  const { announcements, settings } = await getSiteContent();
  return (
    <section className="page container">
      <header className="page__head">
        <p className="eyebrow"><span className="eyebrow__gem" aria-hidden="true" />Avisos oficiales</p>
        <h1 className="section__title section__title--left">Comunicados</h1>
      </header>
      {announcements.length === 0 ? (
        <p className="empty">Aún no hay comunicados publicados.</p>
      ) : (
        <ul className="news news--full">
          {announcements.map((a, i) => {
            const d = dateParts(a.published_on);
            return (
              <Reveal as="li" key={a.id} className="news__item card" delay={Math.min(i, 5) * 40}>
                <div className="datebox" aria-hidden="true">
                  <strong>{d.day}</strong>
                  <span>{d.month}</span>
                  <small>{d.year}</small>
                </div>
                <div className="news__body">
                  <div className="news__tags">
                    <span className="pill pill--outline">{a.category}</span>
                    {i === 0 && <span className="news__latest">Más reciente</span>}
                  </div>
                  <h2>{a.title}</h2>
                  <p className="pre">{a.body}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      )}
      <p className="panel__foot">
        ¿Dudas sobre un comunicado?{' '}
        <a href={whatsappLink(settings)} target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a>
      </p>
    </section>
  );
}
