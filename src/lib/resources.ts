// Definición declarativa de los módulos de contenido editables desde el panel.
// Todo nombre de tabla/columna usado en SQL sale de esta lista blanca (nunca del usuario).
import { isSafeHref } from './security';

export type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'date' | 'time' | 'select';

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
}

export interface ColumnDef {
  name: string;
  label: string;
  kind?: 'text' | 'bool' | 'date' | 'time' | 'badge' | 'datetime';
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
  /** Validaciones entre campos; devuelve errores por campo. */
  validate?: (values: Record<string, unknown>) => Record<string, string>;
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
      { name: 'eta_text', label: 'Tiempo estimado' },
      { name: 'status', label: 'Estado', kind: 'badge' },
      { name: 'is_active', label: 'Visible', kind: 'bool' },
    ],
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true, max: 60, wide: true },
      { name: 'description', label: 'Descripción', type: 'textarea', max: 240, wide: true },
      { name: 'eta_text', label: 'Tiempo estimado', type: 'text', max: 60, placeholder: '1 a 3 días hábiles' },
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
    plural: 'Calendario de recolecciones',
    description: 'Fechas y horarios en los que recibes mercancía. El sitio muestra solo las próximas.',
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
