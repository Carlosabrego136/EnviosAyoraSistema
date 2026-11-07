import { randomUUID } from 'node:crypto';
import Link from 'next/link';
import { FolioTable } from '@/components/admin/FolioList';
import { NewFolioForm, type BranchOption, type SizeOption } from '@/components/admin/FolioForms';
import { Flash } from '@/components/admin/Cell';
import { Icon } from '@/components/Icon';
import { adminTimezone } from '@/lib/admin-utils';
import { requireFenixPage } from '@/lib/auth';
import { listBranches, listFolios, listSizes, recentCollectors, summarize, moneyMx, type Folio, type FolioSummary } from '@/lib/folios';
import { logger } from '@/lib/logger';

export const metadata = { title: 'Folios y etiquetas' };
export const dynamic = 'force-dynamic';

export default async function FoliosPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string; ok?: string }> }) {
  const user = await requireFenixPage('folios.operate');
  const sp = await searchParams;
  const tz = await adminTimezone();
  const q = (sp.q ?? '').slice(0, 80);

  let sizes: SizeOption[] = [];
  let branches: BranchOption[] = [];
  let collectors: string[] = [];
  let rows: Folio[] = [];
  let summary: FolioSummary | null = null;
  let failed = false;
  try {
    const [sz, col, list, sum, br] = await Promise.all([
      listSizes(true),
      recentCollectors(),
      listFolios(q ? { q } : { today: true }, tz, 100),
      summarize({ today: true }, tz),
      listBranches(true),
    ]);
    branches = br.map((b) => ({ id: b.id, name: b.name }));
    sizes = sz.map((s) => ({ id: s.id, name: s.name, maxKg: Number(s.max_kg), price: Number(s.price) }));
    collectors = col;
    rows = list;
    summary = sum;
  } catch (err) {
    failed = true;
    logger.error('folios.page.failed', err, { user: user.id });
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Folios y etiquetas</h1>
          <p>Captura el paquete, genera su folio e imprime la etiqueta. El folio, el tamaño y el precio los calcula el sistema.</p>
        </div>
      </header>

      <Flash ok={sp.ok} error={sp.error} />

      {failed ? (
        <p className="form-alert" role="alert">
          <Icon name="alert" size={16} /> No pudimos cargar el módulo. Revisa la conexión e inténtalo de nuevo en un momento.
        </p>
      ) : (
        <>
          <section className="card fol-card" aria-labelledby="fol-new">
            <h2 id="fol-new">Nuevo folio</h2>
            {sizes.length === 0 || branches.length === 0 ? (
              <p className="form-alert" role="alert">
                <Icon name="alert" size={16} /> No hay tamaños o sucursales activos. Pídele al administrador que los configure.
              </p>
            ) : (
              <NewFolioForm requestId={randomUUID()} sizes={sizes} collectors={collectors} branches={branches} />
            )}
          </section>

          {summary && (
            <section className="fol-stats" aria-label="Resumen de hoy">
              <div className="card"><strong>{summary.active}</strong><span>Folios de hoy</span></div>
              <div className="card"><strong>{moneyMx(summary.paid_amount)}</strong><span>Cobrado hoy ({summary.paid_count})</span></div>
              <div className="card"><strong>{moneyMx(summary.pending_amount)}</strong><span>Por cobrar ({summary.pending_count})</span></div>
              <div className="card"><strong>{summary.cancelled}</strong><span>Cancelados hoy</span></div>
            </section>
          )}

          <form className="adm-search" action="/fenix" role="search">
            <input type="search" name="q" defaultValue={q} placeholder="Buscar por folio o nombre…" aria-label="Buscar folio" maxLength={80} />
            <button type="submit" className="btn btn--ghost btn--sm">Buscar</button>
            {q && <Link className="btn btn--ghost btn--sm" href="/fenix">Ver los de hoy</Link>}
          </form>
          <h2 className="fol-sub">{q ? 'Resultados' : 'Folios de hoy'}</h2>
          {rows.length === 0 ? (
            <div className="adm-empty card"><p>{q ? 'No hay resultados para esa búsqueda.' : 'Todavía no hay folios hoy.'}</p></div>
          ) : (
            <FolioTable rows={rows} tz={tz} />
          )}
        </>
      )}
    </>
  );
}
