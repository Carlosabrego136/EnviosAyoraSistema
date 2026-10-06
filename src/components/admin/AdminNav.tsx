'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/Icon';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  badge?: number;
}

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="adm-nav" aria-label="Secciones del panel">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={active ? 'is-active' : undefined} aria-current={active ? 'page' : undefined}>
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
            {item.badge ? <em className="adm-badge" aria-label={`${item.badge} nuevas`}>{item.badge}</em> : null}
          </Link>
        );
      })}
    </nav>
  );
}
