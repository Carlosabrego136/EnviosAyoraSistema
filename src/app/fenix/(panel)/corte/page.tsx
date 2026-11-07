import Link from 'next/link';
import { PrintNow } from '@/components/admin/FolioForms';
import { Icon } from '@/components/Icon';
import { adminTimezone } from '@/lib/admin-utils';
import { requireFenixPage } from '@/lib/auth';
import { corteDelDia, moneyMx, type Corte } from '@/lib/folios';
import { todayISO } from '@/lib/format';
import { logger } from '@/lib/logger';
import { can } from '@/lib/permissions';

export const metadata = { title: 'Corte del día' };
export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function CortePage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const user = await requireFenixPage('folios.operate');
  const sp = await searchParams;
  const tz = await adminTimezone();
  const today = todayISO(tz);
  // Quien atiende el mostrador solo ve el corte de hoy; el administrador puede consultar cualquier día.
  const canPickDate = can(user.role, 'folios.manage');
  const date = canPickDate && sp.fecha && DATE_RE.test(sp.fecha) ? sp.fecha : today;

  let corte: Corte | null = null;
  try {
    corte = await corteDelDia(date, tz);
  } catch (err) {
    logger.error('folios.corte.failed', err, { date });
  }

  const dateLabel = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Corte del día</h1>
          <p>{dateLabel}</p>
        </div>
        <div className="adm-head__actions">
          <PrintNow auto={false} label="Imprimir corte" />
        </div>
      </header>

      {canPickDate && (
        <form className="card adm-filters no-print" action="/fenix/corte">
          <div className="field">
            <label htmlFor="fecha">Día</label>
            <input id="fecha" name="fecha" type="date" defaultValue={date} max={today} />
          </div>
          <button type="submit" className="btn btn--solid btn--sm">Ver corte</button>
          <Link className="btn btn--ghost btn--sm" href="/fenix/corte">Hoy</Link>
        </form>
      )}

      {!corte ? (
        <p className="form-alert" role="alert"><Icon name="alert" size={16} /> No pudimos calcular el corte. Inténtalo de nuevo en un momento.</p>
      ) : (
        <>
          <section className="fx-cut-grid" aria-label="Totales del día">
            <div className="card fx-cut-total"><strong>{moneyMx(corte.summary.paid_amount)}</strong><span>Cobrado ({corte.summary.paid_count} folios) — dinero a entregar</span></div>
            <div className="card"><strong>{moneyMx(corte.summary.pending_amount)}</strong><span>Por cobrar ({corte.summary.pending_count} folios)</span></div>
            <div className="card"><strong>{corte.summary.active}</strong><span>Folios activos</span></div>
            <div className="card"><strong>{corte.summary.cancelled}</strong><span>Cancelados (no suman)</span></div>
          </section>

          {corte.summary.total === 0 ? (
            <div className="adm-empty card"><p>No hubo folios este día.</p></div>
          ) : (
            <>
              <h2 className="fol-sub">Por recolector</h2>
              <div className="adm-table-wrap card">
                <table className="adm-table">
                  <thead>
                    <tr><th scope="col">Recolector</th><th scope="col">Folios</th><th scope="col">Cobrado</th><th scope="col">Por cobrar</th><th scope="col">Cancelados</th></tr>
                  </thead>
                  <tbody>
                    {corte.byCollector.map((r) => (
                      <tr key={r.collector}>
                        <td data-label="Recolector">{r.collector}</td>
                        <td data-label="Folios">{r.active}</td>
                        <td data-label="Cobrado">{moneyMx(r.paid_amount)}</td>
                        <td data-label="Por cobrar">{moneyMx(r.pending_amount)}</td>
                        <td data-label="Cancelados">{r.cancelled}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 className="fol-sub">Por tamaño</h2>
              <div className="adm-table-wrap card">
                <table className="adm-table">
                  <thead>
                    <tr><th scope="col">Tamaño</th><th scope="col">Folios</th><th scope="col">Importe</th></tr>
                  </thead>
                  <tbody>
                    {corte.bySize.map((r) => (
                      <tr key={r.size_name}>
                        <td data-label="Tamaño">{r.size_name}</td>
                        <td data-label="Folios">{r.active}</td>
                        <td data-label="Importe">{moneyMx(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="field__hint">El detalle folio por folio está en el <Link href={`/fenix/historial?from=${date}&to=${date}`}>historial</Link>.</p>
            </>
          )}
        </>
      )}
    </>
  );
}
