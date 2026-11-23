-- El Top de comerciantes pasa de 9 a 10 posiciones.
-- Solo se amplía el límite; las posiciones que ya estaban asignadas no cambian.
DO $$
DECLARE c TEXT;
BEGIN
  FOR c IN
    SELECT con.conname FROM pg_constraint con
    WHERE con.conrelid = 'merchants'::regclass AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%top_rank%'
  LOOP
    EXECUTE format('ALTER TABLE merchants DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE merchants ADD CONSTRAINT merchants_top_rank_check CHECK (top_rank IS NULL OR top_rank BETWEEN 1 AND 10);

INSERT INTO audit_log (action, entity, entity_id, summary)
VALUES ('system.migration', 'system', '013', 'Migración 013: el Top de comerciantes ahora tiene 10 posiciones');
