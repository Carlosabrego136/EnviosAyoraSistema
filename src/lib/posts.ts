import 'server-only';
import { isDbConfigured, query } from './db';
import { logger } from './logger';

export interface OwnerPost {
  id: number;
  title: string;
  body: string;
  author: string;
  photo_id: number | null;
  published_on: string;
}

/** Mensaje personal más reciente y visible. */
export async function getLatestPost(): Promise<OwnerPost | null> {
  if (!isDbConfigured()) return null;
  try {
    const rows = await query<OwnerPost>(
      `SELECT id, title, body, author, photo_id, published_on::text AS published_on
       FROM owner_posts WHERE is_active ORDER BY published_on DESC, id DESC LIMIT 1`,
    );
    return rows[0] ?? null;
  } catch (err) {
    logger.warn('posts.load_failed', { error: String(err) });
    return null;
  }
}
