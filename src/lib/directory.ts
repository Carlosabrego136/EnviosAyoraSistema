import 'server-only';
import { isDbConfigured, query } from './db';
import { logger } from './logger';
import type { PublicMerchant } from './merchant-status';

const COLUMNS = `id, name, category, status, zone, description, whatsapp, facebook_url, photo_id, top_rank, top_note`;

/** Comerciantes visibles en el directorio público. Si la tabla aún no existe, devuelve vacío. */
export async function getPublicMerchants(): Promise<PublicMerchant[]> {
  if (!isDbConfigured()) return [];
  try {
    return await query<PublicMerchant>(`SELECT ${COLUMNS} FROM merchants WHERE is_public ORDER BY lower(name), id LIMIT 1000`);
  } catch (err) {
    logger.warn('directory.load_failed', { error: String(err) });
    return [];
  }
}

export async function getPublicMerchant(id: number): Promise<PublicMerchant | null> {
  if (!isDbConfigured() || !Number.isSafeInteger(id) || id <= 0) return null;
  try {
    const rows = await query<PublicMerchant>(`SELECT ${COLUMNS} FROM merchants WHERE id = $1 AND is_public`, [id]);
    return rows[0] ?? null;
  } catch (err) {
    logger.warn('directory.one_failed', { error: String(err) });
    return null;
  }
}
