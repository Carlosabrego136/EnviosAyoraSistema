import Image from 'next/image';
import Link from 'next/link';
import type { PublicMerchant } from '@/lib/merchant-status';
import type { Service } from '@/lib/content';
import { splitCarriers } from '@/lib/quote';
import { Icon, serviceIcon } from './Icon';
import { MerchantAvatar, StatusBadge } from './MerchantDirectory';
import { Motion } from './Motion';

/** Imagen ilustrada por tipo de servicio; el resto usa ícono de línea. */
const SERVICE_IMAGE_BY_SLUG: Record<string, string> = {
  aereo: '/services/aereo.webp',
  terrestre: '/services/terrestre.webp',
  bajapack: '/services/nacional.webp',
};
const SERVICE_IMAGE_BY_ICON: Record<string, string> = {
  plane: '/services/aereo.webp',
  truck: '/services/terrestre.webp',
  box: '/services/nacional.webp',
};

export function serviceImage(sv: Pick<Service, 'slug' | 'icon'>): string | null {
  return SERVICE_IMAGE_BY_SLUG[sv.slug] ?? (sv.slug ? null : SERVICE_IMAGE_BY_ICON[sv.icon] ?? null);
}

export function ServiceLogo({ sv, size, className }: { sv: Pick<Service, 'slug' | 'icon'>; size: number; className: string }) {
  const src = serviceImage(sv);
  return src ? (
    <span className={className}>
      <Image src={src} alt="" width={size * 2} height={size * 2} sizes={`${size}px`} />
    </span>
  ) : (
    <span className={`${className} ${className}--icon`}>
      <Icon name={serviceIcon(sv.icon)} size={Math.round(size * 0.45)} />
    </span>
  );
}

export function CarrierChips({ carriers }: { carriers: string }) {
  const list = splitCarriers(carriers);
  if (list.length === 0) return null;
  return (
    <ul className="lx-chips" aria-label="Paqueterías">
      {list.map((c) => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  );
}

/** Top 9 del mes: tarjetas numeradas, las tres primeras destacadas. */
export function TopNine({ items, label }: { items: PublicMerchant[]; label: string }) {
  return (
    <div className="lx-top9">
      <Motion kind="blur" className="lx-top9__head">
        <span className="lx-top9__badge"><Icon name="star" size={14} /> Top 9</span>
        <h3>Los vendedores más activos de {label}</h3>
        <p>Se actualiza cada mes. Compra con comerciantes que ya trabajan con nosotros.</p>
      </Motion>
      {items.length === 0 ? (
        <p className="lx-empty lx-empty--center">Pronto publicaremos el Top 9 del mes.</p>
      ) : (
        <ol className="lx-top9__grid">
          {items.map((m, i) => (
            <Motion as="li" key={m.id} delay={i * 80} className={`lx-top9__item ${m.top_rank && m.top_rank <= 3 ? 'is-podium' : ''}`}>
              <Link href={`/comerciantes/${m.id}`} className="lx-top9__link">
                <span className="lx-top9__rank" aria-label={`Posición ${m.top_rank}`}>{String(m.top_rank ?? i + 1).padStart(2, '0')}</span>
                <MerchantAvatar m={m} />
                <span className="lx-top9__body">
                  <strong>{m.name}</strong>
                  <span>{m.top_note || m.category}</span>
                  <StatusBadge status={m.status} />
                </span>
                <Icon name="arrow" size={16} />
              </Link>
            </Motion>
          ))}
        </ol>
      )}
    </div>
  );
}
