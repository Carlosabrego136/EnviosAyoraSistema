// Registro estructurado (JSON por línea) apto para los logs de Vercel.
// Nunca imprime secretos: las claves sensibles se redactan automáticamente.

type Level = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_KEY = /pass(word)?|secret|token|hash|cookie|authorization|database_url|cert|key/i;
const MAX_DEPTH = 4;

function redact(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > MAX_DEPTH) return '[truncado]';
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) return value.slice(0, 25).map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? '[redactado]' : redact(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > 500) return `${value.slice(0, 500)}…`;
  return value;
}

export function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const anyErr = err as Error & { code?: unknown; cause?: unknown };
    return {
      name: err.name,
      message: err.message,
      code: anyErr.code,
      // El stack solo se registra fuera de producción para no inflar los logs.
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      cause: anyErr.cause instanceof Error ? { name: anyErr.cause.name, message: anyErr.cause.message } : undefined,
    };
  }
  return { message: String(err) };
}

function emit(level: Level, event: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    event,
    ...(meta ? (redact(meta) as Record<string, unknown>) : {}),
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', event, meta);
  },
  info: (event: string, meta?: Record<string, unknown>) => emit('info', event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => emit('warn', event, meta),
  error: (event: string, err?: unknown, meta?: Record<string, unknown>) =>
    emit('error', event, { ...meta, error: err === undefined ? undefined : serializeError(err) }),
};

/** Identificador corto para correlacionar un error mostrado al usuario con el log del servidor. */
export function newErrorRef(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
