import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './globals.css';
import { loadSettings } from '@/lib/site-settings';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';

export const viewport: Viewport = {
  themeColor: '#060b16',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const s = await loadSettings();
  const title = `${s.brand_name} · ${s.brand_tagline}`;
  const description = `${s.brand_name}: recolección y envíos a todo México por vía aérea, terrestre y paquetería nacional. Calendario de recolecciones, estado de servicios y atención por WhatsApp.`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${s.brand_name}` },
    description,
    applicationName: s.brand_name,
    icons: { icon: '/icon.png', apple: '/icon.png' },
    openGraph: {
      type: 'website',
      locale: 'es_MX',
      siteName: s.brand_name,
      title,
      description,
      images: [{ url: '/logo.png', width: 878, height: 467, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/logo.png'] },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <head>
        {/* Habilita las animaciones de entrada solo cuando hay JavaScript. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
