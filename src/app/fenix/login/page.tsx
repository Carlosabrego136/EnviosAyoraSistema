import Image from 'next/image';
import { redirect } from 'next/navigation';
import { FenixLoginForm } from '@/components/fenix/FenixAuth';
import { Icon } from '@/components/Icon';
import { getCurrentUser } from '@/lib/auth';
import { isDbConfigured } from '@/lib/db';

export const metadata = { title: 'Iniciar sesión' };
export const dynamic = 'force-dynamic';

export default async function FenixLoginPage() {
  if (isDbConfigured() && (await getCurrentUser())) redirect('/fenix');
  return (
    <main id="contenido" className="adm-login">
      <div className="adm-login__card card">
        <Image src="/marca-fenix/logo-fenix-point.jpg" alt="Fénix Point · Tu logística, en un solo punto." width={720} height={720} priority className="fx-login-logo" />
        <h1>Acceso al mostrador</h1>
        {!isDbConfigured() && (
          <p className="form-alert" role="alert">
            <Icon name="alert" size={16} /> El sistema no está disponible por el momento. Inténtalo más tarde.
          </p>
        )}
        <FenixLoginForm />
      </div>
    </main>
  );
}
