// Definición declarativa de los módulos de contenido editables desde el panel.
// Todo nombre de tabla/columna usado en SQL sale de esta lista blanca (nunca del usuario).
import { isSafeHref } from './security';

export type FieldType = 'text' | 'textarea' | 'number' | 'decimal' | 'checkbox' | 'date' | 'time' | 'select' | 'url' | 'image';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  min?: number;
  options?: { value: string; label: string }[];
  help?: string;
  placeholder?: string;
  /** Valor inicial al crear. 'today' = fecha de hoy. */
  default?: string | number | boolean;
  /** Se edita al crear pero se muestra solo-lectura al editar. */
  readOnlyOnEdit?: boolean;
  /** Solo se muestra (no se guarda) en el formulario de edición. */
  displayOnly?: boolean;
  wide?: boolean;
  /** Solo 'decimal': cantidad de decimales permitidos (por defecto 2). */
  step?: number;
}

export interface ColumnDef {
  name: string;
  label: string;
  kind?: 'text' | 'bool' | 'date' | 'time' | 'badge' | 'datetime' | 'money' | 'kg';
}

export type PermissionKey = 'content' | 'leads';

export interface ResourceDef {
  key: string;
  table: string;
  permission: PermissionKey;
  singular: string;
  plural: string;
  description: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  orderBy: string;
  canCreate: boolean;
  canDelete: boolean;
  /** Texto principal de un registro para listados, avisos y bitácora. */
  titleOf: (row: Record<string, unknown>) => string;
  /** Validaciones entre campos; devuelve errores por campo. Puede normalizar valores en el mismo objeto. */
  validate?: (values: Record<string, unknown>) => Record<string, string>;
  /** Columnas donde busca el cuadro de búsqueda del listado. */
  searchColumns?: string[];
  /** Máximo de filas por listado (por defecto 200). */
  listLimit?: number;
  /** Error de campo cuando el guardado choca con un índice único (p. ej. posición del Top 9). */
  conflictField?: { name: string; message: string };
}

const s = (v: unknown) => (v == null ? '' : String(v));

export const RESOURCES: Record<string, ResourceDef> = {
  slides: {
    key: 'slides',
    table: 'slides',
    permission: 'content',
    singular: 'slide',
    plural: 'Carrusel principal',
    description: 'Los mensajes que rotan en la portada del sitio.',
    orderBy: 'sort_order ASC, id ASC',
    canCreate: true,
    canDelete: true,
    titleOf: (r) => s(r.title),
    columns: [
      { name: 'sort_order', label: 'Orden' },
      { name: 'title', label: 'Título' },
      { name: 'cta_label', label: 'Botón' },
      { name: 'is_active', label: 'Visible', kind: 'bool' },
    ],
    fields: [
      { name: 'eyebrow', label: 'Etiqueta superior', type: 'text', max: 60, placeholder: 'Cobertura nacional' },
      { name: 'title', label: 'Título', type: 'text', required: true, max: 80, wide: true },
      { name: 'subtitle', label: 'Subtítulo', type: 'text', max: 100, wide: true },
      { name: 'body', label: 'Texto', type: 'textarea', max: 300, wide: true },
      { name: 'cta_label', label: 'Texto del botón', type: 'text', max: 40, placeholder: 'Ver servicios' },
      {
        name: 'cta_href',
        label: 'Destino del botón',
        type: 'text',
        max: 200,
        placeholder: '#servicios',
        help: 'Usa #servicios, #comunidad, una ruta (/comunicados), un enlace https:// o la palabra whatsapp.',
      },
      { name: 'sort_order', label: 'Orden', type: 'number', min: 0, max: 999, default: 10 },
      { name: 'is_active', label: 'Visible en el sitio', type: 'checkbox', default: true },
    ],
    validate: (v) => {
      const errors: Record<string, string> = {};
      if (!isSafeHref(s(v.cta_href))) errors.cta_href = 'Enlace no permitido. Usa #ancla, /ruta, https:// o whatsapp.';
      if (s(v.cta_label) && !s(v.cta_href)) errors.cta_href = 'Indica a dónde lleva el botón.';
      return errors;
    },
  },

  indicadores: {
    key: 'indicadores',
    table: 'stats',
    permission: 'content',
    singular: 'indicador',
    plural: 'Indicadores',
    description: 'Las cifras destacadas debajo del carrusel. Muestra solo datos reales y verificables.',
    orderBy: 'sort_order ASC, id ASC',
    canCreate: true,
    canDelete: true,
    titleOf: (r) => `${s(r.value)} · ${s(r.label)}`,
    columns: [
      { name: 'sort_order', label: 'Orden' },
      { name: 'value', label: 'Cifra' },
      { name: 'label', label: 'Etiqueta' },
      { name: 'is_active', label: 'Visible', kind: 'bool' },
    ],
    fields: [
      { name: 'value', label: 'Cifra', type: 'text', required: true, max: 12, placeholder: '32' },
      { name: 'label', label: 'Etiqueta', type: 'text', required: true, max: 50, placeholder: 'Entidades con cobertura' },
      { name: 'caption', label: 'Texto de apoyo', type: 'text', max: 60, wide: true },
      { name: 'sort_order', label: 'Orden', type: 'number', min: 0, max: 999, default: 10 },
      { name: 'is_active', label: 'Visible en el sitio', type: 'checkbox', default: true },
    ],
  },

  comunicados: {
    key: 'comunicados',
    table: 'announcements',
    permission: 'content',
    singular: 'comunicado',
    plural: 'Comunicados',
    description: 'Avisos oficiales para tu comunidad. Se muestran del más reciente al más antiguo.',
    orderBy: 'published_on DESC, id DESC',
    canCreate: true,
    canDelete: true,
    titleOf: (r) => s(r.title),
    columns: [
      { name: 'published_on', label: 'Fecha', kind: 'date' },
      { name: 'category', label: 'Categoría', kind: 'badge' },
      { name: 'title', label: 'Título' },
      { name: 'is_active', label: 'Visible', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, max: 120, wide: true },
      { name: 'category', label: 'Categoría', type: 'text', required: true, max: 40, default: 'Avisos', placeholder: 'Operaciones, Avisos…' },
      { name: 'published_on', label: 'Fecha de publicación', type: 'date', required: true, default: 'today' },
      { name: 'body', label: 'Mensaje', type: 'textarea', required: true, max: 3000, wide: true },
      { name: 'is_active', label: 'Visible en el sitio', type: 'checkbox', default: true },
    ],
  },

  servicios: {
    key: 'servicios',
    table: 'services',
    permission: 'content',
    singular: 'servicio',
    plural: 'Servicios y estado',
    description: 'Servicios que ofreces y su estado operativo actual (activo, limitado o pausado).',
    orderBy: 'sort_order ASC, id ASC',
    canCreate: true,
    canDelete: true,
    titleOf: (r) => s(r.name),
    columns: [
      { name: 'sort_order', label: 'Orden' },
      { name: 'name', label: 'Servicio' },
      { name: 'carriers', label: 'Paqueterías' },
      { name: 'status', label: 'Estado', kind: 'badge' },
      { name: 'is_active', label: 'Visible', kind: 'bool' },
    ],
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true, max: 60, wide: true },
      { name: 'description', label: 'Descripción', type: 'textarea', max: 240, wide: true },
      {
        name: 'slug',
        label: 'Tipo de servicio (para el cotizador)',
        type: 'select',
        default: '',
        options: [
          { value: '', label: 'Ninguno (solo informativo)' },
          { value: 'aereo', label: 'Aéreo' },
          { value: 'terrestre', label: 'Terrestre' },
          { value: 'bajapack', label: 'Bajapack' },
          { value: 'tarimas', label: 'Gran volumen · Tarimas' },
        ],
        help: 'Enlaza este servicio con las tarifas del tabulador.',
      },
      { name: 'carriers', label: 'Paqueterías', type: 'text', max: 120, placeholder: 'FedEx, DHL, Estafeta', help: 'Separadas por coma. Se muestran como etiquetas.', wide: true },
      { name: 'coverage', label: 'Cobertura', type: 'text', max: 60, placeholder: 'Todo México' },
      { name: 'eta_text', label: 'Tiempo estimado (opcional)', type: 'text', max: 60, placeholder: '1 a 3 días hábiles' },
      {
        name: 'icon',
        label: 'Ícono',
        type: 'select',
        required: true,
        default: 'box',
        options: [
          { value: 'plane', label: 'Avión' },
          { value: 'truck', label: 'Camión' },
          { value: 'box', label: 'Paquete' },
          { value: 'mail', label: 'Correo' },
          { value: 'pin', label: 'Ubicación' },
          { value: 'shield', label: 'Escudo' },
          { value: 'pallet', label: 'Tarimas' },
        ],
      },
      {
        name: 'status',
        label: 'Estado operativo',
        type: 'select',
        required: true,
        default: 'active',
        options: [
          { value: 'active', label: 'Activo' },
          { value: 'limited', label: 'Servicio limitado' },
          { value: 'paused', label: 'Pausado' },
        ],
      },
      { name: 'status_note', label: 'Nota del estado', type: 'text', max: 120, wide: true, help: 'Ej.: "Retrasos por temporada alta". Se muestra junto al estado.' },
      { name: 'sort_order', label: 'Orden', type: 'number', min: 0, max: 999, default: 10 },
      { name: 'is_active', label: 'Visible en el sitio', type: 'checkbox', default: true },
    ],
  },

  recolecciones: {
    key: 'recolecciones',
    table: 'pickups',
    permission: 'content',
    singular: 'recolección',
    plural: 'Recolecciones (excepciones)',
    description:
      'El día y horario fijo se define en Ajustes del sitio y el sitio calcula solo las próximas fechas. Aquí solo registras excepciones: un horario distinto, un día extra, o desmarca "Visible" para cancelar una fecha.',
    orderBy: 'pickup_date DESC, start_time ASC',
    canCreate: true,
    canDelete: true,
    titleOf: (r) => `${s(r.pickup_date)} ${s(r.start_time).slice(0, 5)}–${s(r.end_time).slice(0, 5)}`,
    columns: [
      { name: 'pickup_date', label: 'Fecha', kind: 'date' },
      { name: 'start_time', label: 'Inicio', kind: 'time' },
      { name: 'end_time', label: 'Fin', kind: 'time' },
      { name: 'note', label: 'Nota' },
      { name: 'is_active', label: 'Visible', kind: 'bool' },
    ],
    fields: [
      { name: 'pickup_date', label: 'Fecha', type: 'date', required: true, default: 'today' },
      { name: 'note', label: 'Nota', type: 'text', required: true, max: 80, default: 'Recolección general' },
      { name: 'start_time', label: 'Hora de inicio', type: 'time', required: true, default: '10:00' },
      { name: 'end_time', label: 'Hora de fin', type: 'time', required: true, default: '13:00' },
      { name: 'is_active', label: 'Visible en el sitio', type: 'checkbox', default: true },
    ],
    validate: (v) => {
      const errors: Record<string, string> = {};
      if (s(v.start_time) && s(v.end_time) && s(v.end_time) <= s(v.start_time)) {
        errors.end_time = 'La hora de fin debe ser posterior a la de inicio.';
      }
      return errors;
    },
  },

  tarifas: {
    key: 'tarifas',
    table: 'rates',
    permission: 'content',
    singular: 'tarifa',
    plural: 'Tarifas (cotizador)',
    description:
      'Tabulador de precios que usa el cotizador del sitio. Cada fila es un rango de peso para un servicio, paquetería y destino. También puedes cargar muchas filas de golpe con "Importar".',
    orderBy: 'service_slug, carrier, destination, weight_from, weight_to',
    canCreate: true,
    canDelete: true,
    listLimit: 500,
    searchColumns: ['carrier', 'destination', 'service_slug', 'note'],
    titleOf: (r) => `${s(r.service_slug)} · ${s(r.carrier) || 'general'} · ${s(r.destination) || 'todo destino'} · ${s(r.weight_from)}–${s(r.weight_to)} kg`,
    columns: [
      { name: 'service_slug', label: 'Servicio', kind: 'badge' },
      { name: 'carrier', label: 'Paquetería' },
      { name: 'destination', label: 'Destino' },
      { name: 'weight_from', label: 'Desde', kind: 'kg' },
      { name: 'weight_to', label: 'Hasta', kind: 'kg' },
      { name: 'price', label: 'Precio', kind: 'money' },
      { name: 'is_active', label: 'Visible', kind: 'bool' },
    ],
    fields: [
      {
        name: 'service_slug',
        label: 'Servicio',
        type: 'select',
        required: true,
        default: 'terrestre',
        options: [
          { value: 'aereo', label: 'Aéreo' },
          { value: 'terrestre', label: 'Terrestre' },
          { value: 'bajapack', label: 'Bajapack' },
          { value: 'tarimas', label: 'Gran volumen · Tarimas' },
        ],
      },
      { name: 'carrier', label: 'Paquetería', type: 'text', max: 60, placeholder: 'FedEx', help: 'Déjalo vacío si el precio aplica a cualquier paquetería del servicio.' },
      { name: 'destination', label: 'Destino o zona', type: 'text', max: 80, placeholder: 'Zona 1, Baja California, CDMX…', help: 'Déjalo vacío si el precio aplica a cualquier destino.' },
      { name: 'weight_from', label: 'Peso desde (kg)', type: 'decimal', required: true, min: 0, max: 100000, default: 0 },
      { name: 'weight_to', label: 'Peso hasta (kg)', type: 'decimal', required: true, min: 0.01, max: 100000 },
      { name: 'price', label: 'Precio (MXN)', type: 'decimal', required: true, min: 0, max: 10000000 },
      {
        name: 'price_type',
        label: 'Tipo de precio',
        type: 'select',
        required: true,
        default: 'fixed',
        options: [
          { value: 'fixed', label: 'Precio fijo para el rango de peso' },
          { value: 'per_kg', label: 'Precio por kilo (se multiplica por los kg, redondeado hacia arriba)' },
        ],
        wide: true,
      },
      { name: 'note', label: 'Nota (opcional)', type: 'text', max: 120, wide: true },
      { name: 'sort_order', label: 'Orden', type: 'number', min: 0, max: 9999, default: 0 },
      { name: 'is_active', label: 'Visible en el sitio', type: 'checkbox', default: true },
    ],
    validate: (v) => {
      const errors: Record<string, string> = {};
      if (Number(v.weight_to) < Number(v.weight_from)) errors.weight_to = 'El peso final debe ser mayor o igual al inicial.';
      return errors;
    },
  },

  comerciantes: {
    key: 'comerciantes',
    table: 'merchants',
    permission: 'content',
    singular: 'comerciante',
    plural: 'Comerciantes',
    description:
      'Directorio público de comerciantes con su estatus. Asigna una posición del 1 al 9 para que aparezcan en el Top 9 del mes (cámbialas cada mes). También puedes cargar muchos de golpe con "Importar".',
    orderBy: 'lower(name), id',
    canCreate: true,
    canDelete: true,
    listLimit: 500,
    searchColumns: ['name', 'category', 'zone', 'status'],
    titleOf: (r) => s(r.name),
    columns: [
      { name: 'name', label: 'Comerciante' },
      { name: 'category', label: 'Categoría' },
      { name: 'status', label: 'Estatus', kind: 'badge' },
      { name: 'top_rank', label: 'Top 9' },
      { name: 'is_public', label: 'Público', kind: 'bool' },
    ],
    fields: [
      { name: 'name', label: 'Nombre del comerciante o negocio', type: 'text', required: true, max: 100, wide: true },
      { name: 'category', label: 'Categoría', type: 'text', required: true, max: 50, default: 'General', placeholder: 'Ropa, Calzado, Belleza…', help: 'Usa siempre el mismo nombre para que la búsqueda por categoría los agrupe.' },
      {
        name: 'status',
        label: 'Estatus',
        type: 'select',
        required: true,
        default: 'activo',
        options: [
          { value: 'activo', label: 'Activo' },
          { value: 'inactivo', label: 'Inactivo' },
          { value: 'renovacion', label: 'Renovación pendiente' },
          { value: 'riesgo', label: 'Riesgo' },
        ],
      },
      { name: 'zone', label: 'Zona o ciudad', type: 'text', max: 60, placeholder: 'Tijuana' },
      { name: 'description', label: 'Descripción para su perfil', type: 'textarea', max: 600, wide: true },
      { name: 'whatsapp', label: 'WhatsApp del comerciante', type: 'text', max: 20, help: 'Opcional. Solo números; con 10 dígitos se agrega la lada de México. Se mostrará públicamente: pide su autorización.' },
      { name: 'facebook_url', label: 'Facebook u otra red (enlace)', type: 'url', max: 200, placeholder: 'https://…' },
      { name: 'photo_id', label: 'Foto o logo', type: 'image', wide: true, help: 'Opcional. JPG, PNG o WebP.' },
      { name: 'top_rank', label: 'Posición en el Top 9 del mes', type: 'number', min: 1, max: 9, help: 'Del 1 al 9. Déjalo vacío si no está en el Top 9. Cada posición solo puede tenerla un comerciante.' },
      { name: 'top_note', label: 'Nota en el Top 9', type: 'text', max: 80, placeholder: 'Ej. Más envíos del mes', wide: true },
      { name: 'is_public', label: 'Mostrar en el directorio público', type: 'checkbox', default: true },
    ],
    conflictField: { name: 'top_rank', message: 'Esa posición del Top 9 ya la tiene otro comerciante. Quítasela primero o elige otra.' },
    validate: (v) => {
      const errors: Record<string, string> = {};
      const raw = s(v.whatsapp).replace(/\D/g, '');
      if (raw) {
        const full = raw.length === 10 ? `52${raw}` : raw;
        if (full.length < 11 || full.length > 15) errors.whatsapp = 'Número no válido (10 dígitos o con lada del país).';
        else v.whatsapp = full;
      } else {
        v.whatsapp = '';
      }
      if (s(v.facebook_url) && !/^https:\/\//.test(s(v.facebook_url))) errors.facebook_url = 'El enlace debe empezar con https://';
      return errors;
    },
  },

  mensajes: {
    key: 'mensajes',
    table: 'owner_posts',
    permission: 'content',
    singular: 'mensaje',
    plural: 'Espacio personal',
    description:
      'Tu mensaje con foto de tu trabajo o de un evento con tu equipo. El sitio muestra el más reciente que esté visible; publica uno nuevo cuando quieras actualizarlo.',
    orderBy: 'published_on DESC, id DESC',
    canCreate: true,
    canDelete: true,
    titleOf: (r) => s(r.title),
    columns: [
      { name: 'published_on', label: 'Fecha', kind: 'date' },
      { name: 'title', label: 'Título' },
      { name: 'is_active', label: 'Visible', kind: 'bool' },
    ],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true, max: 100, wide: true },
      { name: 'body', label: 'Mensaje', type: 'textarea', required: true, max: 1500, wide: true },
      { name: 'photo_id', label: 'Foto', type: 'image', wide: true, help: 'Foto personal, de tu trabajo o de un evento con tu equipo. JPG, PNG o WebP.' },
      { name: 'author', label: 'Firma', type: 'text', max: 80, placeholder: 'Rafael y Fany', help: 'Opcional. Aparece al final del mensaje.' },
      { name: 'published_on', label: 'Fecha', type: 'date', required: true, default: 'today' },
      { name: 'is_active', label: 'Visible en el sitio', type: 'checkbox', default: true },
    ],
  },

  solicitudes: {
    key: 'solicitudes',
    table: 'leads',
    permission: 'leads',
    singular: 'solicitud',
    plural: 'Solicitudes',
    description: 'Registros de comunidad y mensajes de contacto recibidos desde el sitio.',
    orderBy: 'created_at DESC',
    canCreate: false,
    canDelete: true,
    titleOf: (r) => `${s(r.name)}${r.business ? ` · ${s(r.business)}` : ''}`,
    columns: [
      { name: 'created_at', label: 'Recibida', kind: 'datetime' },
      { name: 'kind', label: 'Tipo', kind: 'badge' },
      { name: 'name', label: 'Nombre' },
      { name: 'phone', label: 'Teléfono' },
      { name: 'status', label: 'Estado', kind: 'badge' },
    ],
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', max: 120, displayOnly: true },
      { name: 'business', label: 'Negocio', type: 'text', max: 120, displayOnly: true },
      { name: 'phone', label: 'Teléfono', type: 'text', max: 30, displayOnly: true },
      { name: 'email', label: 'Correo', type: 'text', max: 120, displayOnly: true },
      { name: 'message', label: 'Mensaje', type: 'textarea', max: 2000, displayOnly: true, wide: true },
      {
        name: 'status',
        label: 'Estado de seguimiento',
        type: 'select',
        required: true,
        default: 'nuevo',
        options: [
          { value: 'nuevo', label: 'Nuevo' },
          { value: 'contactado', label: 'Contactado' },
          { value: 'cerrado', label: 'Cerrado' },
        ],
      },
      { name: 'notes', label: 'Notas internas', type: 'textarea', max: 1000, wide: true },
    ],
  },
};

export function getResource(key: string): ResourceDef | undefined {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key) ? RESOURCES[key] : undefined;
}

/** Campos que se guardan en base de datos (excluye los solo-lectura/visualización). */
export function writableFields(def: ResourceDef, editing: boolean): FieldDef[] {
  return def.fields.filter((f) => !f.displayOnly && !(editing && f.readOnlyOnEdit));
}
