-- Respuestas de la clienta: tiempos de entrega, terrestre igual en las tres paqueterías,
-- categorías fijas de comerciantes. Todo es repetible y no pisa datos capturados a mano.

-- Tiempos de entrega (solo si siguen vacíos)
UPDATE services SET eta_text = '2 a 3 días hábiles' WHERE slug = 'aereo'     AND eta_text = '';
UPDATE services SET eta_text = '5 a 8 días hábiles' WHERE slug = 'terrestre' AND eta_text = '';
UPDATE services SET eta_text = '2 a 4 días hábiles' WHERE slug = 'bajapack'  AND eta_text = '';

-- Terrestre: FedEx y Estafeta cuestan igual que Paquete Express (se copian sus tarifas si aún no existen)
INSERT INTO rates (service_slug, carrier, destination, weight_from, weight_to, price, price_type, note, sort_order, is_active)
SELECT r.service_slug, c.carrier, r.destination, r.weight_from, r.weight_to, r.price, r.price_type, r.note, r.sort_order, r.is_active
FROM rates r
CROSS JOIN (VALUES ('FedEx'), ('Estafeta')) AS c(carrier)
WHERE r.service_slug = 'terrestre' AND r.carrier = 'Paquete Express'
  AND NOT EXISTS (
    SELECT 1 FROM rates x
    WHERE x.service_slug = 'terrestre' AND x.carrier = c.carrier
      AND x.destination = r.destination AND x.weight_from = r.weight_from AND x.weight_to = r.weight_to
  );

-- Categorías de comerciantes: lo que no esté en la lista oficial pasa a "Variado"
UPDATE merchants SET category = CASE lower(trim(category))
    WHEN 'target' THEN 'Saldos Target' WHEN 'targets' THEN 'Saldos Target'
    WHEN 'amazon' THEN 'Saldos Amazon'
    WHEN 'saldos' THEN 'Saldos en General' WHEN 'saldo' THEN 'Saldos en General'
    WHEN 'ropa' THEN 'Ropa para Toda la Familia'
    WHEN 'calzado' THEN 'Calzado y Accesorios' WHEN 'accesorios' THEN 'Calzado y Accesorios'
    WHEN 'juguetes' THEN 'Juguetes'
    WHEN 'mascotas' THEN 'Artículos de Mascota'
    WHEN 'hogar' THEN 'Decoración y Hogar'
    WHEN 'snacks' THEN 'Snacks y Alimentos'
    ELSE 'Variado' END
WHERE category NOT IN ('Saldos Target','Saldos Amazon','Saldos en General','Ropa de Dama','Ropa Caballero','Ropa Niños',
  'Ropa para Toda la Familia','Decoración y Hogar','Juguetes','Artículos de Mascota','Calzado y Accesorios',
  'Artículos de Marca','Snacks y Alimentos','Personal Shopper en Tiendas de Marca','Variado');
ALTER TABLE merchants ALTER COLUMN category SET DEFAULT 'Variado';

DELETE FROM site_settings WHERE key = 'ensenada_address' AND value = 'Col. Bustamante, Ensenada, B.C.';

INSERT INTO audit_log (action, entity, entity_id, summary)
VALUES ('system.migration', 'system', '006', 'Migración 006: tiempos de entrega, terrestre FedEx/Estafeta, categorías');
