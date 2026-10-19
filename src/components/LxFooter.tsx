import Image from 'next/image';
import Link from 'next/link';
import { safeUrl, whatsappLink, type SettingsMap } from '@/lib/settings';
import { Icon } from './Icon';
import { sedesOf } from './Sedes';

export function LxFooter({ settings }: { settings: SettingsMap }) {
  const year = new Date().getFullYear();
  const wa = whatsappLink(settings);
  const group = safeUrl(settings.whatsapp_group_url);
  const fb = safeUrl(settings.facebook_url);
  const tt = safeUrl(settings.tiktok_url);
  const sedes = sedesOf(settings);
  return (
    <footer className="lx-footer">
      <div className="lx-footer__inner">
        <div className="lx-footer__top">
          <div className="lx-footer__brand">
            <Image src="/logo.png" alt={`${settings.brand_name} · ${settings.brand_tagline}`} width={878} height={467} sizes="220px" className="lx-footer__logo" />
            {settings.footer_quote && <p>“{settings.footer_quote}”</p>}
            {sedes.map((x) => (
              <p key={x.city} className="lx-footer__zone">
                <Icon name="pin" size={14} />
                <span>
                  <strong>{x.city}:</strong> {x.address}
                  {x.mapUrl && (
                    <>
                      {' '}
                      <a href={x.mapUrl} target="_blank" rel="noopener noreferrer">Ver mapa</a>
                    </>
                  )}
                </span>
              </p>
            ))}
            {settings.owner_names && <p className="lx-footer__zone">{settings.owner_names}</p>}
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
              {group && (
                <li>
                  <a href={group} target="_blank" rel="noopener noreferrer"><Icon name="users" size={16} /> Grupo de WhatsApp</a>
                </li>
              )}
              {fb && (
                <li>
                  <a href={fb} target="_blank" rel="noopener noreferrer"><Icon name="facebook" size={16} /> Facebook</a>
                </li>
              )}
              {tt && (
                <li>
                  <a href={tt} target="_blank" rel="noopener noreferrer"><Icon name="tiktok" size={16} /> TikTok</a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h2>Sitio</h2>
            <ul>
              <li><Link href="/cotizar">Cotizar un envío</Link></li>
              <li><Link href="/rastreo">Rastrear mi guía</Link></li>
              <li><Link href="/comerciantes">Comerciantes</Link></li>
              <li><Link href="/ruta-del-saldo">La Ruta del Saldo</Link></li>
              <li><Link href="/comunicados">Comunicados</Link></li>
              <li><Link href="/privacidad">Aviso de privacidad</Link></li>
              <li><Link href="/terminos">Términos y condiciones</Link></li>
            </ul>
          </div>
        </div>
        <p className="lx-footer__legal">
          © {year} {settings.brand_name}
          {settings.brand_legal && settings.brand_legal !== settings.brand_name ? ` · ${settings.brand_legal}` : ''}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
