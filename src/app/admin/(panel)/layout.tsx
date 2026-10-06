import Image from 'next/image';
import type { ReactNode } from 'react';
import { AdminNav, type AdminNavItem } from '@/components/admin/AdminNav';
import { LogoutButton } from '@/components/admin/AdminForms';
import { requirePageUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { can, ROLE_LABEL } from '@/lib/permissions';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser();

  let newLeads = 0;
  try {
    const rows = await query<{ n: number }>(`SELECT count(*)::int AS n FROM leads WHERE status = 'nuevo'`);
    newLeads = rows[0]?.n ?? 0;
  } catch (err) {
    logger.warn('admin.layout.leads_count_failed', { error: String(err) });
  }

  const items: AdminNavItem[] = [
    { href: '/admin', label: 'Resumen', icon: 'pulse', exact: true },
    { href: '/admin/c/solicitudes', label: 'Solicitudes', icon: 'users', badge: newLeads },
    { href: '/admin/c/comunicados', label: 'Comunicados', icon: 'megaphone' },
    { href: '/admin/c/servicios', label: 'Servicios y estado', icon: 'box' },
    { href: '/admin/c/recolecciones', label: 'Recolecciones', icon: 'calendar' },
    { href: '/admin/c/slides', label: 'Carrusel', icon: 'play' },
    { href: '/admin/c/indicadores', label: 'Indicadores', icon: 'pin' },
  ];
  if (can(user.role, 'settings.write')) items.push({ href: '/admin/ajustes', label: 'Ajustes del sitio', icon: 'shield' });
  if (can(user.role, 'users.manage')) items.push({ href: '/admin/usuarios', label: 'Usuarios', icon: 'users' });
  if (can(user.role, 'audit.view')) items.push({ href: '/admin/bitacora', label: 'Bitácora', icon: 'clock' });

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <div className="adm-side__brand">
          <Image src="/emblem.png" alt="" width={351} height={452} className="adm-side__emblem" />
          <div>
            <strong>FÉNIX</strong>
            <span>Panel de administración</span>
          </div>
        </div>
        <AdminNav items={items} />
        <div className="adm-side__user">
          <div>
            <strong>{user.name}</strong>
            <span>{ROLE_LABEL[user.role]}</span>
          </div>
          <div className="adm-side__links">
            <a href="/" target="_blank" rel="noopener noreferrer">Ver sitio</a>
            <a href="/admin/cuenta">Mi cuenta</a>
            <LogoutButton />
          </div>
        </div>
      </aside>
      <main id="contenido" className="adm-main">
        {children}
      </main>
    </div>
  );
}
