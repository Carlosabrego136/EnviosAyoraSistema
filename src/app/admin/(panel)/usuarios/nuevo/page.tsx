import { NewUserForm } from '@/components/admin/AdminForms';
import { requirePageUser } from '@/lib/auth';

export const metadata = { title: 'Nuevo usuario' };

export default async function NewUserPage() {
  await requirePageUser('users.manage');
  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Nuevo usuario</h1>
          <p>El administrador puede gestionar todo; el trabajador administra contenido y solicitudes.</p>
        </div>
      </header>
      <section className="adm-panel card">
        <NewUserForm />
      </section>
    </>
  );
}
