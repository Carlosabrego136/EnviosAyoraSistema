export type SettingType = 'text' | 'textarea' | 'phone' | 'email' | 'timezone';

export interface SettingDef {
  key: string;
  label: string;
  group: string;
  type: SettingType;
  max: number;
  help?: string;
  default: string;
}

const PRIVACY_DEFAULT = `Responsable del tratamiento de tus datos
Fénix · Recolección y Envíos (en adelante, "Fénix") es responsable de recabar, usar y proteger tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.

Datos que recabamos
Nombre, nombre del negocio, teléfono, correo electrónico y el mensaje que nos envíes mediante los formularios del sitio o por WhatsApp.

Finalidades
Atender tu solicitud, darte de alta en la comunidad de comerciantes, enviarte avisos operativos (recolecciones, estado de servicios y comunicados) y dar seguimiento a tus envíos.

Transferencias
No vendemos ni compartimos tus datos con terceros, salvo con las paqueterías y aerolíneas estrictamente necesarias para realizar tus envíos o cuando la ley lo exija.

Derechos ARCO
Puedes acceder, rectificar o cancelar tus datos, u oponerte a su uso, escribiéndonos por WhatsApp o al correo de contacto publicado en este sitio.

Cambios al aviso
Cualquier cambio se publicará en esta página.`;

const TERMS_DEFAULT = `Aceptación
Al usar este sitio y los servicios de Fénix aceptas estos términos y condiciones.

Servicios
Fénix coordina la recolección y el envío de mercancía mediante servicios aéreos, terrestres y de paquetería nacional. Los tiempos de entrega publicados son estimados en días hábiles y pueden variar por clima, temporada alta, contingencias o decisiones de la paquetería.

Mercancía
El remitente es responsable de declarar el contenido de forma veraz, empacar adecuadamente y no enviar artículos prohibidos o restringidos por la ley o por las paqueterías.

Tarifas y pagos
Las tarifas se confirman antes de realizar el envío. Toda cotización está sujeta a peso, volumen, destino y modalidad.

Responsabilidad
La responsabilidad de Fénix se limita a lo establecido en la guía de envío y en las políticas de la paquetería que preste el servicio. Recomendamos asegurar la mercancía de alto valor.

Modificaciones
Fénix puede actualizar estos términos en cualquier momento; la versión vigente es la publicada en este sitio.`;

export const SETTING_DEFS: SettingDef[] = [
  // ── Marca
  { key: 'brand_name', label: 'Nombre de la marca', group: 'Marca', type: 'text', max: 60, default: 'Fénix' },
  { key: 'brand_tagline', label: 'Eslogan corto', group: 'Marca', type: 'text', max: 80, default: 'Recolección y Envíos' },
  {
    key: 'brand_legal',
    label: 'Nombre comercial / razón social',
    group: 'Marca',
    type: 'text',
    max: 120,
    help: 'Aparece en el pie de página y en los avisos legales.',
    default: 'Envíos Ayora',
  },
  // ── Contacto
  {
    key: 'whatsapp_number',
    label: 'WhatsApp (solo números, con lada)',
    group: 'Contacto',
    type: 'phone',
    max: 20,
    help: 'Ejemplo: 5216461031926. Es el número al que llegan los mensajes del sitio.',
    default: '5216461031926',
  },
  { key: 'whatsapp_display', label: 'WhatsApp (cómo se muestra)', group: 'Contacto', type: 'text', max: 30, default: '+52 646 103 1926' },
  { key: 'whatsapp_greeting', label: 'Mensaje inicial de WhatsApp', group: 'Contacto', type: 'text', max: 200, default: 'Hola Fénix, me gustaría información sobre sus servicios de envío.' },
  { key: 'contact_email', label: 'Correo de contacto', group: 'Contacto', type: 'email', max: 120, help: 'Opcional. Se muestra en el pie de página.', default: '' },
  { key: 'address', label: 'Dirección de las instalaciones', group: 'Contacto', type: 'textarea', max: 300, help: 'Opcional. Se muestra junto al calendario de recolecciones.', default: '' },
  { key: 'timezone', label: 'Zona horaria', group: 'Contacto', type: 'timezone', max: 60, help: 'Se usa para el reloj y el calendario. Ejemplo: America/Tijuana', default: 'America/Tijuana' },
  // ── Secciones
  { key: 'community_eyebrow', label: 'Comunidad · etiqueta', group: 'Sección comunidad', type: 'text', max: 60, default: 'Comunidad Fénix' },
  { key: 'community_title', label: 'Comunidad · título', group: 'Sección comunidad', type: 'text', max: 120, default: 'Más que envíos, un equipo que responde' },
  {
    key: 'community_text',
    label: 'Comunidad · texto',
    group: 'Sección comunidad',
    type: 'textarea',
    max: 400,
    default: 'Regístrate como comerciante y recibe avisos oficiales, el calendario de recolecciones y el estado de cada servicio, directo de nuestro equipo.',
  },
  { key: 'footer_quote', label: 'Frase del pie de página', group: 'Pie de página', type: 'text', max: 160, default: 'Tu mercancía, con un equipo que responde.' },
  // ── Legal
  { key: 'privacy_text', label: 'Aviso de privacidad', group: 'Legal', type: 'textarea', max: 8000, help: 'Plantilla base: revísala con un profesional legal. Usa una línea en blanco entre párrafos; una línea corta sin punto final se muestra como subtítulo.', default: PRIVACY_DEFAULT },
  { key: 'terms_text', label: 'Términos y condiciones', group: 'Legal', type: 'textarea', max: 8000, help: 'Plantilla base: revísala con un profesional legal.', default: TERMS_DEFAULT },
];

export const SETTING_KEYS = new Set(SETTING_DEFS.map((d) => d.key));

export type SettingsMap = Record<string, string>;

export function defaultSettings(): SettingsMap {
  return Object.fromEntries(SETTING_DEFS.map((d) => [d.key, d.default]));
}

/** Zona horaria válida (IANA) o la predeterminada. */
export function safeTimezone(tz: string | undefined): string {
  if (!tz) return 'America/Tijuana';
  try {
    new Intl.DateTimeFormat('es-MX', { timeZone: tz });
    return tz;
  } catch {
    return 'America/Tijuana';
  }
}

export function whatsappLink(settings: SettingsMap, text?: string): string {
  const digits = (settings.whatsapp_number ?? '').replace(/\D/g, '');
  const message = text ?? settings.whatsapp_greeting ?? '';
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
