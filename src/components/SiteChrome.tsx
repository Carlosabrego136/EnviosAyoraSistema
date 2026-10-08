import Image from 'next/image';
import Link from 'next/link';
import { whatsappLink, type SettingsMap } from '@/lib/settings';
import { Icon } from './Icon';
import { LiveClock } from './LiveClock';
import { MobileNav, type NavLink } from './MobileNav';

const NAV: NavLink[] = [
  { href: '/#servicios', label: 'Servicios' },
  { href: '/#estado', label: 'Estado' },
  { href: '/#comunicados', label: 'Comunicados' },
  { href: '/#comunidad', label: 'Comunidad' },
];

export function BrandMark({ settings, compact = false }: { settings: SettingsMap; compact?: boolean }) {
  return (
    <Link href="/" className={`brand ${compact ? 'brand--compact' : ''}`} aria-label={`${settings.brand_name} — inicio`}>
      <span className="brand__emblem" aria-hidden="true">
        <Image src="/emblem.png" alt="" width={351} height={452} sizes="48px" />
      </span>
      <span className="brand__text">
        <span className="brand__name">{settings.brand_name}</span>
        <span className="brand__tag">{settings.brand_tagline}</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ settings }: { settings: SettingsMap }) {
  const wa = whatsappLink(settings);
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <BrandMark settings={settings} />
        <nav className="site-nav" aria-label="Principal">
          {NAV.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="site-header__right">
          <LiveClock />
          <a className="btn btn--wa btn--sm site-header__wa" href={wa} target="_blank" rel="noopener noreferrer">
            <Icon name="whatsapp" size={16} /> WhatsApp
          </a>
          <MobileNav links={NAV} whatsappHref={wa} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ settings }: { settings: SettingsMap }) {
  const year = new Date().getFullYear();
  const wa = whatsappLink(settings);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Image src="/logo.png" alt={`${settings.brand_name} ${settings.brand_tagline}`} width={878} height={467} sizes="220px" className="site-footer__logo" />
            {settings.footer_quote && <p className="site-footer__quote">“{settings.footer_quote}”</p>}
          </div>
          <div className="site-footer__col">
            <h2>Contacto</h2>
            <ul>
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={16} /> {settings.whatsapp_display || 'WhatsApp'}
                </a>
              </li>
              {settings.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`}>
                    <Icon name="mail" size={16} /> {settings.contact_email}
                  </a>
                </li>
              )}
              {settings.address && (
                <li className="site-footer__address">
                  <Icon name="pin" size={16} /> <span>{settings.address}</span>
                </li>
              )}
            </ul>
          </div>
          <div className="site-footer__col">
            <h2>Sitio</h2>
            <ul>
              <li><Link href="/comunicados">Comunicados</Link></li>
              <li><Link href="/#servicios">Servicios</Link></li>
              <li><Link href="/privacidad">Aviso de privacidad</Link></li>
              <li><Link href="/terminos">Términos y condiciones</Link></li>
            </ul>
          </div>
        </div>
        <p className="site-footer__legal">
          © {year} {settings.brand_name}
          {settings.brand_legal ? ` · ${settings.brand_legal}` : ''}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

export function WhatsAppFab({ settings }: { settings: SettingsMap }) {
  return (
    <a
      className="wa-fab"
      href={whatsappLink(settings)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
    >
      <Icon name="whatsapp" size={26} />
    </a>
  );
}
