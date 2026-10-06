import { notFound } from 'next/navigation';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { RecordForm } from '@/components/admin/RecordForm';
import { Icon } from '@/components/Icon';
import { adminTimezone } from '@/lib/admin-utils';
import { requirePageUser } from '@/lib/auth';
import { getRow } from '@/lib/crud';
import { formatDateTime } from '@/lib/format';
import { can } from '@/lib/permissions';
import { getResource } from '@/lib/resources';
import { loadSettings } from '@/lib/site-settings';
import { whatsappLink } from '@/lib/settings';

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  const def = getResource((await params).resource);
  return { title: def ? `Editar · ${def.singular}` : 'Editar' };
}

export default async function EditRecordPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id: rawId } = await params;
  const def = getResource(resource);
  const id = Number(rawId);
  if (!def || !Number.isSafeInteger(id) || id <= 0) notFound();

  const user = await requirePageUser(def.permission === 'leads' ? 'leads.manage' : 'content.write');
  const row = await getRow(def, id);
  if (!row) notFound();

  const tz = await adminTimezone();
  const values: Record<string, unknown> = {};
  for (const f of def.fields) {
    const v = row[f.name];
    values[f.name] = f.type === 'time' && typeof v === 'string' ? v.slice(0, 5) : v;
  }

  const deletePermission = def.permission === 'leads' ? 'leads.manage' : 'content.delete';
  const canDelete = def.canDelete && can(user.role, deletePermission);

  let contactHref: string | null = null;
  if (def.key === 'solicitudes') {
    const settings = await loadSettings();
    const digits = String(row.phone ?? '').replace(/\D/g, '');
    if (digits) {
      const phone = digits.length === 10 ? `52${digits}` : digits;
      contactHref = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${row.name}, te escribimos de ${settings.brand_name}.`)}`;
    }
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>{def.titleOf(row)}</h1>
          <p>
            {def.canCreate ? 'Editando' : 'Detalle de'} {def.singular}
            {row.created_at ? ` · creado ${formatDateTime(row.created_at as Date, tz)}` : ''}
          </p>
        </div>
        <div className="adm-head__actions">
          {contactHref && (
            <a className="btn btn--wa btn--sm" href={contactHref} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={15} /> Responder por WhatsApp
            </a>
          )}
          {canDelete && <DeleteButton resourceKey={def.key} id={id} />}
        </div>
      </header>

      <section className="adm-panel card">
        <RecordForm resourceKey={def.key} id={id} fields={def.fields} values={values} backHref={`/admin/c/${def.key}`} />
      </section>
    </>
  );
}
