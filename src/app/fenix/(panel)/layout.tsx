import Image from 'next/image';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AdminNav, type AdminNavItem } from '@/components/admin/AdminNav';
import { FenixLogoutButton } from '@/components/fenix/FenixAuth';
import { getCurrentUser } from '@/lib/auth';
import { can, ROLE_LABEL } from '@/lib/permissions';

export default async function FenixPanelLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/fenix/login');
  // Quien no tenga acceso a folios (p. ej. un trabajador de contenido) vuelve a su panel.
  if (!can(user.role, 'folios.operate')) redirect('/admin?aviso=sin-permiso');

  const items: AdminNavItem[] = [{ href: '/fenix', label: 'Folios y etiquetas', icon: 'box', exact: true }];
  items.push({ href: '/fenix/corte', label: 'Corte del día', icon: 'calc' });
  if (can(user.role, 'folios.manage')) items.push({ href: '/fenix/historial', label: 'Historial de folios', icon: 'clock' });

  const isAdmin = user.role === 'admin';

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <div className="adm-side__brand fx-brand">
          <Image src="/marca-fenix/logo-fenix-point.jpg" alt="" width={720} height={720} />
          <div>
            <strong>FÉNIX POINT</strong>
            <span>Mostrador · Folios</span>
          </div>
        </div>
        <AdminNav items={items} />
        <div className="adm-side__user">
          <div>
            <strong>{user.name}</strong>
            <span>{ROLE_LABEL[user.role]}</span>
          </div>
          <div className="adm-side__links">
            {isAdmin && <a href="/admin">Panel de administración</a>}
            <FenixLogoutButton />
          </div>
        </div>
      </aside>
      <main id="contenido" className="adm-main">
        {children}
      </main>
    </div>
  );
}
