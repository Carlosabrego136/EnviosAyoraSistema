import { logger, newErrorRef } from './logger';

/** Error controlado: su `publicMessage` es seguro de mostrar al usuario. */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly publicMessage: string;

  constructor(code: string, publicMessage: string, status = 400, options?: { cause?: unknown }) {
    super(publicMessage, options);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export class ValidationError extends AppError {
  readonly fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>, message = 'Revisa los campos marcados.') {
    super('VALIDATION', message, 422);
    this.fieldErrors = fieldErrors;
  }
}

export class AuthError extends AppError {
  constructor(message = 'Correo o contraseña incorrectos.') {
    super('AUTH', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tienes permiso para realizar esta acción.') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'El registro no existe o ya fue eliminado.') {
    super('NOT_FOUND', message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Ya existe un registro con esos datos.') {
    super('CONFLICT', message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.') {
    super('RATE_LIMIT', message, 429);
  }
}

export class DatabaseError extends AppError {
  constructor(cause?: unknown) {
    super(
      'DATABASE',
      'No pudimos completar la operación en este momento. Inténtalo de nuevo en unos minutos.',
      503,
      { cause },
    );
  }
}

export class ConfigError extends AppError {
  constructor(message = 'El servicio no está configurado todavía.') {
    super('CONFIG', message, 503);
  }
}

export interface ActionState {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Valores enviados, para que el formulario no se vacíe cuando hay un error. */
  values?: Record<string, string>;
}

/** Devuelve lo que el usuario escribió (sin contraseñas ni campos trampa) para repoblar el formulario. */
export function echoValues(formData: FormData, exclude: string[] = []): Record<string, string> {
  const out: Record<string, string> = {};
  const blocked = new Set(['website', ...exclude]);
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string' || blocked.has(key) || key.startsWith('$ACTION')) continue;
    if (/pass|clave|contrase/i.test(key)) continue;
    out[key] = value.slice(0, 3000);
  }
  return out;
}

/**
 * Convierte cualquier excepción en un estado seguro para el usuario.
 * Los errores no controlados se registran con una referencia y nunca exponen detalles internos.
 */
export function toActionState(err: unknown, context: string): ActionState {
  if (err instanceof ValidationError) {
    return { ok: false, error: err.publicMessage, fieldErrors: err.fieldErrors };
  }
  if (err instanceof AppError) {
    if (err.status >= 500) logger.error(`${context}.app_error`, err, { code: err.code });
    return { ok: false, error: err.publicMessage };
  }
  const ref = newErrorRef();
  logger.error(`${context}.unexpected`, err, { ref });
  return {
    ok: false,
    error: `Ocurrió un error inesperado. Inténtalo de nuevo. (ref. ${ref})`,
  };
}
