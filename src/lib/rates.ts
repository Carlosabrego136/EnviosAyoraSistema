import 'server-only';
import { isDbConfigured, query } from './db';
import { logger } from './logger';
import type { Rate } from './quote';

/** Tabulador activo. Si la tabla aún no existe o la base falla, devuelve vacío y el cotizador pasa a WhatsApp. */
export async function getRates(): Promise<Rate[]> {
  if (!isDbConfigured()) return [];
  try {
    return await query<Rate>(
      `SELECT id, service_slug, carrier, destination, weight_from::float8 AS weight_from, weight_to::float8 AS weight_to,
              price::float8 AS price, price_type, note
       FROM rates WHERE is_active
       ORDER BY service_slug, carrier, destination, weight_from, weight_to`,
    );
  } catch (err) {
    logger.warn('rates.load_failed', { error: String(err) });
    return [];
  }
}
