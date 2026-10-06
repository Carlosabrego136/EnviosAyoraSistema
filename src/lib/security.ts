import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';

export interface RequestContext {
  ipHash: string;
  userAgent: string;
}

function pepper(): string {
  return process.env.SESSION_SECRET || 'fenix-dev-pepper';
}

/** Hash irreversible de la IP: permite limitar abusos y auditar sin guardar la IP en claro. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(`${pepper()}|${ip}`).digest('hex').slice(0, 32);
}

export async function getRequestContext(): Promise<RequestContext> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || h.get('x-real-ip') || 'desconocida';
  return {
    ipHash: hashIp(ip),
    userAgent: (h.get('user-agent') ?? '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255),
  };
}

// ── Saneamiento de texto ───────────────────────────────────────

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩﻿]/g;

/** Texto de una sola línea: sin caracteres de control, espacios colapsados. */
export function cleanLine(input: unknown, max = 200): string {
  if (typeof input !== 'string') return '';
  return input
    .normalize('NFC')
    .replace(CONTROL_CHARS, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max);
}

/** Texto multilínea: conserva saltos de línea, elimina caracteres de control y exceso de líneas vacías. */
export function cleanMultiline(input: unknown, max = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

/** Solo permite destinos de enlace seguros: ancla interna, ruta interna, https o la palabra "whatsapp". */
export function isSafeHref(href: string): boolean {
  if (href === '' || href === 'whatsapp') return true;
  if (href.startsWith('#') || (href.startsWith('/') && !href.startsWith('//'))) return true;
  try {
    const u = new URL(href);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}
