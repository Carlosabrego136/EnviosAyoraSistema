import Link from 'next/link';
import { padFolio, moneyMx, type Folio } from '@/lib/folios';
import { formatDateTime } from '@/lib/format';

export function FolioTable({ rows, tz, showCollector = true }: { rows: Folio[]; tz: string; showCollector?: boolean }) {
  return (
    <div className="adm-table-wrap card">
      <table className="adm-table">
        <thead>
          <tr>
            <th scope="col">Folio</th>
            <th scope="col">Fecha</th>
            <th scope="col">Remitente</th>
            <th scope="col">Tamaño</th>
            <th scope="col">Precio</th>
            <th scope="col">Pago</th>
            {showCollector && <th scope="col">Recolector</th>}
            <th scope="col">Estado</th>
            <th scope="col"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className={f.status === 'cancelado' ? 'fol-row--cancelled' : undefined}>
              <td data-label="Folio">
                <Link className="adm-table__link fol-num" href={`/fenix/folio/${f.id}`}>{padFolio(f.folio_number)}</Link>
              </td>
              <td data-label="Fecha">{formatDateTime(f.created_at, tz)}</td>
              <td data-label="Remitente">{f.sender_name}</td>
              <td data-label="Tamaño">{f.size_name}</td>
              <td data-label="Precio">{moneyMx(f.price)}</td>
              <td data-label="Pago">{f.status === 'cancelado' ? '—' : f.paid ? 'Cobrado' : 'Por cobrar'}</td>
              {showCollector && <td data-label="Recolector">{f.collector}</td>}
              <td data-label="Estado">{f.status === 'cancelado' ? 'Cancelado' : 'Activo'}</td>
              <td className="adm-table__actions">
                <Link className="btn btn--ghost btn--sm" href={`/fenix/folio/${f.id}`}>Abrir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
