'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // El detalle completo queda en los logs del servidor; aquí solo el identificador.
    console.error('ui.error', error.digest ?? 'sin-digest');
  }, [error]);

  return (
    <main className="fallback" role="alert">
      <p className="fallback__code">Ups</p>
      <h1>Algo salió mal</h1>
      <p>Ya registramos el problema. Inténtalo de nuevo; si continúa, escríbenos por WhatsApp.</p>
      {error.digest && <p className="fallback__ref">Ref. {error.digest}</p>}
      <button type="button" className="btn btn--solid" onClick={reset}>Reintentar</button>
    </main>
  );
}
