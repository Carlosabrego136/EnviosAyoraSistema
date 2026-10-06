import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { adminTimezone } from '@/lib/admin-utils';
import { requirePageUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatDateTime } from '@/lib/format';
import { logger } from '@/lib/logger';
import { ROLE_LABEL } from '@/lib/permissions';

export const metadata = { title: 'Bitácora de auditoría' };

const PAGE_SIZE = 50;

interface AuditRow {
  id: number;
  created_at: Date;
  actor_email: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity: string;
  entity_id: string;
  summary: string;
  before_data: unknown;
  after_data: unknown;
}

const ENTITY_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todo' },
  { value: 'announcements', label: 'Comunicados' },
  { value: 'services', label: 'Servicios' },
  { value: 'pickups', label: 'Recolecciones' },
  { value: 'slides', label: 'Carrusel' },
  { value: 'stats', label: 'Indicadores' },
  { value: 'leads', label: 'Solicitudes' },
  { value: 'site_settings', label: 'Ajustes' },
  { value: 'users', label: 'Usuarios y accesos' },
];

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ entidad?: string; pagina?: string; q?: string }> }) {
  await requirePageUser('audit.view');
  const sp = await searchParams;
  const tz = await adminTimezone();

  const entity = ENTITY_FILTERS.some((f) => f.value === sp.entidad) ? (sp.entidad ?? '') : '';
  const page = Math.max(1, Math.min(Number(sp.pagina) || 1, 10_000));
  const term = (sp.q ?? '').trim().slice(0, 80);

  const where: string[] = [];
  const params: unknown[] = [];
  if (entity) {
    params.push(entity);
    where.push(`entity = $${params.length}`);
  }
  if (term) {
    params.push(`%${term.replace(/[%_\\]/g, (m) => `\\${m}`)}%`);
    where.push(`(summary ILIKE $${params.length} OR actor_name ILIKE $${params.length} OR actor_email ILIKE $${params.length} OR action ILIKE $${params.length})`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  let rows: AuditRow[] = [];
  let total = 0;
  let failed = false;
  try {
    rows = await query<AuditRow>(
      `SELECT id, created_at, actor_email, actor_name, actor_role, action, entity, entity_id, summary, before_data, after_data
       FROM audit_log ${whereSql} ORDER BY id DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
      params,
    );
    total = (await query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log ${whereSql}`, params))[0]?.n ?? 0;
  } catch (err) {
    failed = true;
    logger.error('admin.audit.load_failed', err);
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) => {
    const qs = new URLSearchParams();
    if (entity) qs.set('entidad', entity);
    if (term) qs.set('q', term);
    if (p > 1) qs.set('pagina', String(p));
    const s = qs.toString();
    return `/admin/bitacora${s ? `?${s}` : ''}`;
  };

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Bitácora de auditoría</h1>
          <p>Quién hizo cada cambio, cuándo y qué dato modificó. Es de solo lectura: nadie puede editarla ni borrarla.</p>
        </div>
      </header>

      <form className="adm-filters card" method="get" action="/admin/bitacora">
        <div className="field">
          <label htmlFor="entidad">Sección</label>
          <select id="entidad" name="entidad" defaultValue={entity}>
            {ENTITY_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="q">Buscar</label>
          <input id="q" name="q" type="text" defaultValue={term} placeholder="Persona, acción o texto" maxLength={80} />
        </div>
        <button type="submit" className="btn btn--ghost btn--sm">Filtrar</button>
      </form>

      {failed ? (
        <p className="form-alert" role="alert"><Icon name="alert" size={16} /> No pudimos cargar la bitácora.</p>
      ) : rows.length === 0 ? (
        <div className="adm-empty card"><p>No hay registros con esos filtros.</p></div>
      ) : (
        <div className="adm-table-wrap card">
          <table className="adm-table adm-table--audit">
            <thead>
              <tr>
                <th scope="col">Cuándo</th>
                <th scope="col">Quién</th>
                <th scope="col">Qué</th>
                <th scope="col">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Cuándo" className="nowrap">{formatDateTime(r.created_at, tz)}</td>
                  <td data-label="Quién">
                    <strong>{r.actor_name}</strong>
                    <small>{r.actor_email} · {ROLE_LABEL[r.actor_role as 'admin' | 'worker'] ?? 'Sistema'}</small>
                  </td>
                  <td data-label="Qué">
                    <span className="tag tag--plain">{r.action}</span>
                    <small>{r.entity}{r.entity_id ? ` #${r.entity_id}` : ''}</small>
                  </td>
                  <td data-label="Detalle">
                    <span>{r.summary}</span>
                    {(r.before_data || r.after_data) ? (
                      <details className="adm-diff">
                        <summary>Ver datos</summary>
                        <div className="adm-diff__cols">
                          {r.before_data ? (
                            <div><h3>Antes</h3><pre>{pretty(r.before_data)}</pre></div>
                          ) : null}
                          {r.after_data ? (
                            <div><h3>Después</h3><pre>{pretty(r.after_data)}</pre></div>
                          ) : null}
                        </div>
                      </details>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <nav className="adm-pager" aria-label="Paginación">
            {page > 1 ? <Link className="btn btn--ghost btn--sm" href={link(page - 1)}>← Anterior</Link> : <span />}
            <span>Página {page} de {pages} · {total} registro(s)</span>
            {page < pages ? <Link className="btn btn--ghost btn--sm" href={link(page + 1)}>Siguiente →</Link> : <span />}
          </nav>
        </div>
      )}
    </>
  );
}
