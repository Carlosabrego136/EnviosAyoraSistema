import bwipjs from 'bwip-js/node';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintNow } from '@/components/admin/FolioForms';
import { adminTimezone } from '@/lib/admin-utils';
import { requireFenixPage } from '@/lib/auth';
import { getFolio, moneyMx, padFolio } from '@/lib/folios';
import { formatDateTime } from '@/lib/format';
import { loadSettings } from '@/lib/site-settings';

export const metadata = { title: 'Etiqueta', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

function barcodeSvg(text: string): string {
  // Solo dígitos (el folio): Code 128 en modo numérico. Salida SVG generada por la librería, sin entrada del usuario.
  const svg = bwipjs.toSVG({ bcid: 'code128', text, height: 11, includetext: false, scale: 2, paddingwidth: 0, paddingheight: 0 });
  // Se estira solo a lo alto (las barras conservan su ancho); así el código ocupa poco espacio en la etiqueta.
  return svg.replace('<svg ', '<svg preserveAspectRatio="none" ');
}

export default async function LabelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  await requireFenixPage('folios.operate');
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const folio = await getFolio(id);
  if (!folio) notFound();
  const sp = await searchParams;
  const [tz, settings] = await Promise.all([adminTimezone(), loadSettings()]);
  const cancelled = folio.status === 'cancelado';
  const number = padFolio(folio.folio_number);

  return (
    <main className="lbl-page">
      <div className="lbl-toolbar no-print">
        <PrintNow auto={sp.auto === '1' && !cancelled} />
        <Link className="btn btn--ghost" href={`/fenix/folio/${folio.id}`}>← Volver al folio</Link>
        <p className="field__hint">
          Etiqueta de 5 × 10 cm. En el cuadro de impresión elige tu impresora térmica, tamaño 50 × 100 mm, márgenes ninguno y escala 100 %.
        </p>
      </div>

      <article className={`lbl ${cancelled ? 'lbl--cancelled' : ''}`} aria-label={`Etiqueta del folio ${number}`}>
        <header className="lbl__logo">
          <Image src="/marca-fenix/logo-etiqueta.png" alt="Fénix Point" width={720} height={569} priority unoptimized />
        </header>
        <div className="lbl__folio">{number}</div>
        <div className="lbl__barcode" aria-hidden="true" dangerouslySetInnerHTML={{ __html: barcodeSvg(number) }} />
        <div className="lbl__row"><span>{settings.folio_label_branch_title.toUpperCase()}</span><strong>{folio.branch}</strong></div>
        <div className="lbl__row"><span>PARA</span><strong>{folio.recipient_name}</strong></div>
        <div className="lbl__row"><span>DE</span><strong>{folio.sender_name}</strong></div>
        <div className="lbl__row lbl__row--split">
          <div><span>TAMAÑO</span><strong>{folio.size_name}{folio.weight_kg ? ` · ${Number(folio.weight_kg)} kg` : ''}</strong></div>
          <div><span>{folio.paid ? 'PAGADO' : 'POR COBRAR'}</span><strong>{moneyMx(folio.price)}</strong></div>
        </div>
        <footer className="lbl__foot">
          {formatDateTime(folio.created_at, tz)} · {folio.collector}
          {settings.folio_label_note ? <><br />{settings.folio_label_note}</> : null}
        </footer>
        {cancelled && <div className="lbl__stamp">CANCELADO</div>}
      </article>
    </main>
  );
}
