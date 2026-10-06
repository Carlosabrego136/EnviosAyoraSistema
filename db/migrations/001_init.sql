-- ═══════════════════════════════════════════════════════════
--  FÉNIX · Recolección y Envíos — esquema inicial (PostgreSQL)
--  Compatible con Aiven for PostgreSQL 13+
-- ═══════════════════════════════════════════════════════════

-- ── Usuarios del panel (administradores y trabajadores) ─────
CREATE TABLE users (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email            TEXT        NOT NULL,
  name             TEXT        NOT NULL,
  password_hash    TEXT        NOT NULL,
  role             TEXT        NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  failed_attempts  INTEGER     NOT NULL DEFAULT 0,
  locked_until     TIMESTAMPTZ,
  last_login_at    TIMESTAMPTZ,
  token_version    INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_uidx ON users (lower(email));

-- ── Intentos de inicio de sesión (limitación de fuerza bruta) ─
CREATE TABLE login_attempts (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       TEXT        NOT NULL,
  ip_hash     TEXT        NOT NULL,
  success     BOOLEAN     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_ip_idx    ON login_attempts (ip_hash, created_at DESC);
CREATE INDEX login_attempts_email_idx ON login_attempts (lower(email), created_at DESC);

-- ── Ajustes del sitio (clave/valor editable desde el panel) ──
CREATE TABLE site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  BIGINT REFERENCES users (id) ON DELETE SET NULL
);

-- ── Carrusel principal ──────────────────────────────────────
CREATE TABLE slides (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  eyebrow     TEXT        NOT NULL DEFAULT '',
  title       TEXT        NOT NULL,
  subtitle    TEXT        NOT NULL DEFAULT '',
  body        TEXT        NOT NULL DEFAULT '',
  cta_label   TEXT        NOT NULL DEFAULT '',
  cta_href    TEXT        NOT NULL DEFAULT '',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indicadores / contadores ────────────────────────────────
CREATE TABLE stats (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  value       TEXT        NOT NULL,
  label       TEXT        NOT NULL,
  caption     TEXT        NOT NULL DEFAULT '',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Comunicados ─────────────────────────────────────────────
CREATE TABLE announcements (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category      TEXT        NOT NULL DEFAULT 'Avisos',
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  published_on  DATE        NOT NULL DEFAULT CURRENT_DATE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX announcements_pub_idx ON announcements (is_active, published_on DESC);

-- ── Servicios y estado operativo ────────────────────────────
CREATE TABLE services (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  eta_text     TEXT        NOT NULL DEFAULT '',
  icon         TEXT        NOT NULL DEFAULT 'box' CHECK (icon IN ('plane', 'truck', 'box', 'mail', 'pin', 'shield')),
  status       TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'limited', 'paused')),
  status_note  TEXT        NOT NULL DEFAULT '',
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Calendario de recolecciones ─────────────────────────────
CREATE TABLE pickups (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pickup_date  DATE        NOT NULL,
  start_time   TIME        NOT NULL,
  end_time     TIME        NOT NULL,
  note         TEXT        NOT NULL DEFAULT 'Recolección general',
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pickups_time_order CHECK (end_time > start_time)
);
CREATE INDEX pickups_date_idx ON pickups (is_active, pickup_date);

-- ── Solicitudes (registro de comunidad y contacto) ──────────
CREATE TABLE leads (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind        TEXT        NOT NULL CHECK (kind IN ('registro', 'contacto')),
  name        TEXT        NOT NULL,
  business    TEXT        NOT NULL DEFAULT '',
  phone       TEXT        NOT NULL,
  email       TEXT        NOT NULL DEFAULT '',
  message     TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'contactado', 'cerrado')),
  notes       TEXT        NOT NULL DEFAULT '',
  ip_hash     TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX leads_status_idx ON leads (status, created_at DESC);
CREATE INDEX leads_ip_idx     ON leads (ip_hash, created_at DESC);

-- ── Bitácora de auditoría (inmutable) ───────────────────────
--  Cada edición, borrado o acción crítica se registra aquí en la
--  MISMA transacción que la acción: si la bitácora falla, la acción
--  se revierte. Quién (actor), cuándo (created_at) y qué (before/after).
CREATE TABLE audit_log (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id     BIGINT,
  actor_email  TEXT        NOT NULL DEFAULT 'sistema',
  actor_name   TEXT        NOT NULL DEFAULT 'Sistema',
  actor_role   TEXT        NOT NULL DEFAULT 'system',
  action       TEXT        NOT NULL,
  entity       TEXT        NOT NULL,
  entity_id    TEXT        NOT NULL DEFAULT '',
  summary      TEXT        NOT NULL DEFAULT '',
  before_data  JSONB,
  after_data   JSONB,
  ip_hash      TEXT        NOT NULL DEFAULT '',
  user_agent   TEXT        NOT NULL DEFAULT ''
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
CREATE INDEX audit_log_entity_idx  ON audit_log (entity, entity_id, created_at DESC);
CREATE INDEX audit_log_actor_idx   ON audit_log (actor_id, created_at DESC);

CREATE FUNCTION audit_log_block_changes() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log es inmutable: no se permite % sobre la bitácora', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_changes();

CREATE TRIGGER audit_log_no_truncate
  BEFORE TRUNCATE ON audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION audit_log_block_changes();

-- ── updated_at automático ───────────────────────────────────
CREATE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_touch         BEFORE UPDATE ON users         FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER site_settings_touch BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER slides_touch        BEFORE UPDATE ON slides        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER stats_touch         BEFORE UPDATE ON stats         FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER announcements_touch BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER services_touch      BEFORE UPDATE ON services      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER pickups_touch       BEFORE UPDATE ON pickups       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER leads_touch         BEFORE UPDATE ON leads         FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
