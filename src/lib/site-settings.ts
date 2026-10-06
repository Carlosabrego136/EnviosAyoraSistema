import 'server-only';
import { writeAudit, type Actor } from './audit';
import { isDbConfigured, query, withTransaction } from './db';
import { ValidationError } from './errors';
import { logger } from './logger';
import { cleanLine, cleanMultiline, type RequestContext } from './security';
import { SETTING_DEFS, defaultSettings, safeTimezone, type SettingsMap } from './settings';

/** Ajustes del sitio: valores guardados sobre los predeterminados. Si la BD falla, usa los predeterminados. */
export async function loadSettings(): Promise<SettingsMap> {
  const settings = defaultSettings();
  if (!isDbConfigured()) return settings;
  try {
    const rows = await query<{ key: string; value: string }>('SELECT key, value FROM site_settings');
    for (const row of rows) {
      if (row.key in settings) settings[row.key] = row.value;
    }
  } catch (err) {
    logger.warn('settings.load_fallback', { error: String(err) });
  }
  return settings;
}

function parseSettings(formData: FormData): SettingsMap {
  const errors: Record<string, string> = {};
  const values: SettingsMap = {};
  for (const def of SETTING_DEFS) {
    const raw = formData.get(def.key);
    let value = def.type === 'textarea' ? cleanMultiline(raw, def.max) : cleanLine(raw, def.max);

    if (def.type === 'phone') {
      value = value.replace(/\D/g, '');
      if (value && (value.length < 10 || value.length > 15)) errors[def.key] = 'Número no válido (10 a 15 dígitos).';
    }
    if (def.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      errors[def.key] = 'Correo no válido.';
    }
    if (def.type === 'timezone' && value && safeTimezone(value) !== value) {
      errors[def.key] = 'Zona horaria no válida (ej. America/Tijuana).';
    }
    if (!value && ['brand_name', 'whatsapp_number'].includes(def.key)) errors[def.key] = `${def.label} es obligatorio.`;
    values[def.key] = value;
  }
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return values;
}

export async function saveSettings(formData: FormData, actor: Actor, ctx: RequestContext): Promise<string[]> {
  const next = parseSettings(formData);

  const changedKeys = await withTransaction(async (client) => {
    const { rows } = await client.query<{ key: string; value: string }>(
      'SELECT key, value FROM site_settings FOR UPDATE',
    );
    const current: SettingsMap = { ...defaultSettings() };
    for (const r of rows) current[r.key] = r.value;

    const changed: string[] = [];
    for (const def of SETTING_DEFS) {
      if (current[def.key] === next[def.key]) continue;
      await client.query(
        `INSERT INTO site_settings (key, value, updated_by) VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by`,
        [def.key, next[def.key], actor.id],
      );
      await writeAudit(client, {
        actor,
        action: 'settings.update',
        entity: 'site_settings',
        entityId: def.key,
        summary: `Editó ajuste "${def.label}"`,
        before: { [def.key]: current[def.key] },
        after: { [def.key]: next[def.key] },
        ctx,
      });
      changed.push(def.key);
    }
    return changed;
  });
  logger.info('settings.saved', { actor: actor.id, changed: changedKeys });
  return changedKeys;
}
