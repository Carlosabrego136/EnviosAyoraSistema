import type { Metadata } from 'next';
import { LxTopBar } from '@/components/LxTopBar';
import { NewsFeatured, NewsItem, NewsMarquee } from '@/components/LxNews';
import { Motion } from '@/components/Motion';
import { getSiteContent } from '@/lib/content';
import { whatsappLink } from '@/lib/settings';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Comunicados',
  description: 'Avisos oficiales y novedades de operación.',
};

export default async function AnnouncementsPage() {
  const { announcements, settings } = await getSiteContent();
  const [first, ...rest] = announcements;
  return (
    <>
      <div className="lx-subhero">
        <LxTopBar settings={settings} />
      </div>
      <section className="lx-page lx-page--wide">
        <div className="lx-page__inner lx-page__inner--wide">
          <Motion kind="blur" className="lx-head">
            <p className="lx-head__tag">[avisos oficiales]</p>
            <h1 className="lx-head__title">Comunicados</h1>
          </Motion>
          {!first ? (
            <p className="lx-empty lx-empty--center">Aún no hay comunicados publicados.</p>
          ) : (
            <>
              <NewsMarquee items={announcements.slice(0, 6)} />
              <div className="lx-newsgrid lx-newsgrid--page">
                <NewsFeatured item={first} />
                {rest.length > 0 && (
                  <ul className="lx-news lx-news--list">
                    {rest.map((a, i) => (
                      <NewsItem key={a.id} item={a} index={i} />
                    ))}
                  </ul>
                )}
              </div>
            </>
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
