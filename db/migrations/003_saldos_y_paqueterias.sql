-- ═══════════════════════════════════════════════════════════
--  ENVÍOS AYORA — migración 003
--  · Saldos con los que trabajamos (perfiles de Facebook en La Ruta del Saldo)
--  · Paqueterías actualizadas por servicio
--  · Ajustes de marca según lo confirmado por la clienta
-- ═══════════════════════════════════════════════════════════

CREATE TABLE saldos (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  city         TEXT        NOT NULL DEFAULT 'Tijuana' CHECK (city IN ('Tijuana', 'Ensenada', 'Rosarito', 'Otra')),
  facebook_url TEXT        NOT NULL CHECK (facebook_url ~ '^https://'),
  description  TEXT        NOT NULL DEFAULT '' CHECK (char_length(description) <= 200),
  photo_id     BIGINT REFERENCES media (id) ON DELETE SET NULL,
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX saldos_active_idx ON saldos (is_active, sort_order, name);
CREATE TRIGGER saldos_touch BEFORE UPDATE ON saldos FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Paqueterías por servicio (solo si siguen como las dejó la migración 002) ──
UPDATE services SET carriers = 'Estafeta, Volaris, DHL, FedEx'      WHERE slug = 'aereo'     AND carriers = 'FedEx, DHL, Estafeta, Volaris';
UPDATE services SET carriers = 'Paquete Express, Estafeta, FedEx'   WHERE slug = 'terrestre' AND carriers = 'Paquete Express, FedEx, Estafeta';
UPDATE services SET carriers = 'Castores, Estafeta'                 WHERE slug = 'tarimas'   AND carriers = '';

-- ── Ajustes: si aún tienen el valor anterior, se retiran para usar el nuevo predeterminado ──
DELETE FROM site_settings WHERE (key = 'owner_names'    AND value = 'Rafael Ayora y Fany Molina');
DELETE FROM site_settings WHERE (key = 'location_badge' AND value = 'Ensenada · Tijuana · Rosarito');
DELETE FROM site_settings WHERE (key = 'brand_tagline'  AND value = 'Recolección y Envíos');
DELETE FROM site_settings WHERE (key = 'quote_note'     AND value LIKE 'Precio estimado. El costo final se confirma antes de realizar el envío y puede variar%');
DELETE FROM site_settings WHERE (key = 'tiktok_url'     AND value = '');

INSERT INTO audit_log (action, entity, entity_id, summary)
VALUES ('system.migration', 'system', '003', 'Migración 003: saldos de La Ruta del Saldo, paqueterías por servicio y ajustes de marca');
