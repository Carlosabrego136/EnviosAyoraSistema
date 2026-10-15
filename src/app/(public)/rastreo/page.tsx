import type { Metadata } from 'next';
import { LxTopBar } from '@/components/LxTopBar';
import { Motion } from '@/components/Motion';
import { TrackTool } from '@/components/TrackTool';
import { getSiteContent } from '@/lib/content';
import { safeUrl, whatsappLink } from '@/lib/settings';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Rastrear guía',
  description: 'Rastrea tu guía con FedEx, DHL, Estafeta, Paquete Express y más.',
};

export default async function TrackPage() {
  const { settings: s } = await getSiteContent();
  return (
    <>
      <div className="lx-subhero"><LxTopBar settings={s} /></div>
      <section className="lx-page">
        <div className="lx-page__inner">
          <Motion kind="blur" className="lx-head">
            <p className="lx-head__tag">[seguimiento]</p>
            <h1 className="lx-head__title">Rastrea tu guía</h1>
          </Motion>
          <TrackTool whatsappBase={whatsappLink(s).split('?')[0]} brandName={s.brand_name} trackingUrl={safeUrl(s.tracking_url) ?? ''} />
        </div>
      </section>
    </>
  );
}
