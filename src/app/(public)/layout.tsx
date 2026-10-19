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
  { href: '/#cotizar', label: 'Cotizar', section: 'cotizar' },
  { href: '/#comerciantes', label: 'Comerciantes', section: 'comerciantes' },
  { href: '/rastreo', label: 'Rastrear' },
  { href: '/#comunicados', label: 'Comunicados', section: 'comunicados' },
  { href: '/#ruta', label: 'Ruta del Saldo', section: 'ruta' },
  { href: '/#registro-cliente', label: 'Registrarme' },
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
