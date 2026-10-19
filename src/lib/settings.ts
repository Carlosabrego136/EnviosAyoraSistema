export type SettingType = 'text' | 'textarea' | 'phone' | 'email' | 'timezone' | 'url' | 'time' | 'weekday';

export interface SettingDef {
  key: string;
  label: string;
  group: string;
  type: SettingType;
  max: number;
  help?: string;
  default: string;
}

export const WEEKDAY_OPTIONS = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
];

const PRIVACY_DEFAULT = `Responsable del tratamiento de tus datos
Envíos Ayora (en adelante, "Envíos Ayora"), con domicilio en Tijuana, Baja California, es responsable de recabar, usar y proteger tus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.

Datos que recabamos
Nombre, nombre del negocio, teléfono o WhatsApp, correo electrónico, destino y referencias de entrega, y el mensaje que nos envíes mediante los formularios del sitio o por WhatsApp.

Finalidades
Atender tu solicitud, cotizar y coordinar la recolección y el envío de tu mercancía, darte de alta en la comunidad, enviarte avisos operativos (recolecciones y comunicados) y dar seguimiento a tus envíos.

Directorio de comerciantes
El directorio muestra únicamente los datos que cada comerciante autoriza hacer públicos (nombre comercial, categoría, zona y medios de contacto). Si eres comerciante y deseas corregir o retirar tu información, escríbenos por WhatsApp.

Transferencias
No vendemos ni compartimos tus datos con terceros, salvo con las paqueterías y aerolíneas estrictamente necesarias para realizar tus envíos o cuando la ley lo exija.

Derechos ARCO
Puedes acceder, rectificar o cancelar tus datos, u oponerte a su uso, escribiéndonos por WhatsApp o al correo de contacto publicado en este sitio.

Cambios al aviso
Cualquier cambio se publicará en esta página.`;

const TERMS_DEFAULT = `Aceptación
Al usar este sitio y los servicios de Envíos Ayora aceptas estos términos y condiciones.

Servicios
Envíos Ayora coordina la recolección y el envío de mercancía mediante servicio aéreo, terrestre, Bajapack (solo Baja California) y envíos de gran volumen en tarimas. Los envíos se realizan a través de las paqueterías indicadas en cada servicio y están sujetos a sus políticas de tránsito. Los tiempos de entrega pueden variar por clima, temporada alta, contingencias o decisiones de la paquetería.

Recolección
La recolección se realiza en los días y horarios publicados en este sitio. Para cualquier cambio, coordina con nuestro equipo por WhatsApp.

Verificación de vendedores
Te recomendamos consultar el estatus del comerciante en el directorio antes de realizar cualquier pago. Envíos Ayora no es parte de las transacciones entre compradores y vendedores.

Mercancía y artículos prohibidos
El remitente es responsable de declarar el contenido de forma veraz y de empacar adecuadamente. No se permite el envío de sustancias inflamables, materiales peligrosos, dinero en efectivo ni artículos regulados por la ley mexicana de transporte o por las paqueterías.

Tarifas y pagos
Las tarifas se confirman antes de realizar el envío. Toda cotización está sujeta a peso, volumen, destino y modalidad.

Responsabilidad
La responsabilidad de Envíos Ayora se limita a lo establecido en la guía de envío y en las políticas de la paquetería que preste el servicio. Recomendamos asegurar la mercancía de alto valor.

Modificaciones
Envíos Ayora puede actualizar estos términos en cualquier momento; la versión vigente es la publicada en este sitio.`;

const STEPS_DEFAULT = `Compra directa|Realiza tu compra con cualquier bazar o vendedor independiente. Avísale que tu recolector es Envíos Ayora y muéstrale tu imagen de servicio o tu código.
Consolidación (hasta 5 semanas)|Recibimos y resguardamos tus productos. Puedes acumular tus compras de varios bazares hasta por 5 semanas continuas, o pedir tu envío antes si lo prefieres.
Cotiza y envía|Cotizamos tu caja según peso, destino y paquetería. Cuando confirmas y pagas, tu envío sale en el calendario de salidas.`;

const SCHEDULE_DEFAULT = `Pago en domingo|Salida: lunes
Pago en lunes|Salida: martes
Pago en martes|Salida: miércoles
Pago en miércoles|Salida: jueves`;

export const SETTING_DEFS: SettingDef[] = [
  // ── Marca
  { key: 'brand_name', label: 'Nombre del negocio', group: 'Marca', type: 'text', max: 60, default: 'Envíos Ayora' },
  { key: 'brand_tagline', label: 'Eslogan corto', group: 'Marca', type: 'text', max: 80, default: 'Fénix Recolección y Envíos' },
  {
    key: 'brand_legal',
    label: 'Nombre comercial / razón social',
    group: 'Marca',
    type: 'text',
    max: 120,
    help: 'Aparece en el pie de página y en los avisos legales.',
    default: 'Envíos Ayora',
  },
  { key: 'footer_quote', label: 'Frase del pie de página', group: 'Marca', type: 'text', max: 160, default: 'Confianza en cada compra y envío.' },
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
  { key: 'whatsapp_greeting', label: 'Mensaje inicial de WhatsApp', group: 'Contacto', type: 'text', max: 200, default: 'Hola Envíos Ayora, me gustaría información sobre sus servicios de envío.' },
  { key: 'contact_email', label: 'Correo de contacto', group: 'Contacto', type: 'email', max: 120, help: 'Opcional. Se muestra en el pie de página.', default: '' },
  { key: 'address', label: 'Dirección de las instalaciones', group: 'Contacto', type: 'textarea', max: 300, help: 'Opcional. Se muestra junto al calendario de recolecciones.', default: '' },
  { key: 'location_badge', label: 'Etiqueta de ubicación (portada)', group: 'Contacto', type: 'text', max: 80, help: 'Frase corta que se ve arriba del título de la portada.', default: 'Tijuana y Ensenada, B.C.' },
  { key: 'tijuana_address', label: 'Sede Tijuana · dirección', group: 'Contacto', type: 'text', max: 160, default: 'Blvd. Gustavo Díaz Ordaz 14610, Col. Gas y Anexas, 22115 Tijuana, B.C.' },
  { key: 'tijuana_map_url', label: 'Sede Tijuana · enlace de Google Maps', group: 'Contacto', type: 'url', max: 300, help: 'Debe empezar con https://', default: 'https://www.google.com/maps/search/?api=1&query=Blvd.+Gustavo+D%C3%ADaz+Ordaz+14610+Col.+Gas+y+Anexas+22115+Tijuana+B.C.' },
  { key: 'ensenada_address', label: 'Sede Ensenada · dirección', group: 'Contacto', type: 'text', max: 160, help: 'Calle, colonia y ciudad.', default: 'Zaragoza 739, Col. Bustamante, Ensenada, B.C.' },
  { key: 'ensenada_map_url', label: 'Sede Ensenada · enlace de Google Maps', group: 'Contacto', type: 'url', max: 300, help: 'Debe empezar con https://', default: 'https://www.google.com/maps/search/Envios+Ayora/@31.8686258,-116.5987051,17z' },
  { key: 'timezone', label: 'Zona horaria', group: 'Contacto', type: 'timezone', max: 60, help: 'Se usa para el reloj y el calendario. Ejemplo: America/Tijuana', default: 'America/Tijuana' },
  // ── Recolección
  { key: 'pickup_weekday', label: 'Día de recolección', group: 'Recolección semanal', type: 'weekday', max: 1, help: 'El sitio calcula solo las próximas fechas. Para cancelar un día o cambiar el horario de una fecha, usa "Recolecciones (excepciones)".', default: '5' },
  { key: 'pickup_start', label: 'Hora de inicio', group: 'Recolección semanal', type: 'time', max: 5, default: '10:00' },
  { key: 'pickup_end', label: 'Hora de fin', group: 'Recolección semanal', type: 'time', max: 5, default: '16:00' },
  { key: 'pickup_note', label: 'Nota de la recolección', group: 'Recolección semanal', type: 'text', max: 80, default: 'Recolección general' },
  // ── Enlaces y redes
  { key: 'whatsapp_group_url', label: 'Grupo de WhatsApp (La Ruta del Saldo)', group: 'Enlaces y redes', type: 'url', max: 200, help: 'Enlace de invitación al grupo. Debe empezar con https://', default: 'https://chat.whatsapp.com/GrOSxcjNg4yBYprj2VIhW0' },
  { key: 'facebook_url', label: 'Facebook', group: 'Enlaces y redes', type: 'url', max: 200, default: 'https://www.facebook.com/share/18KJCwsqrK/' },
  { key: 'tiktok_url', label: 'TikTok', group: 'Enlaces y redes', type: 'url', max: 200, help: 'Si lo dejas vacío, el botón de TikTok no se muestra.', default: 'https://www.tiktok.com/@rafaelayorafany' },
  { key: 'tracking_url', label: 'Sitio de rastreo de envíos (opcional)', group: 'Enlaces y redes', type: 'url', max: 200, help: 'Si lo llenas, aparece un botón para consultar tu sistema de rastreo.', default: '' },
  // ── Cotizador
  { key: 'quote_note', label: 'Aviso bajo el cotizador', group: 'Cotizador', type: 'textarea', max: 300, default: 'Precio estimado. El costo final se confirma antes de realizar el envío. La paquetería se asigna según disponibilidad del destino.' },
  { key: 'extended_zone_fee', label: 'Cargo por zona extendida (pesos)', group: 'Cotizador', type: 'text', max: 6, help: 'Solo números. Se suma cuando el destino es zona extendida.', default: '285' },
  { key: 'extended_zone_url', label: 'Enlace para consultar zona extendida', group: 'Cotizador', type: 'url', max: 200, default: 'https://www.zonaextendida.com' },
  { key: 'volume_policy', label: 'Política de tarifas y dimensiones', group: 'Cotizador', type: 'textarea', max: 500, default: 'El importe aplicable a cada envío se calcula tomando como referencia el mayor valor entre el peso real de la carga y su volumen (calculado mediante sus dimensiones). Esto nos permite optimizar la capacidad de nuestras unidades y garantizar un manejo seguro de su mercancía.' },
  // ── La Ruta del Saldo
  { key: 'route_title', label: 'Título', group: 'La Ruta del Saldo', type: 'text', max: 80, default: 'La Ruta del Saldo Ensenada–Tijuana' },
  {
    key: 'route_text',
    label: 'Descripción',
    group: 'La Ruta del Saldo',
    type: 'textarea',
    max: 600,
    default:
      'Compramos, recolectamos y enviamos. Entregamos personalmente en Ensenada, Tijuana y Rosarito, y si eres foráneo te enviamos a cualquier ubicación de la República Mexicana. Agrégate a nuestro grupo de WhatsApp y síguenos en redes.',
  },
  // ── Espacio personal y nosotros
  { key: 'owner_names', label: 'Nombres de quienes dan la cara', group: 'Espacio personal', type: 'text', max: 80, default: 'Fany Ayora y Rafael Ayora' },
  { key: 'owner_role', label: 'Frase bajo los nombres', group: 'Espacio personal', type: 'text', max: 80, default: 'Tus recolectores de confianza' },
  {
    key: 'mission_text',
    label: 'Misión',
    group: 'Espacio personal',
    type: 'textarea',
    max: 500,
    default:
      'Brindar un servicio de recolección, transporte y entrega de paquetes eficiente y seguro, ofreciendo a nuestros clientes una experiencia logística cercana y confiable que acorte distancias y facilite sus operaciones comerciales en Tijuana y todo México.',
  },
  {
    key: 'vision_text',
    label: 'Visión',
    group: 'Espacio personal',
    type: 'textarea',
    max: 500,
    default:
      'Ser el aliado de confianza de los comerciantes y compradores de Baja California, creciendo con un servicio cercano, transparente y puntual.',
  },
  // ── Cómo funciona y calendario
  {
    key: 'how_steps',
    label: 'Pasos de "¿Cómo funciona?"',
    group: '¿Cómo funciona?',
    type: 'textarea',
    max: 1200,
    help: 'Un paso por línea con este formato: Título|Texto',
    default: STEPS_DEFAULT,
  },
  { key: 'schedule_title', label: 'Calendario · título', group: 'Calendario de pagos y salidas', type: 'text', max: 80, default: 'Calendario de pagos y salida de cajas' },
  { key: 'schedule_intro', label: 'Calendario · introducción', group: 'Calendario de pagos y salidas', type: 'textarea', max: 400, default: 'Para coordinar el despacho puntual de tu caja a cualquier parte de la República Mexicana, el flujo semanal opera así. Es un proceso interno de pagos y salidas: no es el horario de atención a clientes ni a vendedores.' },
  { key: 'schedule_note', label: 'Calendario · nota final', group: 'Calendario de pagos y salidas', type: 'text', max: 120, help: 'Opcional. Se muestra debajo de las filas.', default: 'Los viernes no hay salida de envíos.' },
  {
    key: 'schedule_rows',
    label: 'Calendario · filas',
    group: 'Calendario de pagos y salidas',
    type: 'textarea',
    max: 800,
    help: 'Una fila por línea: Pago en domingo|Salida: lunes. Déjalo vacío para ocultar el calendario.',
    default: SCHEDULE_DEFAULT,
  },
  // ── Top 9
  { key: 'top9_label', label: 'Etiqueta del Top 9', group: 'Top 9 de vendedores', type: 'text', max: 40, help: 'Déjalo vacío y el sitio mostrará el mes actual (ej. "Octubre 2026"). Las posiciones se asignan en Comerciantes.', default: '' },
  // ── Sección comunidad
  { key: 'community_eyebrow', label: 'Comunidad · etiqueta', group: 'Sección comunidad', type: 'text', max: 60, default: 'Comunidad Envíos Ayora' },
  { key: 'community_title', label: 'Comunidad · título', group: 'Sección comunidad', type: 'text', max: 120, default: 'Compra, recolectamos y enviamos' },
  {
    key: 'community_text',
    label: 'Comunidad · texto',
    group: 'Sección comunidad',
    type: 'textarea',
    max: 400,
    default: 'Regístrate y recibe avisos oficiales, el calendario de recolecciones y atención directa de nuestro equipo. Si eres comerciante, súmate al directorio.',
  },
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

/** Líneas "A|B" de un ajuste de texto → pares. Ignora líneas vacías o sin separador. */
export function pairLines(value: string | undefined): [string, string][] {
  return (value ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf('|');
      return i < 0 ? ([l, ''] as [string, string]) : ([l.slice(0, i).trim(), l.slice(i + 1).trim()] as [string, string]);
    });
}

/** Enlace https válido o cadena vacía (para botones opcionales). */
export function safeUrl(value: string | undefined): string {
  if (!value) return '';
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.toString() : '';
  } catch {
    return '';
  }
}
