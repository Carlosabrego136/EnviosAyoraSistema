'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es-MX">
      <body style={{ margin: 0, background: '#060b16', color: '#e9eef8', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>Estamos teniendo un problema</h1>
            <p style={{ color: '#9aa8c2', marginBottom: 20 }}>Inténtalo de nuevo en unos segundos.</p>
            <button
              type="button"
              onClick={reset}
              style={{ background: '#e9eef8', color: '#060b16', border: 0, padding: '12px 22px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
