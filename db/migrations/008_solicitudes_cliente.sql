-- Nuevo tipo de solicitud: "cliente" (registro de clientes de recolección y envío).
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_kind_check;
ALTER TABLE leads ADD CONSTRAINT leads_kind_check CHECK (kind IN ('registro', 'contacto', 'cliente'));

INSERT INTO audit_log (action, entity, entity_id, summary)
VALUES ('system.migration', 'system', '008', 'Migración 008: solicitudes de clientes de recolección y envío');
