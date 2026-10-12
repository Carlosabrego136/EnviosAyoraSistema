import type { Metadata } from 'next';
import { LxTopBar } from '@/components/LxTopBar';
import { Motion } from '@/components/Motion';
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
    <>
      <div className="lx-subhero">
        <LxTopBar settings={settings} />
      </div>
      <section className="lx-page">
        <div className="lx-page__inner">
          <Motion kind="blur" className="lx-head">
            <p className="lx-head__tag">[avisos oficiales]</p>
            <h1 className="lx-head__title">Comunicados</h1>
          </Motion>
          {announcements.length === 0 ? (
            <p className="lx-empty lx-empty--center">Aún no hay comunicados publicados.</p>
          ) : (
            <ul className="lx-news">
              {announcements.map((a, i) => {
                const d = dateParts(a.published_on);
                return (
                  <Motion as="li" key={a.id} delay={Math.min(i, 5) * 100} className="lx-chamfer" style={{ ['--c' as string]: '16px' }}>
                    <div className="lx-chamfer__in lx-newsitem">
                      <div className="lx-date" aria-hidden="true">
                        <strong>{d.day}</strong>
                        <span>{d.month}</span>
                        <small>{d.year}</small>
                      </div>
                      <div className="lx-newsitem__body">
                        <div className="lx-newsitem__tags">
                          <span className="lx-pill">{a.category}</span>
                          {i === 0 && <span className="lx-latest">Más reciente</span>}
                        </div>
                        <h2>{a.title}</h2>
                        <p className="pre">{a.body}</p>
                      </div>
                    </div>
                  </Motion>
                );
              })}
            </ul>
          )}
          <p className="lx-note">
            ¿Dudas sobre un comunicado?{' '}
            <a href={whatsappLink(settings)} target="_blank" rel="noopener noreferrer">Escríbenos por WhatsApp</a>
          </p>
        </div>
      </section>
    </>
  );
}
