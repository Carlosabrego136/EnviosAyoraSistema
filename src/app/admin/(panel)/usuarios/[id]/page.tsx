import { notFound } from 'next/navigation';
import { EditUserForm, ResetPasswordForm } from '@/components/admin/AdminForms';
import { requirePageUser } from '@/lib/auth';
import { getUser } from '@/lib/users';

export const metadata = { title: 'Editar usuario' };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePageUser('users.manage');
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
      </header>
      <section className="adm-panel card">
        <h2>Datos y acceso</h2>
        <EditUserForm id={user.id} name={user.name} role={user.role} isActive={user.is_active} isSelf={user.id === me.id} />
      </section>
      <section className="adm-panel card">
        <h2>Restablecer contraseña</h2>
        <p className="muted">Al restablecerla se cierran todas las sesiones abiertas de esta cuenta.</p>
        <ResetPasswordForm id={user.id} />
      </section>
    </>
  );
}
