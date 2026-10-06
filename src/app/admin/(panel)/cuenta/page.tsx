import { OwnPasswordForm } from '@/components/admin/AdminForms';
import { requirePageUser } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/permissions';

export const metadata = { title: 'Mi cuenta' };

export default async function AccountPage() {
  const user = await requirePageUser();
  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Mi cuenta</h1>
          <p>{user.name} · {user.email} · {ROLE_LABEL[user.role]}</p>
        </div>
      </header>
      <section className="adm-panel card">
        <h2>Cambiar contraseña</h2>
        <p className="muted">Al cambiarla se cerrarán tus sesiones y tendrás que iniciar sesión de nuevo.</p>
        <OwnPasswordForm />
      </section>
    </>
  );
}
