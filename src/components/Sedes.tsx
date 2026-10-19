import { safeUrl, type SettingsMap } from '@/lib/settings';
import { Icon } from './Icon';

export interface Sede {
  city: string;
  address: string;
  mapUrl: string;
}

/** Sedes configuradas en Ajustes (Tijuana y Ensenada). Solo se incluyen las que tienen dirección. */
export function sedesOf(s: SettingsMap): Sede[] {
  return [
    { city: 'Tijuana', address: s.tijuana_address, mapUrl: safeUrl(s.tijuana_map_url) },
    { city: 'Ensenada', address: s.ensenada_address, mapUrl: safeUrl(s.ensenada_map_url) },
  ].filter((x) => x.address);
}

/** Tarjetas de sedes con enlace a Google Maps. */
export function SedesCards({ settings }: { settings: SettingsMap }) {
  const sedes = sedesOf(settings);
  if (sedes.length === 0) return null;
  return (
    <ul className="lx-sedes">
      {sedes.map((x) => (
        <li key={x.city} className="lx-sede">
          <span className="lx-sede__icon"><Icon name="pin" size={20} /></span>
          <div>
            <h3>{x.city}</h3>
            <p>{x.address}</p>
            {x.mapUrl && (
              <a href={x.mapUrl} target="_blank" rel="noopener noreferrer" aria-label={`Cómo llegar a la sede de ${x.city} en Google Maps`}>
                Cómo llegar <Icon name="arrow" size={14} />
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
