import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Cell, Flash } from '@/components/admin/Cell';
import { Icon } from '@/components/Icon';
import { adminTimezone, LABELS } from '@/lib/admin-utils';
import { requirePageUser } from '@/lib/auth';
import { listRows, type Row } from '@/lib/crud';
import { logger } from '@/lib/logger';
import { getResource } from '@/lib/resources';

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  const def = getResource((await params).resource);
  return { title: def?.plural ?? 'Módulo' };
}

const LEAD_FILTERS = ['nuevo', 'contactado', 'cerrado'];

export default async function ResourceListPage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ ok?: string; error?: string; estado?: string }>;
}) {
  const { resource } = await params;
  const sp = await searchParams;
  const def = getResource(resource);
  if (!def) notFound();

  await requirePageUser(def.permission === 'leads' ? 'leads.manage' : 'content.write');
  const tz = await adminTimezone();

  const filters: Record<string, string> = {};
  if (def.key === 'solicitudes' && sp.estado && LEAD_FILTERS.includes(sp.estado)) filters.status = sp.estado;

  let rows: Row[] = [];
  let total = 0;
  let failed = false;
  try {
    ({ rows, total } = await listRows(def, { limit: 200, filters }));
  } catch (err) {
    failed = true;
    logger.error('admin.list.failed', err, { resource });
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>{def.plural}</h1>
          <p>{def.description}</p>
        </div>
        {def.canCreate && (
          <Link className="btn btn--solid btn--sm" href={`/admin/c/${def.key}/nuevo`}>
            <Icon name="check" size={14} /> Nuevo
          </Link>
        )}
      </header>

      <Flash ok={sp.ok} error={sp.error} />

      {def.key === 'solicitudes' && (
        <div className="adm-tabs" role="tablist" aria-label="Filtrar por estado">
          <Link href="/admin/c/solicitudes" className={!filters.status ? 'is-active' : undefined}>Todas</Link>
          {LEAD_FILTERS.map((f) => (
            <Link key={f} href={`/admin/c/solicitudes?estado=${f}`} className={filters.status === f ? 'is-active' : undefined}>
              {LABELS[f]}
            </Link>
          ))}
        </div>
      )}

      {failed ? (
        <p className="form-alert" role="alert">
          <Icon name="alert" size={16} /> No pudimos cargar los datos. Revisa la conexión con la base de datos.
        </p>
      ) : rows.length === 0 ? (
        <div className="adm-empty card">
          <p>Aún no hay registros.</p>
          {def.canCreate && (
            <Link className="btn btn--ghost btn--sm" href={`/admin/c/${def.key}/nuevo`}>Crear el primero</Link>
          )}
        </div>
      ) : (
        <div className="adm-table-wrap card">
          <table className="adm-table">
            <thead>
              <tr>
                {def.columns.map((c) => (
                  <th key={c.name} scope="col">{c.label}</th>
                ))}
                <th scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {def.columns.map((c, i) => (
                    <td key={c.name} data-label={c.label}>
                      {i === 0 ? (
                        <Link href={`/admin/c/${def.key}/${row.id}`} className="adm-table__link">
                          <Cell column={c} value={row[c.name]} timeZone={tz} />
                        </Link>
                      ) : (
                        <Cell column={c} value={row[c.name]} timeZone={tz} />
                      )}
                    </td>
                  ))}
                  <td className="adm-table__actions">
                    <Link className="link-arrow" href={`/admin/c/${def.key}/${row.id}`}>
                      {def.canCreate ? 'Editar' : 'Abrir'} <Icon name="arrow" size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="adm-table__count">{total} registro(s)</p>
        </div>
      )}
    </>
  );
}
