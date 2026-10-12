import Image from 'next/image';
import Link from 'next/link';
import { whatsappLink, type SettingsMap } from '@/lib/settings';
import { Icon } from './Icon';
import { LiveClock } from './LiveClock';

/** Barra superior: marca a la izquierda, botón biselado de WhatsApp a la derecha. */
export function LxTopBar({ settings }: { settings: SettingsMap }) {
  return (
    <div className="lx-top">
      <Link href="/" className="lx-brand" aria-label={`${settings.brand_name} — inicio`}>
        <Image src="/emblem.png" alt="" width={351} height={452} sizes="72px" className="lx-brand__emblem" priority />
        <span className="lx-brand__text">
          <span className="lx-brand__name">{settings.brand_name}</span>
          <span className="lx-brand__tag">{settings.brand_tagline}</span>
        </span>
      </Link>
      <div className="lx-top__right">
        <LiveClock />
        <a className="lx-cta" href={whatsappLink(settings)} target="_blank" rel="noopener noreferrer">
          <span>Cotiza por WhatsApp</span>
          <Icon name="whatsapp" size={14} />
        </a>
      </div>
    </div>
  );
}
