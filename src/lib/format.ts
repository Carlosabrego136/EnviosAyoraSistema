const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function parseISODate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria indicada. */
export function todayISO(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function dateParts(iso: string): { day: string; month: string; weekday: string; year: string } {
  const p = parseISODate(iso);
  if (!p) return { day: '--', month: '---', weekday: '', year: '' };
  const weekday = WEEKDAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
  return { day: String(p.d), month: MONTHS_SHORT[p.m - 1], weekday, year: String(p.y) };
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO);
  const b = parseISODate(toISO);
  if (!a || !b) return 0;
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

export function relativeDays(days: number): string {
  if (days <= 0) return 'HOY';
  if (days === 1) return 'MAÑANA';
  return `EN ${days} DÍAS`;
}

/** 'HH:MM[:SS]' → '11:00 a.m.' */
export function formatTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const h = Number(match[1]);
  const suffix = h >= 12 ? 'p.m.' : 'a.m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${match[2]} ${suffix}`;
}

export function formatLongDate(iso: string): string {
  const p = parseISODate(iso);
  if (!p) return iso;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(p.y, p.m - 1, p.d)));
}

export function formatDateTime(value: Date | string, timeZone = 'America/Tijuana'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date);
}
