import Image from 'next/image';
import Link from 'next/link';
import { whatsappLink, type SettingsMap } from '@/lib/settings';
import { Icon } from './Icon';
import { LiveClock } from './LiveClock';

/** Barra superior: logo completo de Fénix en panel marino a la izquierda; cotizar y WhatsApp a la derecha. */
export function LxTopBar({ settings }: { settings: SettingsMap }) {
  return (
    <div className="lx-top">
      <Link href="/" className="lx-brand" aria-label={`${settings.brand_name} · ${settings.brand_tagline} — inicio`}>
        <Image src="/logo-envios-ayora.jpg" alt="" width={1376} height={768} sizes="(min-width: 640px) 280px, 200px" className="lx-brand__logo" priority />
      </Link>
      <div className="lx-top__right">
        <LiveClock />
        <Link className="lx-cta lx-cta--q" href="/cotizar">
          <span>Cotizar envío</span>
          <Icon name="calc" size={14} />
        </Link>
        <a className="lx-cta lx-cta--wa" href={whatsappLink(settings)} target="_blank" rel="noopener noreferrer">
          <span>WhatsApp</span>
          <Icon name="whatsapp" size={14} />
        </a>
      </div>
    </div>
  );
}
