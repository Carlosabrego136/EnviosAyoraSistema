'use client';

import { useEffect, useState } from 'react';

/** Reloj en la zona horaria del negocio. Se renderiza tras montar para evitar diferencias de hidratación. */
export function LiveClock({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = () => {
      try {
        setTime(
          new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone })
            .format(new Date())
            .replace(/\s?([ap])\.?\s?m\.?/i, (_m, p: string) => ` ${p.toUpperCase()}.M.`),
        );
      } catch {
        setTime(null);
      }
    };
    format();
    const id = window.setInterval(format, 15_000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  return (
    <span className="clock" aria-label={time ? `Hora local ${time}` : 'Hora local'}>
      <span className="clock__dot" aria-hidden="true" />
      <span className="clock__time">{time ?? '--:--'}</span>
    </span>
  );
}
