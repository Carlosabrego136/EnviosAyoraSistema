import { getCurrentUser } from '@/lib/auth';
import { isDbConfigured, query } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const NOT_FOUND = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

/**
 * Imágenes subidas desde el panel. Solo se sirven si están en uso en contenido visible del sitio
 * (mensaje activo, comerciante público o saldo visible) o si quien pide es una persona con sesión del panel.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0 || !isDbConfigured()) return NOT_FOUND();
  try {
    let allowed = false;
    const ref = await query<{ ok: boolean }>(
      `SELECT (EXISTS (SELECT 1 FROM owner_posts WHERE photo_id = $1 AND is_active)
            OR EXISTS (SELECT 1 FROM merchants WHERE photo_id = $1 AND is_public)
            OR EXISTS (SELECT 1 FROM saldos WHERE photo_id = $1 AND is_active)) AS ok`,
      [id],
    );
    allowed = Boolean(ref[0]?.ok);
    if (!allowed) allowed = Boolean(await getCurrentUser().catch(() => null));
    if (!allowed) return NOT_FOUND();

    const rows = await query<{ mime: string; data: Buffer }>('SELECT mime, data FROM media WHERE id = $1', [id]);
    const row = rows[0];
    if (!row) return NOT_FOUND();
    return new Response(new Uint8Array(row.data), {
      headers: {
        'Content-Type': row.mime,
        // Cada subida crea un id nuevo: el contenido de un id nunca cambia.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    logger.warn('media.serve_failed', { id, error: String(err) });
    return NOT_FOUND();
  }
}
