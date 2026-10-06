import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/AdminForms';
import { Icon } from '@/components/Icon';
import { getCurrentUser } from '@/lib/auth';
import { isDbConfigured } from '@/lib/db';

export const metadata = { title: 'Iniciar sesión' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ cambio?: string }> }) {
  const params = await searchParams;
  if (isDbConfigured() && (await getCurrentUser())) redirect('/admin');

  return (
    <main id="contenido" className="adm-login">
      <div className="adm-login__card card">
        <Image src="/logo.png" alt="Fénix · Recolección y Envíos" width={878} height={467} priority className="adm-login__logo" />
        <h1>Panel de administración</h1>
        {!isDbConfigured() && (
          <p className="form-alert" role="alert">
            <Icon name="alert" size={16} /> La base de datos no está configurada. Agrega <code>DATABASE_URL</code> y ejecuta{' '}
            <code>npm run db:setup</code>.
          </p>
        )}
        <LoginForm passwordChanged={params.cambio === '1'} />
        <Link href="/" className="adm-login__back">← Volver al sitio</Link>
      </div>
    </main>
  );
}
