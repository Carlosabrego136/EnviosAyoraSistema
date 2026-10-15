// Paqueterías y sus páginas oficiales de rastreo (sin dependencias de servidor).

export interface Carrier {
  key: string;
  name: string;
  /** Plantilla con {g} = número de guía. Si es null, la página oficial no acepta la guía en el enlace. */
  url: string | null;
  /** Página general de rastreo cuando no se puede precargar la guía. */
  home: string;
  /** Sin rastreo público: se atiende por WhatsApp. */
  noPublicTracking?: boolean;
  hint: string;
}

export const CARRIERS: Carrier[] = [
  { key: 'fedex', name: 'FedEx', url: 'https://www.fedex.com/fedextrack/?trknbr={g}', home: 'https://www.fedex.com/fedextrack/', hint: '12 dígitos' },
  { key: 'dhl', name: 'DHL', url: 'https://www.dhl.com/mx-es/home/tracking.html?tracking-id={g}', home: 'https://www.dhl.com/mx-es/home/tracking.html', hint: '10 dígitos' },
  { key: 'paquetexpress', name: 'Paquete Express', url: 'https://www.paquetexpress.com.mx/rastreo/{g}', home: 'https://www.paquetexpress.com.mx/rastreo', hint: 'Número de guía' },
  { key: 'estafeta', name: 'Estafeta', url: null, home: 'https://www.estafeta.com/rastrear-envio', hint: '10 o 22 dígitos' },
  { key: 'bajapack', name: 'Baja Pack Express', url: null, home: 'https://www.bajapack.com/rastrear/', hint: 'Número de guía' },
  { key: 'volaris', name: 'Volaris Cargo', url: null, home: '', noPublicTracking: true, hint: 'Número de guía aérea' },
];

export const GUIDE_PATTERN = /^[A-Za-z0-9-]{6,40}$/;
