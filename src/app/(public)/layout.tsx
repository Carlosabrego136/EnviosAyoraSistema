import type { Viewport } from 'next';
import type { ReactNode } from 'react';
import { LxChrome, type LxLink } from '@/components/LxChrome';
import { LxFooter } from '@/components/LxFooter';
import { WhatsAppFab } from '@/components/SiteChrome';
import { whatsappLink } from '@/lib/settings';
import { loadSettings } from '@/lib/site-settings';
import './lx.css';

export const revalidate = 60;
export const viewport: Viewport = { themeColor: '#ffffff', colorScheme: 'light' };

const LINKS: LxLink[] = [
  { href: '/', label: 'Inicio', section: 'inicio' },
  { href: '/#servicios', label: 'Servicios', section: 'servicios' },
  { href: '/#estado', label: 'Estado', section: 'estado' },
  { href: '/#comunicados', label: 'Comunicados', section: 'comunicados' },
  { href: '/#comunidad', label: 'Comunidad', section: 'comunidad' },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await loadSettings();
  return (
    <div className="lx">
      <LxChrome links={LINKS} whatsappHref={whatsappLink(settings)} />
      <main id="contenido">{children}</main>
      <LxFooter settings={settings} />
      <WhatsAppFab settings={settings} />
    </div>
  );
}
