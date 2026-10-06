import Link from 'next/link';
import { Flash } from '@/components/admin/Cell';
import { Icon, type IconName } from '@/components/Icon';
import { adminTimezone } from '@/lib/admin-utils';
import { requirePageUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { formatDateTime, todayISO } from '@/lib/format';
import { logger } from '@/lib/logger';
import { can } from '@/lib/permissions';

export const metadata = { title: 'Resumen' };

interface Counts {
  new_leads: number;
  announcements: number;
  services: number;
  pickups: number;
}
interface AuditRow {
  id: number;
  created_at: Date;
  actor_name: string;
  actor_role: string;
  summary: string;
  action: string;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const user = await requirePageUser();
  const params = await searchParams;
  const tz = await adminTimezone();

  let counts: Counts = { new_leads: 0, announcements: 0, services: 0, pickups: 0 };
  let recent: AuditRow[] = [];
  let loadError = false;
  try {
    const rows = await query<Counts>(
      `SELECT
         (SELECT count(*) FROM leads WHERE status = 'nuevo')::int AS new_leads,
         (SELECT count(*) FROM announcements WHERE is_active)::int AS announcements,
         (SELECT count(*) FROM services WHERE is_active)::int AS services,
         (SELECT count(*) FROM pickups WHERE is_active AND pickup_date >= $1::date)::int AS pickups`,
      [todayISO(tz)],
    );
    counts = rows[0] ?? counts;
    if (can(user.role, 'audit.view')) {
      recent = await query<AuditRow>(
        'SELECT id, created_at, actor_name, actor_role, summary, action FROM audit_log ORDER BY id DESC LIMIT 8',
      );
    }
  } catch (err) {
    loadError = true;
    logger.error('admin.dashboard.load_failed', err);
  }

  const cards: { label: string; value: number; href: string; icon: IconName; hint: string }[] = [
    { label: 'Solicitudes nuevas', value: counts.new_leads, href: '/admin/c/solicitudes?estado=nuevo', icon: 'users', hint: 'Por atender' },
    { label: 'Próximas recolecciones', value: counts.pickups, href: '/admin/c/recolecciones', icon: 'calendar', hint: 'Fechas publicadas' },
    { label: 'Comunicados visibles', value: counts.announcements, href: '/admin/c/comunicados', icon: 'megaphone', hint: 'En el sitio' },
    { label: 'Servicios visibles', value: counts.services, href: '/admin/c/servicios', icon: 'box', hint: 'En el sitio' },
  ];

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Hola, {user.name.split(' ')[0]}</h1>
          <p>Administra el contenido del sitio y atiende las solicitudes.</p>
        </div>
      </header>

      <Flash notice={params.aviso} />
      {loadError && (
        <p className="form-alert" role="alert">
          <Icon name="alert" size={16} /> No pudimos cargar algunos datos. Revisa la conexión con la base de datos.
        </p>
      )}

      <section className="adm-cards" aria-label="Resumen">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="adm-stat card">
            <span className="adm-stat__icon"><Icon name={c.icon} size={20} /></span>
            <strong>{c.value}</strong>
            <span>{c.label}</span>
            <small>{c.hint}</small>
          </Link>
        ))}
      </section>

      <section className="adm-panel card">
        <h2>Atajos</h2>
        <div className="adm-quick">
          <Link className="btn btn--ghost btn--sm" href="/admin/c/comunicados/nuevo">Publicar comunicado</Link>
          <Link className="btn btn--ghost btn--sm" href="/admin/c/recolecciones/nuevo">Agregar recolección</Link>
          <Link className="btn btn--ghost btn--sm" href="/admin/c/servicios">Cambiar estado de un servicio</Link>
          {can(user.role, 'settings.write') && <Link className="btn btn--ghost btn--sm" href="/admin/ajustes">Ajustes del sitio</Link>}
        </div>
      </section>

      {can(user.role, 'audit.view') && (
        <section className="adm-panel card">
          <div className="adm-panel__head">
            <h2>Actividad reciente</h2>
            <Link className="link-arrow" href="/admin/bitacora">Ver bitácora <Icon name="arrow" size={15} /></Link>
          </div>
          {recent.length === 0 ? (
            <p className="muted">Sin actividad registrada.</p>
          ) : (
            <ul className="adm-activity">
              {recent.map((r) => (
                <li key={r.id}>
                  <span className="adm-activity__time">{formatDateTime(r.created_at, tz)}</span>
                  <span><strong>{r.actor_name}</strong> · {r.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
