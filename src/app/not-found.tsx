import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="fallback">
      <p className="fallback__code">404</p>
      <h1>Esta página no existe</h1>
      <p>Es posible que el enlace haya cambiado. Regresa al inicio para continuar.</p>
      <Link className="btn btn--solid" href="/">Ir al inicio</Link>
    </main>
  );
}
