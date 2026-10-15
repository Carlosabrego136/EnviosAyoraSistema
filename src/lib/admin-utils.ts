import 'server-only';
import { cache } from 'react';
import { safeTimezone } from './settings';
import { loadSettings } from './site-settings';

/** Zona horaria del negocio, para mostrar fechas en el panel. */
export const adminTimezone = cache(async (): Promise<string> => safeTimezone((await loadSettings()).timezone));

export const LABELS: Record<string, string> = {
  active: 'Activo',
  limited: 'Limitado',
  paused: 'Pausado',
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  cerrado: 'Cerrado',
  registro: 'Registro',
  contacto: 'Consulta',
  admin: 'Administrador',
  worker: 'Trabajador',
  activo: 'Activo',
  inactivo: 'Inactivo',
  renovacion: 'Renovación pendiente',
  riesgo: 'Riesgo',
  aereo: 'Aéreo',
  terrestre: 'Terrestre',
  bajapack: 'Bajapack',
  tarimas: 'Tarimas',
};

export const FLASH_OK: Record<string, string> = {
  creado: 'Listo, se creó y ya se ve en el sitio (puede tardar hasta un minuto en actualizarse).',
  editado: 'Listo, tus cambios se guardaron y ya se ven en el sitio (puede tardar hasta un minuto).',
  eliminado: 'Listo, se eliminó. Quedó asentado en la bitácora.',
};

export const FLASH_ERROR: Record<string, string> = {
  not_found: 'El registro ya no existe.',
  forbidden: 'No tienes permiso para realizar esa acción.',
  database: 'No pudimos completar la operación. Inténtalo de nuevo en unos minutos.',
  config: 'La base de datos aún no está configurada.',
  interno: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
};
