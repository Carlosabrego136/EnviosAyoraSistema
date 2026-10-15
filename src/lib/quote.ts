// Lógica del cotizador (sin dependencias de servidor: se usa en el navegador y en el servidor).

export const SERVICE_SLUGS = ['aereo', 'terrestre', 'bajapack', 'tarimas'] as const;
export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export const SERVICE_LABEL: Record<string, string> = {
  aereo: 'Envío aéreo',
  terrestre: 'Envío terrestre',
  bajapack: 'Bajapack',
  tarimas: 'Gran volumen · Tarimas',
};

export interface Rate {
  id: number;
  service_slug: string;
  carrier: string;
  destination: string;
  weight_from: number;
  weight_to: number;
  price: number;
  price_type: 'fixed' | 'per_kg';
  note: string;
}

export const formatMXN = (n: number): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n);

export const formatKg = (n: number): string => `${Number.isInteger(n) ? n : n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} kg`;

const uniq = (list: string[]) => Array.from(new Set(list));

/** Paqueterías con tarifa publicada para un servicio ('' = tarifa general). */
export function carriersFor(rates: Rate[], service: string): string[] {
  return uniq(rates.filter((r) => r.service_slug === service && r.carrier).map((r) => r.carrier)).sort((a, b) => a.localeCompare(b, 'es'));
}

/** Destinos con tarifa publicada para un servicio y paquetería. */
export function destinationsFor(rates: Rate[], service: string, carrier: string): string[] {
  return uniq(
    rates
      .filter((r) => r.service_slug === service && (!r.carrier || !carrier || r.carrier === carrier) && r.destination)
      .map((r) => r.destination),
  ).sort((a, b) => a.localeCompare(b, 'es'));
}

export interface QuoteResult {
  rate: Rate;
  total: number;
  billedKg: number;
}

/**
 * Busca la tarifa que aplica. Si hay varias, gana la más específica (paquetería y destino concretos)
 * y, entre ellas, el rango de peso más cerrado. Precio por kg: se multiplica por los kg redondeados hacia arriba.
 */
export function findQuote(
  rates: Rate[],
  q: { service: string; carrier: string; destination: string; weight: number },
): QuoteResult | null {
  if (!Number.isFinite(q.weight) || q.weight <= 0) return null;
  const norm = (s: string) => s.trim().toLowerCase();
  const matches = rates.filter((r) => {
    if (r.service_slug !== q.service) return false;
    if (r.carrier && norm(r.carrier) !== norm(q.carrier)) return false;
    if (r.destination && norm(r.destination) !== norm(q.destination)) return false;
    return q.weight >= r.weight_from && q.weight <= r.weight_to;
  });
  if (matches.length === 0) return null;
  const score = (r: Rate) => (r.carrier ? 2 : 0) + (r.destination ? 1 : 0);
  matches.sort((a, b) => score(b) - score(a) || a.weight_to - b.weight_to || a.weight_from - b.weight_from);
  const rate = matches[0];
  const billedKg = Math.ceil(q.weight);
  return { rate, billedKg, total: rate.price_type === 'per_kg' ? Math.round(rate.price * billedKg * 100) / 100 : rate.price };
}

/** Servicios predeterminados del cotizador si la base de datos aún no tiene los 4 servicios cargados. */
export const DEFAULT_QUOTE_SERVICES = [
  { slug: 'aereo', name: 'Envío aéreo', carriers: ['Estafeta', 'Volaris', 'DHL', 'FedEx'], coverage: 'Todo México' },
  { slug: 'terrestre', name: 'Envío terrestre', carriers: ['Paquete Express', 'Estafeta', 'FedEx'], coverage: 'Todo México' },
  { slug: 'bajapack', name: 'Bajapack', carriers: ['Baja Pack Express'], coverage: 'Solo Baja California' },
  { slug: 'tarimas', name: 'Gran volumen · Tarimas', carriers: ['Castores', 'Estafeta'], coverage: '' },
];

export const splitCarriers = (value: string): string[] =>
  value
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

/** Divisor estándar del peso volumétrico (cm³ → kg). */
export const VOLUMETRIC_DIVISOR = 5000;

/** Peso volumétrico en kg: largo × ancho × alto (cm) ÷ 5000. Devuelve 0 si falta alguna medida. */
export function volumetricKg(l: number, w: number, h: number): number {
  if (![l, w, h].every((n) => Number.isFinite(n) && n > 0)) return 0;
  return Math.round(((l * w * h) / VOLUMETRIC_DIVISOR) * 1000) / 1000;
}
