import type { Metadata } from 'next';
import { LxTopBar } from '@/components/LxTopBar';
import { MerchantDirectory } from '@/components/MerchantDirectory';
import { Motion } from '@/components/Motion';
import { getSiteContent } from '@/lib/content';
import { getPublicMerchants } from '@/lib/directory';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Directorio de comerciantes',
  description: 'Consulta el estatus de los comerciantes: activos, renovación pendiente, riesgo e inactivos.',
};

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [c, merchants] = await Promise.all([getSiteContent(), getPublicMerchants()]);
  return (
    <>
      <div className="lx-subhero"><LxTopBar settings={c.settings} /></div>
      <section className="lx-page lx-page--wide">
        <div className="lx-page__inner lx-page__inner--wide">
          <Motion kind="blur" className="lx-head">
            <p className="lx-head__tag">[directorio]</p>
            <h1 className="lx-head__title">Comerciantes</h1>
          </Motion>
          <MerchantDirectory merchants={merchants} initialQuery={(q ?? '').slice(0, 80)} />
        </div>
      </section>
    </>
  );
}
