import Link from 'next/link';
import { notFound } from 'next/navigation';
import { togglePaidAction } from '@/app/fenix/actions';
import { Flash } from '@/components/admin/Cell';
import { CancelFolioForm, EditFolioForm, type BranchOption, type SizeOption } from '@/components/admin/FolioForms';
import { Icon } from '@/components/Icon';
import { adminTimezone } from '@/lib/admin-utils';
import { requireFenixPage } from '@/lib/auth';
import { getFolio, listBranches, listSizes, moneyMx, padFolio, recentCollectors, whatsappLink } from '@/lib/folios';
import { formatDateTime } from '@/lib/format';
import { logger } from '@/lib/logger';
import { loadSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Folio ${(await params).id}` };
}

export default async function FolioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string; cancelado?: string; ok?: string; error?: string }>;
}) {
  await requireFenixPage('folios.operate');
  const id = Number((await params).id);
  const sp = await searchParams;
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  let folio;
  try {
    folio = await getFolio(id);
  } catch (err) {
    logger.error('folios.detail.failed', err, { id });
    return (
      <p className="form-alert" role="alert">
        <Icon name="alert" size={16} /> No pudimos cargar el folio. Inténtalo de nuevo en un momento.
      </p>
    );
  }
  if (!folio) notFound();

  const [tz, settings, sizeRows, collectors, branchRows] = await Promise.all([adminTimezone(), loadSettings(), listSizes(true), recentCollectors(), listBranches(true)]);
  const sizes: SizeOption[] = sizeRows.map((s) => ({ id: s.id, name: s.name, maxKg: Number(s.max_kg), price: Number(s.price) }));
  // La sucursal actual siempre aparece en la lista, aunque ya se haya desactivado.
  const branches: BranchOption[] = branchRows.map((b) => ({ id: b.id, name: b.name }));
  if (folio.branch_id && !branches.some((b) => b.id === folio.branch_id)) branches.unshift({ id: folio.branch_id, name: folio.branch });
  const cancelled = folio.status === 'cancelado';
  const wa = cancelled ? null : whatsappLink(folio, settings.folio_wa_message);

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Folio <span className="fol-num">{padFolio(folio.folio_number)}</span> {cancelled && <span className="fol-tag fol-tag--bad">Cancelado</span>}</h1>
          <p>Creado {formatDateTime(folio.created_at, tz)} por {folio.created_by_name || '—'}</p>
        </div>
        <div className="adm-head__actions">
          <Link className="btn btn--ghost btn--sm" href="/fenix">← Volver a folios</Link>
        </div>
      </header>

      {sp.nuevo === '1' && (
        <p className="form-ok" role="status"><Icon name="check" size={16} /> Folio {padFolio(folio.folio_number)} generado. Imprime la etiqueta y pégala al paquete.</p>
      )}
      {sp.cancelado === '1' && (
        <p className="form-ok" role="status"><Icon name="check" size={16} /> El folio quedó cancelado y asentado en la bitácora.</p>
      )}
      <Flash ok={sp.ok} error={sp.error} />

      <section className="card fol-card">
        <dl className="fol-dl">
          <div><dt>Sucursal de entrega</dt><dd>{folio.branch}</dd></div>
          <div><dt>Remitente</dt><dd>{folio.sender_name}{folio.sender_phone ? ` · ${folio.sender_phone}` : ''}</dd></div>
          <div><dt>Quien recibe</dt><dd>{folio.recipient_name || '—'}</dd></div>
          <div><dt>Tamaño</dt><dd>{folio.size_name}{folio.weight_kg ? ` · ${Number(folio.weight_kg)} kg` : ''}</dd></div>
          <div><dt>Precio</dt><dd>{moneyMx(folio.price)} · {cancelled ? 'sin cobro' : folio.paid ? `Cobrado${folio.paid_at ? ` el ${formatDateTime(folio.paid_at, tz)}` : ''}` : 'Por cobrar'}</dd></div>
          <div><dt>Recolector</dt><dd>{folio.collector}</dd></div>
          {folio.notes && <div><dt>Notas</dt><dd>{folio.notes}</dd></div>}
          {cancelled && <div><dt>Cancelación</dt><dd>{folio.cancel_reason} · {folio.cancelled_by}{folio.cancelled_at ? ` · ${formatDateTime(folio.cancelled_at, tz)}` : ''}</dd></div>}
        </dl>
        {!cancelled && (
          <div className="fol-actions">
            <a className="btn btn--solid" href={`/fenix/etiqueta/${folio.id}?auto=1`} target="_blank" rel="noopener">
              <Icon name="box" size={16} /> Imprimir etiqueta
            </a>
            {wa ? (
              <a className="btn btn--ghost" href={wa} target="_blank" rel="noopener noreferrer">
                <Icon name="whatsapp" size={16} /> Enviar comprobante por WhatsApp
              </a>
            ) : (
              <span className="field__hint">Agrega el WhatsApp del remitente (abajo) para enviarle el comprobante.</span>
            )}
            <form action={togglePaidAction.bind(null, folio.id, !folio.paid)}>
              <button type="submit" className="btn btn--ghost">{folio.paid ? 'Marcar como por cobrar' : 'Marcar como cobrado'}</button>
            </form>
          </div>
        )}
      </section>

      {!cancelled && (
        <>
          <details className="card fol-card fol-details">
            <summary>Corregir datos del folio</summary>
            <p className="field__hint">El número y la fecha del folio no se pueden cambiar. Si cambias el peso, el tamaño y el precio se recalculan; la sucursal sí se puede corregir.</p>
            <EditFolioForm
              id={folio.id}
              sizes={sizes}
              collectors={collectors}
              branches={branches}
              initial={{
                sender_name: folio.sender_name,
                sender_phone: folio.sender_phone,
                recipient_name: folio.recipient_name,
                weight_kg: folio.weight_kg ? String(Number(folio.weight_kg)) : '',
                collector: folio.collector,
                branch_id: folio.branch_id ? String(folio.branch_id) : '',
                notes: folio.notes,
                paid: folio.paid,
              }}
            />
          </details>
          <details className="card fol-card fol-details">
            <summary>Cancelar folio</summary>
            <CancelFolioForm id={folio.id} />
          </details>
        </>
      )}
    </>
  );
}
