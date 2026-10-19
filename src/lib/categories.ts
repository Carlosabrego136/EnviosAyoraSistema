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
  return { value: DEFAULT_CATEGORY, reassigned: true };
}
