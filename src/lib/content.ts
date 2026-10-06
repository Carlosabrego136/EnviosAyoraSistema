import 'server-only';
import { isDbConfigured, query } from './db';
import { logger } from './logger';
import { todayISO } from './format';
import { safeTimezone, type SettingsMap } from './settings';
import { loadSettings } from './site-settings';
import seed from '../../db/seed-data.json';

export interface Slide {
  id: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  cta_label: string;
  cta_href: string;
}
export interface Stat {
  id: number;
  value: string;
  label: string;
  caption: string;
}
export interface Announcement {
  id: number;
  category: string;
  title: string;
  body: string;
  published_on: string;
}
export interface Service {
  id: number;
  name: string;
  description: string;
  eta_text: string;
  icon: string;
  status: 'active' | 'limited' | 'paused';
  status_note: string;
}
export interface Pickup {
  id: number;
  pickup_date: string;
  start_time: string;
  end_time: string;
  note: string;
}

export interface SiteContent {
  settings: SettingsMap;
  slides: Slide[];
  stats: Stat[];
  announcements: Announcement[];
  services: Service[];
  pickups: Pickup[];
  today: string;
  source: 'database' | 'fallback';
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Contenido de respaldo (mismo que el seed) para cuando la base de datos aún no está conectada. */
function fallbackContent(settings: SettingsMap, today: string): SiteContent {
  const pickups: Pickup[] = [];
  let n = 1;
  for (let i = 0; i < 21; i += 1) {
    const date = addDays(today, i);
    const wd = weekdayOf(date);
    if (wd === 5) pickups.push({ id: n++, pickup_date: date, start_time: '11:00', end_time: '16:00', note: 'Recolección general' });
    if (wd === 6) pickups.push({ id: n++, pickup_date: date, start_time: '10:00', end_time: '13:00', note: 'Recolección general' });
  }
  return {
    settings,
    today,
    source: 'fallback',
    slides: seed.slides.map((s, i) => ({ id: i + 1, ...s })),
    stats: seed.stats.map((s, i) => ({ id: i + 1, value: s.value, label: s.label, caption: s.caption })),
    services: seed.services.map((s, i) => ({ id: i + 1, ...s, status: 'active' as const, status_note: '' })),
    announcements: seed.announcements.map((a, i) => ({
      id: i + 1,
      category: a.category,
      title: a.title,
      body: a.body,
      published_on: addDays(today, -a.days_ago),
    })),
    pickups: pickups.slice(0, 6),
  };
}

/**
 * Contenido público del sitio. Si la base de datos no está configurada o falla, devuelve el
 * contenido de respaldo: el sitio nunca se cae por un problema de base de datos.
 */
export async function getSiteContent(): Promise<SiteContent> {
  const settings = await loadSettings();
  const tz = safeTimezone(settings.timezone);
  const today = todayISO(tz);

  if (!isDbConfigured()) return fallbackContent(settings, today);

  try {
    const [slides, stats, announcements, services, pickups] = await Promise.all([
      query<Slide>(
        `SELECT id, eyebrow, title, subtitle, body, cta_label, cta_href
         FROM slides WHERE is_active ORDER BY sort_order, id`,
      ),
      query<Stat>(`SELECT id, value, label, caption FROM stats WHERE is_active ORDER BY sort_order, id`),
      query<Announcement>(
        `SELECT id, category, title, body, published_on::text AS published_on
         FROM announcements WHERE is_active ORDER BY published_on DESC, id DESC LIMIT 30`,
      ),
      query<Service>(
        `SELECT id, name, description, eta_text, icon, status, status_note
         FROM services WHERE is_active ORDER BY sort_order, id`,
      ),
      query<Pickup>(
        `SELECT id, pickup_date::text AS pickup_date, to_char(start_time, 'HH24:MI') AS start_time,
                to_char(end_time, 'HH24:MI') AS end_time, note
         FROM pickups WHERE is_active AND pickup_date >= $1::date
         ORDER BY pickup_date, start_time LIMIT 6`,
        [today],
      ),
    ]);
    return { settings, today, source: 'database', slides, stats, announcements, services, pickups };
  } catch (err) {
    logger.error('content.load_failed_using_fallback', err);
    return fallbackContent(settings, today);
  }
}
