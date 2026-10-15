import 'server-only';
import { isDbConfigured, query } from './db';
import { logger } from './logger';

export interface PublicSaldo {
  id: number;
  name: string;
  city: string;
  facebook_url: string;
  description: string;
  photo_id: number | null;
}

/** Saldos visibles en La Ruta del Saldo. Si la tabla aún no existe, devuelve vacío. */
export async function getPublicSaldos(): Promise<PublicSaldo[]> {
  if (!isDbConfigured()) return [];
  try {
    return await query<PublicSaldo>(
      `SELECT id, name, city, facebook_url, description, photo_id
       FROM saldos WHERE is_active ORDER BY sort_order, lower(name), id LIMIT 200`,
    );
  } catch (err) {
    logger.warn('saldos.load_failed', { error: String(err) });
    return [];
  }
}
