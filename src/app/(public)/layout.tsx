import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader, WhatsAppFab } from '@/components/SiteChrome';
import { loadSettings } from '@/lib/site-settings';

export const revalidate = 60;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await loadSettings();
  return (
    <>
      <SiteHeader settings={settings} />
      <main id="contenido">{children}</main>
      <SiteFooter settings={settings} />
      <WhatsAppFab settings={settings} />
    </>
  );
}
