// Textos de ayuda del panel: qué hace cada sección y cómo usarla, en lenguaje simple.

export interface Guide {
  /** Qué es esta sección y qué se ve en el sitio. */
  what: string;
  /** Pasos cortos para usarla. */
  steps: string[];
  /** Texto del botón para crear ("Agregar comerciante"). */
  newLabel?: string;
  /** Dónde se ve en el sitio público. */
  where?: string;
}

export const GUIDES: Record<string, Guide> = {
  slides: {
    what: 'Son las pantallas grandes que cambian solas en la portada del sitio.',
    steps: ['Pulsa "Editar" para cambiar el título, el texto o el botón de una pantalla.', 'Cambia el número de "Orden" para decidir cuál sale primero.', 'Quita la palomita de "Visible" para ocultarla sin borrarla.'],
    newLabel: 'Agregar pantalla',
    where: 'Portada del sitio',
  },
  indicadores: {
    what: 'Son las 3 tarjetas con números grandes (por ejemplo "32 estados").',
    steps: ['Pulsa "Editar" para cambiar el número o el texto.', 'Usa números o palabras cortas: se ven mejor.'],
    newLabel: 'Agregar indicador',
    where: 'Sección de indicadores del inicio',
  },
  comunicados: {
    what: 'Avisos oficiales para tus clientes: cambios de horario, días sin servicio, promociones.',
    steps: ['Pulsa "Publicar comunicado" y escribe el título y el texto.', 'Se publica al guardar, con la fecha que elijas.', 'Para quitarlo del sitio, edítalo y quita la palomita de "Visible".'],
    newLabel: 'Publicar comunicado',
    where: 'Sección Comunicados',
  },
  servicios: {
    what: 'Tus 4 servicios de envío y su estado. Aquí avisas si uno está activo, limitado o en pausa.',
    steps: ['Pulsa "Editar" en el servicio que quieras cambiar.', 'En "Estado" elige Activo, Limitado o Pausado.', 'En "Nota del estado" escribe el motivo, por ejemplo "Sin servicio por feriado".'],
    newLabel: 'Agregar servicio',
    where: 'Servicios y Estado operativo',
  },
  recolecciones: {
    what: 'La recolección semanal (viernes de 10:00 a 16:00) se calcula sola. Aquí solo agregas excepciones.',
    steps: ['Para un día extra, pulsa "Agregar excepción" y elige la fecha y el horario.', 'Para cancelar un viernes, agrega esa fecha y quita la palomita de "Visible".', 'Para cambiar el día u horario de siempre, ve a Ajustes del sitio.'],
    newLabel: 'Agregar excepción',
    where: 'Estado operativo (próximas recolecciones)',
  },
  tarifas: {
    what: 'El tabulador de precios. El cotizador del sitio usa estas filas para calcular el precio de cada envío.',
    steps: ['Cada fila es un rango de peso para un servicio, paquetería y destino.', 'Pulsa "Agregar tarifa" para una fila, o "Importar desde Excel" para cargar muchas de golpe.', 'Para cambiar un precio, pulsa "Editar" en la fila.'],
    newLabel: 'Agregar tarifa',
    where: 'Cotizador y página Cotizar',
  },
  comerciantes: {
    what: 'El directorio de comerciantes. Aquí decides el estatus de cada uno y quiénes entran al Top 9 del mes.',
    steps: ['Pulsa "Agregar comerciante" y llena nombre, categoría y estatus.', 'Estatus: Activo, Inactivo, Renovación pendiente o Riesgo.', 'Para el Top 9, edita al comerciante y elige su posición del 1 al 9. Cámbialos cada mes.', 'Quita la palomita de "Público" para ocultarlo del sitio sin borrarlo.'],
    newLabel: 'Agregar comerciante',
    where: 'Comerciantes y Top 9',
  },
  mensajes: {
    what: 'Tu espacio personal: un mensaje con foto para tus clientes (trabajo, eventos, equipo).',
    steps: ['Pulsa "Publicar mensaje", escribe el título y el texto y sube una foto.', 'En el sitio se muestra el más reciente. Cuando publiques uno nuevo, reemplaza al anterior.', 'Los mensajes anteriores se quedan guardados aquí.'],
    newLabel: 'Publicar mensaje',
    where: 'Sección "Un mensaje para ti"',
  },
  solicitudes: {
    what: 'Personas que llenaron el formulario del sitio para unirse o pedir información.',
    steps: ['Pulsa "Abrir" para ver los datos de la persona.', 'Usa "Responder por WhatsApp" para escribirle directo.', 'Cambia el estado a Contactado o Cerrado para llevar el control.'],
  },
};

/** Ayuda breve bajo los campos que no la traen definida. */
export const FIELD_HELP: Record<string, string> = {
  is_active: 'Si la quitas, deja de verse en el sitio, pero no se borra.',
  is_public: 'Si la quitas, no aparece en el sitio, pero no se borra.',
  sort_order: 'Número para ordenar: el más pequeño sale primero.',
  title: 'Escríbelo corto y claro; es lo primero que se ve.',
  name: 'Tal como quieres que se vea en el sitio.',
  category: 'Ej.: Ropa, Calzado, Belleza. Sirve para buscar por categoría.',
  status: 'Define cómo se muestra en el sitio.',
  top_rank: 'Del 1 al 9 para el Top 9 del mes. Déjalo vacío si no entra.',
  top_note: 'Frase corta que se ve en la tarjeta del Top 9. Ej.: "Más pedidos del mes".',
  whatsapp: 'Solo los 10 dígitos, sin espacios. Ej.: 6461031926.',
  facebook_url: 'Enlace completo que empiece con https://',
  photo_id: 'Foto o logo. Se ajusta sola al tamaño correcto.',
  price: 'En pesos mexicanos. Si es por kilo, se multiplica por los kilos.',
  price_type: '"Precio fijo" cobra lo mismo en todo el rango; "Por kilo" multiplica por el peso.',
  weight_from: 'Peso mínimo de este rango, en kilos.',
  weight_to: 'Peso máximo de este rango, en kilos.',
  destination: 'Estado o zona. Déjalo vacío si aplica a todo México.',
  carrier: 'Paquetería a la que aplica esta tarifa.',
  body: 'El texto completo. Puedes escribir varios párrafos.',
  note: 'Dato extra opcional que se muestra junto al registro.',
};

export const NEW_PREFIX: Record<string, string> = {};
