import 'server-only';
import type { PoolClient } from 'pg';
import type { RequestContext } from './security';

export interface Actor {
  id: number | null;
  email: string;
  name: string;
  role: string;
}

export const SYSTEM_ACTOR: Actor = { id: null, email: 'sistema', name: 'Sistema', role: 'system' };

export interface AuditEntry {
  actor: Actor;
  action: string;
  entity: string;
  entityId: string | number;
  summary: string;
  before?: unknown;
  after?: unknown;
  ctx: RequestContext;
}

const NEVER_STORE = /^(password|password_hash|token|secret)$/i;

function scrub(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(scrub);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (NEVER_STORE.test(k)) continue; // las contraseñas y hashes jamás se guardan en la bitácora
    out[k] = scrub(v);
  }
  return out;
}

/**
 * Registra en la bitácora quién, cuándo (created_at) y qué dato se modificó.
 * DEBE llamarse con el cliente de la MISMA transacción que la acción: si este INSERT falla,
 * la excepción se propaga y la transacción completa se revierte (no hay acción sin registro).
 */
export async function writeAudit(client: PoolClient, entry: AuditEntry): Promise<void> {
  await client.query(
    `INSERT INTO audit_log
       (actor_id, actor_email, actor_name, actor_role, action, entity, entity_id, summary,
        before_data, after_data, ip_hash, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12)`,
    [
      entry.actor.id,
      entry.actor.email,
      entry.actor.name,
      entry.actor.role,
      entry.action,
      entry.entity,
      String(entry.entityId),
      entry.summary.slice(0, 500),
      entry.before === undefined ? null : JSON.stringify(scrub(entry.before)),
      entry.after === undefined ? null : JSON.stringify(scrub(entry.after)),
      entry.ctx.ipHash,
      entry.ctx.userAgent,
    ],
  );
}
