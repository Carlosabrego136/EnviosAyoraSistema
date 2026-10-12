import Image from 'next/image';
import Link from 'next/link';
import { whatsappLink, type SettingsMap } from '@/lib/settings';
import { Icon } from './Icon';

export function LxFooter({ settings }: { settings: SettingsMap }) {
  const year = new Date().getFullYear();
  const wa = whatsappLink(settings);
  return (
    <footer className="lx-footer">
      <div className="lx-footer__inner">
        <div className="lx-footer__top">
          <div className="lx-footer__brand">
            <Image src="/logo.png" alt={`${settings.brand_name} ${settings.brand_tagline}`} width={878} height={467} sizes="220px" className="lx-footer__logo" />
            {settings.footer_quote && <p>“{settings.footer_quote}”</p>}
          </div>
          <div>
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
                <li>
                  <Icon name="pin" size={16} /> <span>{settings.address}</span>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h2>Sitio</h2>
            <ul>
              <li><Link href="/comunicados">Comunicados</Link></li>
              <li><Link href="/#servicios">Servicios</Link></li>
              <li><Link href="/privacidad">Aviso de privacidad</Link></li>
              <li><Link href="/terminos">Términos y condiciones</Link></li>
            </ul>
          </div>
        </div>
        <p className="lx-footer__legal">
          © {year} {settings.brand_name}
          {settings.brand_legal ? ` · ${settings.brand_legal}` : ''}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
