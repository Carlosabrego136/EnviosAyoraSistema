import { SettingsForm } from '@/components/admin/AdminForms';
import { requirePageUser } from '@/lib/auth';
import { SETTING_DEFS } from '@/lib/settings';
import { loadSettings } from '@/lib/site-settings';

export const metadata = { title: 'Ajustes del sitio' };

export default async function SettingsPage() {
  await requirePageUser('settings.write');
  const values = await loadSettings();
  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Ajustes del sitio</h1>
          <p>Marca, contacto, textos de la sección de comunidad y documentos legales. Los cambios se publican al guardar.</p>
        </div>
      </header>
      <section className="adm-panel card">
        <SettingsForm defs={SETTING_DEFS} values={values} />
      </section>
    </>
  );
}
