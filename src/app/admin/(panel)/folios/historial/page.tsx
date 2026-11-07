import Link from 'next/link';
import { FolioTable } from '@/components/admin/FolioList';
import { Icon } from '@/components/Icon';
import { adminTimezone } from '@/lib/admin-utils';
import { requirePageUser } from '@/lib/auth';
import { listFolios, moneyMx, recentCollectors, summarize, LIST_LIMIT, type Folio, type FolioFilters, type FolioSummary } from '@/lib/folios';
import { todayISO } from '@/lib/format';
import { logger } from '@/lib/logger';

export const metadata = { title: 'Historial de folios' };
export const dynamic = 'force-dynamic';

type SP = { q?: string; from?: string; to?: string; collector?: string; status?: string; paid?: string };
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function FolioHistoryPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requirePageUser('folios.manage');
  const sp = await searchParams;
  const tz = await adminTimezone();
  const today = todayISO(tz);

  const filters: FolioFilters = {
    q: sp.q?.slice(0, 80),
    from: sp.from && DATE_RE.test(sp.from) ? sp.from : today,
    to: sp.to && DATE_RE.test(sp.to) ? sp.to : today,
    collector: sp.collector?.slice(0, 60),
    status: sp.status === 'activo' || sp.status === 'cancelado' ? sp.status : '',
    paid: sp.paid === 'si' || sp.paid === 'no' ? sp.paid : '',
  };

  let rows: Folio[] = [];
  let summary: FolioSummary | null = null;
  let collectors: string[] = [];
  let failed = false;
  try {
    [rows, summary, collectors] = await Promise.all([listFolios(filters, tz, LIST_LIMIT), summarize(filters, tz), recentCollectors()]);
  } catch (err) {
    failed = true;
    logger.error('folios.history.failed', err);
  }

  const exportQuery = new URLSearchParams(
    Object.entries({ ...filters, from: filters.from, to: filters.to }).filter(([, v]) => typeof v === 'string' && v) as [string, string][],
  ).toString();

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Historial de folios</h1>
          <p>Consulta, filtra y exporta todos los folios. Los totales solo cuentan los folios activos.</p>
        </div>
        <div className="adm-head__actions">
          <a className="btn btn--solid btn--sm" href={`/admin/folios/exportar?${exportQuery}`}>Descargar CSV (Excel)</a>
        </div>
      </header>

      <form className="card adm-filters" action="/admin/folios/historial">
        <div className="field"><label htmlFor="from">Desde</label><input id="from" name="from" type="date" defaultValue={filters.from} /></div>
        <div className="field"><label htmlFor="to">Hasta</label><input id="to" name="to" type="date" defaultValue={filters.to} /></div>
        <div className="field">
          <label htmlFor="collector">Recolector</label>
          <select id="collector" name="collector" defaultValue={filters.collector ?? ''}>
            <option value="">Todos</option>
            {collectors.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Estado</label>
          <select id="status" name="status" defaultValue={filters.status ?? ''}>
            <option value="">Todos</option><option value="activo">Activos</option><option value="cancelado">Cancelados</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="paid">Pago</label>
          <select id="paid" name="paid" defaultValue={filters.paid ?? ''}>
            <option value="">Todos</option><option value="si">Cobrados</option><option value="no">Por cobrar</option>
          </select>
        </div>
        <div className="field"><label htmlFor="q">Buscar</label><input id="q" name="q" type="search" defaultValue={filters.q ?? ''} maxLength={80} placeholder="Folio, nombre o guía" /></div>
        <button type="submit" className="btn btn--solid btn--sm">Filtrar</button>
        <Link className="btn btn--ghost btn--sm" href="/admin/folios/historial">Hoy</Link>
      </form>

      {failed ? (
        <p className="form-alert" role="alert"><Icon name="alert" size={16} /> No pudimos cargar el historial. Inténtalo de nuevo en un momento.</p>
      ) : (
        <>
          {summary && (
            <section className="fol-stats" aria-label="Totales del filtro">
              <div className="card"><strong>{summary.active}</strong><span>Folios activos</span></div>
              <div className="card"><strong>{moneyMx(summary.paid_amount)}</strong><span>Cobrado ({summary.paid_count})</span></div>
              <div className="card"><strong>{moneyMx(summary.pending_amount)}</strong><span>Por cobrar ({summary.pending_count})</span></div>
              <div className="card"><strong>{summary.cancelled}</strong><span>Cancelados</span></div>
            </section>
          )}
          {rows.length === 0 ? (
            <div className="adm-empty card"><p>No hay folios con esos filtros.</p></div>
          ) : (
            <>
              <FolioTable rows={rows} tz={tz} />
              {summary && summary.total > rows.length && (
                <p className="field__hint">Se muestran los {rows.length} más recientes de {summary.total}. El CSV incluye todos los del filtro.</p>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
