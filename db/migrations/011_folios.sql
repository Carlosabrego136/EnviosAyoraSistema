-- ═══════════════════════════════════════════════════════════════
--  Módulo de folios y etiquetas (recolectores)
--  · Rol nuevo "recolector" (sesión general que solo ve el módulo de folios).
--  · Folio único y consecutivo de 5 dígitos por paquete (00001–99999), sin huecos y sin reutilizarse.
--  · Catálogo de tamaños y precios editable desde el panel.
--  · Un folio jamás se borra: se cancela con motivo y queda en el historial.
-- ═══════════════════════════════════════════════════════════════

-- ── Rol "recolector" ────────────────────────────────────────────
DO $$
DECLARE c TEXT;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'users'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'worker', 'recolector'));

-- ── Catálogo de tamaños y precios ───────────────────────────────
CREATE TABLE folio_sizes (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT          NOT NULL,
  min_kg      NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (min_kg >= 0),
  max_kg      NUMERIC(6, 2) NOT NULL CHECK (max_kg > 0),
  price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  sort_order  INTEGER       NOT NULL DEFAULT 0,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT folio_sizes_range_chk CHECK (max_kg >= min_kg)
);

INSERT INTO folio_sizes (name, min_kg, max_kg, price, sort_order) VALUES
  ('Tamaño 1', 0,   2, 15, 1),
  ('Tamaño 2', 2.1, 4, 30, 2),
  ('Tamaño 3', 4.1, 6, 45, 3);

-- ── Contador de folios (una sola fila; se incrementa dentro de la misma transacción del folio) ──
CREATE TABLE folio_counter (
  id           SMALLINT PRIMARY KEY CHECK (id = 1),
  last_number  INTEGER NOT NULL DEFAULT 0 CHECK (last_number BETWEEN 0 AND 99999)
);
INSERT INTO folio_counter (id, last_number) VALUES (1, 0);

-- ── Folios ──────────────────────────────────────────────────────
CREATE TABLE folios (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  folio_number     INTEGER       NOT NULL CHECK (folio_number BETWEEN 1 AND 99999),
  request_id       UUID          NOT NULL,
  branch           TEXT          NOT NULL,
  sender_name      TEXT          NOT NULL,
  sender_phone     TEXT          NOT NULL DEFAULT '',
  recipient_name   TEXT          NOT NULL DEFAULT '',
  weight_kg        NUMERIC(6, 2) CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 1000)),
  size_id          BIGINT        REFERENCES folio_sizes (id) ON DELETE SET NULL,
  size_name        TEXT          NOT NULL,
  price            NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  collector        TEXT          NOT NULL DEFAULT '',
  paid             BOOLEAN       NOT NULL DEFAULT FALSE,
  paid_at          TIMESTAMPTZ,
  carrier_guide    TEXT          NOT NULL DEFAULT '',
  notes            TEXT          NOT NULL DEFAULT '',
  status           TEXT          NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'cancelado')),
  cancel_reason    TEXT          NOT NULL DEFAULT '',
  cancelled_at     TIMESTAMPTZ,
  cancelled_by     TEXT          NOT NULL DEFAULT '',
  created_by       BIGINT        REFERENCES users (id) ON DELETE SET NULL,
  created_by_name  TEXT          NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT folios_cancel_chk CHECK (status <> 'cancelado' OR (cancel_reason <> '' AND cancelled_at IS NOT NULL))
);
CREATE UNIQUE INDEX folios_number_uidx    ON folios (folio_number);
CREATE UNIQUE INDEX folios_request_uidx   ON folios (request_id);
CREATE INDEX folios_created_idx           ON folios (created_at DESC);
CREATE INDEX folios_status_created_idx    ON folios (status, created_at DESC);
CREATE INDEX folios_collector_idx         ON folios (lower(collector), created_at DESC);

-- Protecciones de integridad: el número, la fecha de creación y el origen no cambian nunca;
-- un folio cancelado no se puede modificar ni reactivar; ningún folio se borra.
CREATE FUNCTION folios_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
    RAISE EXCEPTION 'Los folios no se eliminan: cancélalos con un motivo.' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF NEW.folio_number <> OLD.folio_number
     OR NEW.created_at <> OLD.created_at
     OR NEW.request_id <> OLD.request_id
     OR NEW.branch <> OLD.branch THEN
    RAISE EXCEPTION 'El número, la fecha y la sucursal de un folio no se pueden cambiar.' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF OLD.status = 'cancelado' THEN
    RAISE EXCEPTION 'Un folio cancelado ya no se puede modificar.' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER folios_no_delete
  BEFORE DELETE ON folios
  FOR EACH ROW EXECUTE FUNCTION folios_guard();
CREATE TRIGGER folios_no_truncate
  BEFORE TRUNCATE ON folios
  FOR EACH STATEMENT EXECUTE FUNCTION folios_guard();
CREATE TRIGGER folios_protect_update
  BEFORE UPDATE ON folios
  FOR EACH ROW EXECUTE FUNCTION folios_guard();

-- updated_at automático
CREATE TRIGGER folios_touch      BEFORE UPDATE ON folios      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER folio_sizes_touch BEFORE UPDATE ON folio_sizes FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
