import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { LxTopBar } from '@/components/LxTopBar';
import { MerchantAvatar, StatusBadge } from '@/components/MerchantDirectory';
import { getSiteContent } from '@/lib/content';
import { getPublicMerchant } from '@/lib/directory';
import { statusMeta } from '@/lib/merchant-status';
import { safeUrl, whatsappLink } from '@/lib/settings';

export const revalidate = 60;
export const metadata: Metadata = { title: 'Perfil de comerciante', robots: { index: false, follow: false } };

export default async function MerchantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c, m] = await Promise.all([getSiteContent(), getPublicMerchant(Number(id))]);
  if (!m) notFound();
  const s = c.settings;
  const meta = statusMeta(m.status);
  const fb = safeUrl(m.facebook_url);
  const msg = `Hola ${s.brand_name}, quiero información sobre el comerciante "${m.name}".`;
  return (
    <>
      <div className="lx-subhero"><LxTopBar settings={s} /></div>
      <section className="lx-page">
        <div className="lx-page__inner">
          <Link className="lx-link" href="/comerciantes">← Volver al directorio</Link>
          <div className="lx-profile">
            <MerchantAvatar m={m} size="lg" />
            <div className="lx-profile__body">
              <h1>{m.name}</h1>
              <p className="lx-profile__cat">{m.category}{m.zone ? ` · ${m.zone}` : ''}</p>
              <StatusBadge status={m.status} />
              <p className={`lx-profile__note lx-profile__note--${meta.tone}`}>{meta.note}</p>
              {m.description && <p className="lx-profile__desc">{m.description}</p>}
              {m.top_rank && <p className="lx-profile__top">★ Top {m.top_rank} de vendedores más activos</p>}
              <div className="lx-profile__actions">
                {m.whatsapp && (
                  <a className="lx-cta lx-cta--wa" href={`https://wa.me/${m.whatsapp}`} target="_blank" rel="noopener noreferrer">
                    <Icon name="whatsapp" size={16} /> WhatsApp del comerciante
                  </a>
                )}
                {fb && (
                  <a className="lx-cta lx-cta--ghost-dark" href={fb} target="_blank" rel="noopener noreferrer">
                    <Icon name="facebook" size={16} /> Facebook
                  </a>
                )}
                <a className="lx-cta lx-cta--dark" href={whatsappLink(s, msg)} target="_blank" rel="noopener noreferrer">
                  Consultar con {s.brand_name}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
