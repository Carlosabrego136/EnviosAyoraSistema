import type { Metadata } from 'next';
import { Icon } from '@/components/Icon';
import { LxTopBar } from '@/components/LxTopBar';
import { Motion } from '@/components/Motion';
import { getSiteContent } from '@/lib/content';
import { safeUrl, whatsappLink } from '@/lib/settings';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'La Ruta del Saldo Ensenada–Tijuana',
  description: 'Únete al grupo de WhatsApp de La Ruta del Saldo y compra con tus vendedores favoritos.',
};

export default async function RoutePage() {
  const { settings: s } = await getSiteContent();
  const group = safeUrl(s.whatsapp_group_url);
  const fb = safeUrl(s.facebook_url);
  const tt = safeUrl(s.tiktok_url);
  return (
    <>
      <div className="lx-subhero"><LxTopBar settings={s} /></div>
      <section className="lx-page lx-page--wide">
        <div className="lx-page__inner lx-page__inner--wide">
          <Motion kind="blur" className="lx-head">
            <p className="lx-head__tag">[la ruta del saldo]</p>
            <h1 className="lx-head__title">{s.route_title}</h1>
          </Motion>
          <div className="lx-route">
            <div className="lx-route__flyer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ruta-del-saldo.jpg" alt={s.route_title} />
            </div>
            <div className="lx-route__text">
              <p>{s.route_text}</p>
              <div className="lx-socials">
                {group && <a className="lx-cta lx-cta--wa" href={group} target="_blank" rel="noopener noreferrer"><Icon name="users" size={16} /> Unirme al grupo de WhatsApp</a>}
                {fb && <a className="lx-cta lx-cta--ghost-dark" href={fb} target="_blank" rel="noopener noreferrer"><Icon name="facebook" size={16} /> Facebook</a>}
                {tt && <a className="lx-cta lx-cta--ghost-dark" href={tt} target="_blank" rel="noopener noreferrer"><Icon name="tiktok" size={16} /> TikTok</a>}
                <a className="lx-cta lx-cta--dark" href={whatsappLink(s)} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={16} /> Hablar con el equipo</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
