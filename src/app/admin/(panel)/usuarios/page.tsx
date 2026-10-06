import Link from 'next/link';
import { Flash } from '@/components/admin/Cell';
import { Icon } from '@/components/Icon';
import { adminTimezone, LABELS } from '@/lib/admin-utils';
import { requirePageUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { logger } from '@/lib/logger';
import { listUsers, type UserRecord } from '@/lib/users';

export const metadata = { title: 'Usuarios' };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const me = await requirePageUser('users.manage');
  const sp = await searchParams;
  const tz = await adminTimezone();

  let users: UserRecord[] = [];
  let failed = false;
  try {
    users = await listUsers();
  } catch (err) {
    failed = true;
    logger.error('admin.users.list_failed', err);
  }

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Usuarios</h1>
          <p>Administradores y trabajadores con acceso al panel. Todo lo que hagan queda en la bitácora.</p>
        </div>
        <Link className="btn btn--solid btn--sm" href="/admin/usuarios/nuevo">
          <Icon name="check" size={14} /> Nuevo usuario
        </Link>
      </header>
      <Flash ok={sp.ok} />
      {failed ? (
        <p className="form-alert" role="alert"><Icon name="alert" size={16} /> No pudimos cargar los usuarios.</p>
      ) : (
        <div className="adm-table-wrap card">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Correo</th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
                <th scope="col">Último acceso</th>
                <th scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="Nombre">
                    <Link href={`/admin/usuarios/${u.id}`} className="adm-table__link">
                      {u.name}{u.id === me.id ? ' (tú)' : ''}
                    </Link>
                  </td>
                  <td data-label="Correo">{u.email}</td>
                  <td data-label="Rol"><span className={`tag tag--${u.role}`}>{LABELS[u.role]}</span></td>
                  <td data-label="Estado">
                    {u.is_active ? <span className="tag tag--ok">Activo</span> : <span className="tag tag--off">Inactivo</span>}
                  </td>
                  <td data-label="Último acceso">{u.last_login_at ? formatDateTime(u.last_login_at, tz) : <span className="muted">Nunca</span>}</td>
                  <td className="adm-table__actions">
                    <Link className="link-arrow" href={`/admin/usuarios/${u.id}`}>Editar <Icon name="arrow" size={14} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
