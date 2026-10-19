-- Dos sedes (Tijuana y Ensenada): si los textos de ubicación siguen con el valor anterior,
-- se retiran para que se use el nuevo predeterminado.
DELETE FROM site_settings WHERE key = 'location_badge' AND value = 'Ubicados en la zona 5 y 10, Tijuana';
DELETE FROM site_settings WHERE key = 'location_text';

INSERT INTO audit_log (action, entity, entity_id, summary)
VALUES ('system.migration', 'system', '005', 'Migración 005: sedes de Tijuana y Ensenada');
