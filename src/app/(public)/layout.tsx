import type { Viewport } from 'next';
import type { ReactNode } from 'react';
import { LxChrome, type LxLink } from '@/components/LxChrome';
import { LxFooter } from '@/components/LxFooter';
import { WhatsAppFab } from '@/components/SiteChrome';
import { whatsappLink } from '@/lib/settings';
import { getSiteContent } from '@/lib/content';
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
  const { settings, announcements } = await getSiteContent();
  const notices = announcements.slice(0, 5).map((a) => ({ id: a.id, category: a.category, title: a.title }));
  return (
    <div className="lx">
      <LxChrome links={LINKS} whatsappHref={whatsappLink(settings)} notices={notices} />
      <main id="contenido">{children}</main>
      <LxFooter settings={settings} />
      <WhatsAppFab settings={settings} />
    </div>
  );
}
