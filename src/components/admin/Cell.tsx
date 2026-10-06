import { LABELS, FLASH_ERROR, FLASH_OK } from '@/lib/admin-utils';
import { dateParts, formatDateTime, formatTime } from '@/lib/format';
import type { ColumnDef } from '@/lib/resources';
import { Icon } from '../Icon';

export function Cell({ column, value, timeZone }: { column: ColumnDef; value: unknown; timeZone: string }) {
  if (value === null || value === undefined || value === '') return <span className="muted">—</span>;

  switch (column.kind) {
    case 'bool':
      return value ? (
        <span className="tag tag--ok"><Icon name="check" size={13} /> Sí</span>
      ) : (
        <span className="tag tag--off">No</span>
      );
    case 'date': {
      const d = dateParts(String(value).slice(0, 10));
      return <span>{`${d.day} ${d.month} ${d.year}`}</span>;
    }
    case 'time':
      return <span>{formatTime(String(value))}</span>;
    case 'datetime':
      return <span>{formatDateTime(value as Date | string, timeZone)}</span>;
    case 'badge': {
      const raw = String(value);
      return <span className={`tag tag--${raw in LABELS ? raw : 'plain'}`}>{LABELS[raw] ?? raw}</span>;
    }
    default: {
      const text = String(value);
      return <span title={text.length > 60 ? text : undefined}>{text.length > 60 ? `${text.slice(0, 60)}…` : text}</span>;
    }
  }
}

export function Flash({ ok, error, notice }: { ok?: string; error?: string; notice?: string }) {
  if (ok && FLASH_OK[ok]) {
    return (
      <p className="form-ok" role="status">
        <Icon name="check" size={16} /> {FLASH_OK[ok]}
      </p>
    );
  }
  if (error && FLASH_ERROR[error]) {
    return (
      <p className="form-alert" role="alert">
        <Icon name="alert" size={16} /> {FLASH_ERROR[error]}
      </p>
    );
  }
  if (notice === 'sin-permiso') {
    return (
      <p className="form-alert" role="alert">
        <Icon name="alert" size={16} /> Tu rol no tiene acceso a esa sección.
      </p>
    );
  }
  return null;
}
