import { notFound } from 'next/navigation';
import { GuideBox } from '@/components/admin/GuideBox';
import { RecordForm } from '@/components/admin/RecordForm';
import { adminTimezone } from '@/lib/admin-utils';
import { requirePageUser } from '@/lib/auth';
import { todayISO } from '@/lib/format';
import { GUIDES, FIELD_HELP } from '@/lib/admin-guides';
import { getResource, writableFields } from '@/lib/resources';

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  const def = getResource((await params).resource);
  return { title: def ? `Nuevo · ${def.singular}` : 'Nuevo' };
}

export default async function NewRecordPage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def || !def.canCreate) notFound();

  await requirePageUser(def.permission === 'leads' ? 'leads.manage' : 'content.write');
  const today = todayISO(await adminTimezone());

  const fields = writableFields(def, false).map((f) => ({ ...f, help: f.help ?? FIELD_HELP[f.name] }));
  const guide = GUIDES[def.key];
  const values: Record<string, unknown> = {};
  for (const f of fields) {
    values[f.name] = f.default === 'today' ? today : (f.default ?? '');
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>{guide?.newLabel ?? `Agregar ${def.singular}`}</h1>
          <p>Llena los campos y pulsa el botón naranja de abajo para guardar. Los campos con * son obligatorios.</p>
        </div>
      </header>
      {guide && <GuideBox guide={guide} title="Ayuda para llenar esta pantalla" open={false} />}
      <section className="adm-panel card">
        <RecordForm resourceKey={def.key} id={0} fields={fields} values={values} backHref={`/admin/c/${def.key}`} />
      </section>
    </>
  );
}
