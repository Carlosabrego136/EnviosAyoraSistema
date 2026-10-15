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
          <p>Aquí cambias los datos generales del sitio: WhatsApp, enlaces del grupo y redes, día y horario de recolección, textos de Misión y Visión, y los documentos legales. Cambia lo que necesites y pulsa "Guardar ajustes" al final de la página: se publica al guardar.</p>
        </div>
      </header>
      <section className="adm-panel card">
        <SettingsForm defs={SETTING_DEFS} values={values} />
      </section>
    </>
  );
}
