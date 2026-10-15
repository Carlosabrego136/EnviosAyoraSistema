import 'server-only';
import { isDbConfigured, query } from './db';
import { logger } from './logger';
import type { PublicMerchant } from './merchant-status';

// Solo datos públicos: nombre, categoría, estatus y enlace a su perfil. Sin teléfonos ni datos personales.
const COLUMNS = `id, name, category, status, zone, facebook_url, photo_id, top_rank, top_note`;

/** Comerciantes visibles en el directorio público. Si la tabla aún no existe, devuelve vacío. */
export async function getPublicMerchants(): Promise<PublicMerchant[]> {
  if (!isDbConfigured()) return [];
  try {
    return await query<PublicMerchant>(`SELECT ${COLUMNS} FROM merchants WHERE is_public ORDER BY lower(name), id LIMIT 5000`);
  } catch (err) {
    logger.warn('directory.load_failed', { error: String(err) });
    return [];
  }
}
