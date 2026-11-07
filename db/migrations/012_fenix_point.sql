-- Fénix Point: sucursales de entrega seleccionables, tamaños A/B/C + servicios especiales.
-- Todo es idempotente y no toca folios ya creados (conservan su sucursal, tamaño y precio).

-- ── Sucursales (editables desde el admin; no se borran, se desactivan) ──
CREATE TABLE IF NOT EXISTS folio_branches (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS folio_branches_name_uidx ON folio_branches (lower(name));

INSERT INTO folio_branches (name, sort_order)
SELECT v.name, v.sort_order
  FROM (VALUES ('Fénix Tijuana Matriz', 1), ('Fénix Ensenada', 2)) AS v (name, sort_order)
 WHERE NOT EXISTS (SELECT 1 FROM folio_branches b WHERE lower(b.name) = lower(v.name));

DROP TRIGGER IF EXISTS folio_branches_touch ON folio_branches;
CREATE TRIGGER folio_branches_touch BEFORE UPDATE ON folio_branches FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE folios ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES folio_branches (id) ON DELETE SET NULL;

-- La sucursal ahora se puede corregir mientras el folio esté activo (queda en la bitácora).
-- El número, la fecha y la solicitud siguen siendo inmutables; un folio cancelado no cambia nunca.
CREATE OR REPLACE FUNCTION folios_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
    RAISE EXCEPTION 'Los folios no se eliminan: cancélalos con un motivo.' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF NEW.folio_number <> OLD.folio_number
     OR NEW.created_at <> OLD.created_at
     OR NEW.request_id <> OLD.request_id THEN
    RAISE EXCEPTION 'El número y la fecha de un folio no se pueden cambiar.' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF OLD.status = 'cancelado' THEN
    RAISE EXCEPTION 'Un folio cancelado ya no se puede modificar.' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END $$;

-- ── Tamaños: A/B/C y servicios especiales por peso ──
UPDATE folio_sizes SET name = 'Tamaño A' WHERE name = 'Tamaño 1';
UPDATE folio_sizes SET name = 'Tamaño B' WHERE name = 'Tamaño 2';
UPDATE folio_sizes SET name = 'Tamaño C' WHERE name = 'Tamaño 3';

INSERT INTO folio_sizes (name, min_kg, max_kg, price, sort_order)
SELECT v.name, v.min_kg, v.max_kg, v.price, v.sort_order
  FROM (VALUES
    ('Especial hasta 15 kg', 6.10::numeric, 15.00::numeric, 250.00::numeric, 4),
    ('Especial hasta 30 kg', 15.10::numeric, 30.00::numeric, 300.00::numeric, 5)
  ) AS v (name, min_kg, max_kg, price, sort_order)
 WHERE NOT EXISTS (SELECT 1 FROM folio_sizes s WHERE s.name = v.name);
