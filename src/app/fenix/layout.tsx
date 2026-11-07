import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../admin/admin.css';
import './fenix.css';

export const metadata: Metadata = {
  title: { default: 'Fénix Point', template: '%s · Fénix Point' },
  robots: { index: false, follow: false, nocache: true },
};

export default function FenixRootLayout({ children }: { children: ReactNode }) {
  return <div className="adm fx">{children}</div>;
}
