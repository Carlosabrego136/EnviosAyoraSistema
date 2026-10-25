// Categorías fijas del directorio de comerciantes. Todo lo que no coincida se agrupa en "Variado".
export const MERCHANT_CATEGORIES = [
  'Saldos Target',
  'Saldos Amazon',
  'Saldos en General',
  'Ropa de Dama',
  'Ropa Caballero',
  'Ropa Niños',
  'Ropa para Toda la Familia',
  'Decoración y Hogar',
  'Juguetes',
  'Artículos de Mascota',
  'Calzado y Accesorios',
  'Artículos de Marca',
  'Snacks y Alimentos',
  'Belleza y Perfumes',
  'Personal Shopper en Tiendas de Marca',
  'Variado',
] as const;

export const DEFAULT_CATEGORY = 'Variado';

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ALIASES: Record<string, string> = {
  target: 'Saldos Target',
  targets: 'Saldos Target',
  'saldos target': 'Saldos Target',
  amazon: 'Saldos Amazon',
  'saldos amazon': 'Saldos Amazon',
  saldos: 'Saldos en General',
  saldo: 'Saldos en General',
  'saldos en general': 'Saldos en General',
  'saldos general': 'Saldos en General',
  'ropa de dama': 'Ropa de Dama',
  dama: 'Ropa de Dama',
  mujer: 'Ropa de Dama',
  'ropa dama': 'Ropa de Dama',
  'ropa caballero': 'Ropa Caballero',
  caballero: 'Ropa Caballero',
  hombre: 'Ropa Caballero',
  'ropa de caballero': 'Ropa Caballero',
  'ropa ninos': 'Ropa Niños',
  ninos: 'Ropa Niños',
  'ropa de ninos': 'Ropa Niños',
  'ropa para toda la familia': 'Ropa para Toda la Familia',
  'ropa familiar': 'Ropa para Toda la Familia',
  'toda la familia': 'Ropa para Toda la Familia',
  'ropa en general': 'Ropa para Toda la Familia',
  ropa: 'Ropa para Toda la Familia',
  'decoracion y hogar': 'Decoración y Hogar',
  decoracion: 'Decoración y Hogar',
  hogar: 'Decoración y Hogar',
  juguetes: 'Juguetes',
  juguete: 'Juguetes',
  'articulos de mascota': 'Artículos de Mascota',
  'articulos para mascota': 'Artículos de Mascota',
  mascotas: 'Artículos de Mascota',
  mascota: 'Artículos de Mascota',
  'calzado y accesorios': 'Calzado y Accesorios',
  calzado: 'Calzado y Accesorios',
  zapatos: 'Calzado y Accesorios',
  accesorios: 'Calzado y Accesorios',
  'articulos de marca': 'Artículos de Marca',
  marcas: 'Artículos de Marca',
  'snacks y alimentos': 'Snacks y Alimentos',
  snacks: 'Snacks y Alimentos',
  alimentos: 'Snacks y Alimentos',
  'personal shopper en tiendas de marca': 'Personal Shopper en Tiendas de Marca',
  'personal shopper': 'Personal Shopper en Tiendas de Marca',
  'belleza y perfumes': 'Belleza y Perfumes',
  belleza: 'Belleza y Perfumes',
  perfumes: 'Belleza y Perfumes',
  skincare: 'Belleza y Perfumes',
  maquillaje: 'Belleza y Perfumes',
  variado: 'Variado',
  general: 'Variado',
  varios: 'Variado',
};

const CANON = new Map<string, string>(MERCHANT_CATEGORIES.map((c) => [fold(c), c]));

/** Devuelve la categoría oficial y si hubo que reasignarla a "Variado" porque no coincidía con ninguna. */
export function normalizeCategory(raw: string): { value: string; reassigned: boolean } {
  const key = fold(raw ?? '');
  if (!key) return { value: DEFAULT_CATEGORY, reassigned: false };
  const hit = CANON.get(key) ?? ALIASES[key];
  if (hit) return { value: hit, reassigned: false };
  const guess = guessByKeywords(key);
  return { value: guess ?? DEFAULT_CATEGORY, reassigned: guess === null };
}

const has = (k: string, re: RegExp) => re.test(k);

/** Para textos libres ("ROPA DE DAMA Y NIÑOS", "SALDOS GRAL. AMAZON Y TARGET"…): elige la categoría oficial más cercana. */
function guessByKeywords(k: string): string | null {
  if (has(k, /personal sho+p/)) return 'Personal Shopper en Tiendas de Marca';

  const amazon = has(k, /amazon/);
  const target = has(k, /targ(e|u)?e?t|costco/);
  if (has(k, /saldo/)) {
    if (amazon && !target) return 'Saldos Amazon';
    if (target && !amazon && !has(k, /costco/)) return 'Saldos Target';
    return 'Saldos en General';
  }

  const dama = has(k, /\b(dama|damas|mujer|mujeres)\b/);
  const caballero = has(k, /\b(caballero|caballeros|hombre|hombres)\b/);
  const ninos = has(k, /\b(nino|ninos|nina|ninas|infantil|bb|bebe|bebes)\b/);
  const familia = has(k, /\b(familia|famila|adulto|adultos)\b/);
  const ropa = has(k, /\b(ropa|roda|playeras|tallas plus|plus size|lus size)\b/) || dama || caballero || ninos;
  const otros = has(k, /juguet|hogar|decoracion|maquillaje|cosmetic|perfume|papeleria|chachara|dulces|snack|sabanas/);

  if (has(k, /marca|original|americana/) && !has(k, /\b(dama|ninos)\b/)) return 'Artículos de Marca';
  if (ropa || familia) {
    if (otros) return 'Variado';
    const grupos = [dama, caballero, ninos].filter(Boolean).length;
    if (familia || grupos > 1 || grupos === 0) return 'Ropa para Toda la Familia';
    if (dama) return 'Ropa de Dama';
    if (caballero) return 'Ropa Caballero';
    return 'Ropa Niños';
  }
  if (has(k, /marca|original|americana/)) return 'Artículos de Marca';
  if (has(k, /juguet/)) return has(k, /decoracion|hogar|papeleria|calzado|dulces/) ? 'Variado' : 'Juguetes';
  if (has(k, /decoracion|hogar/)) return 'Decoración y Hogar';
  if (has(k, /perfume|skincare|belleza|maquillaje/)) return 'Belleza y Perfumes';
  if (has(k, /calzado|tenis|zapato|bolso|bolsa|cartera|accesorio/)) return 'Calzado y Accesorios';
  if (has(k, /dulces|snack/)) return 'Snacks y Alimentos';
  if (amazon || target) return amazon && !target ? 'Saldos Amazon' : 'Saldos en General';
  return null;
}
