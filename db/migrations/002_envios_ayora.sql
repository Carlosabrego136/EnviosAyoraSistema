-- ═══════════════════════════════════════════════════════════
--  ENVÍOS AYORA — migración 002
--  Tarifas (cotizador), directorio de comerciantes, Top 9,
--  espacio personal, imágenes y los 4 servicios reales.
-- ═══════════════════════════════════════════════════════════

-- ── Imágenes subidas desde el panel (se guardan en la base de datos) ──
CREATE TABLE media (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mime        TEXT        NOT NULL CHECK (mime IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes  INTEGER     NOT NULL CHECK (size_bytes > 0),
  data        BYTEA       NOT NULL,
  created_by  BIGINT REFERENCES users (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Servicios: slug (enlaza con el tabulador), paqueterías y cobertura ──
ALTER TABLE services ADD COLUMN slug      TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN carriers  TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN coverage  TEXT NOT NULL DEFAULT '';
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_icon_check;
ALTER TABLE services ADD CONSTRAINT services_icon_check
  CHECK (icon IN ('plane', 'truck', 'box', 'mail', 'pin', 'shield', 'pallet'));

-- ── Tabulador de tarifas (alimenta el cotizador) ────────────
CREATE TABLE rates (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  service_slug  TEXT          NOT NULL CHECK (service_slug IN ('aereo', 'terrestre', 'bajapack', 'tarimas')),
  carrier       TEXT          NOT NULL DEFAULT '',   -- vacío = aplica a cualquier paquetería del servicio
  destination   TEXT          NOT NULL DEFAULT '',   -- vacío = aplica a cualquier destino
  weight_from   NUMERIC(8,2)  NOT NULL DEFAULT 0 CHECK (weight_from >= 0),
  weight_to     NUMERIC(8,2)  NOT NULL CHECK (weight_to > 0),
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  price_type    TEXT          NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'per_kg')),
  note          TEXT          NOT NULL DEFAULT '',
  sort_order    INTEGER       NOT NULL DEFAULT 0,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT rates_weight_order CHECK (weight_to >= weight_from)
);
CREATE INDEX rates_lookup_idx ON rates (is_active, service_slug, carrier, destination, weight_from);

-- ── Directorio de comerciantes ──────────────────────────────
CREATE TABLE merchants (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT        NOT NULL,
  category      TEXT        NOT NULL DEFAULT 'General',
  status        TEXT        NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'renovacion', 'riesgo')),
  zone          TEXT        NOT NULL DEFAULT '',
  description   TEXT        NOT NULL DEFAULT '',
  whatsapp      TEXT        NOT NULL DEFAULT '',
  facebook_url  TEXT        NOT NULL DEFAULT '',
  photo_id      BIGINT REFERENCES media (id) ON DELETE SET NULL,
  top_rank      SMALLINT CHECK (top_rank BETWEEN 1 AND 9),
  top_note      TEXT        NOT NULL DEFAULT '',
  is_public     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX merchants_top_rank_uidx ON merchants (top_rank) WHERE top_rank IS NOT NULL;
CREATE INDEX merchants_public_idx ON merchants (is_public, status, lower(name));

-- ── Espacio personal: mensajes con foto ─────────────────────
CREATE TABLE owner_posts (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL,
  author        TEXT        NOT NULL DEFAULT '',
  photo_id      BIGINT REFERENCES media (id) ON DELETE SET NULL,
  published_on  DATE        NOT NULL DEFAULT CURRENT_DATE,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX owner_posts_pub_idx ON owner_posts (is_active, published_on DESC);

CREATE TRIGGER rates_touch       BEFORE UPDATE ON rates       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER merchants_touch   BEFORE UPDATE ON merchants   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER owner_posts_touch BEFORE UPDATE ON owner_posts FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ═══ Contenido real de Envíos Ayora (reemplaza el contenido de ejemplo) ═══

-- Servicios: los 4 que ofrece Envíos Ayora
DELETE FROM services;
INSERT INTO services (slug, name, description, eta_text, icon, status, carriers, coverage, sort_order) VALUES
  ('aereo',     'Envío aéreo',
   'Llega más rápido a cualquier parte de la República. Cotiza por peso y paquetería.',
   '', 'plane', 'active', 'FedEx, DHL, Estafeta, Volaris', 'Todo México', 1),
  ('terrestre', 'Envío terrestre',
   'La opción económica para tus compras. Cotiza por peso y paquetería.',
   '', 'truck', 'active', 'Paquete Express, FedEx, Estafeta', 'Todo México', 2),
  ('bajapack',  'Bajapack',
   'Envíos dentro de Baja California con Baja Pack Express.',
   '', 'box', 'active', 'Baja Pack Express', 'Solo Baja California', 3),
  ('tarimas',   'Gran volumen · Tarimas',
   'Envío terrestre de gran volumen, en tarimas. Cotización personalizada.',
   '', 'pallet', 'active', '', '', 4);

-- Carrusel de portada
DELETE FROM slides;
INSERT INTO slides (eyebrow, title, subtitle, body, cta_label, cta_href, sort_order) VALUES
  ('Tus recolectores de confianza', 'Compramos, recolectamos y enviamos.',
   'Ensenada · Tijuana · Rosarito y todo México',
   'Recolectamos tu mercancía y la enviamos con FedEx, DHL, Estafeta, Volaris y Paquete Express.',
   'Cotizar mi envío', '/cotizar', 1),
  ('Recolección', 'Cada viernes de 10:00 a 16:00',
   'Entregamos personalmente',
   'Coordina tu recolección con nuestro equipo y recibe atención directa por WhatsApp.',
   'Agendar por WhatsApp', 'whatsapp', 2),
  ('La Ruta del Saldo', 'La Ruta del Saldo Ensenada–Tijuana',
   'Únete a nuestro grupo de WhatsApp',
   'Compra con tus vendedores favoritos y nosotros recolectamos y enviamos tus compras.',
   'Conocer la ruta', '/ruta-del-saldo', 3);

-- Indicadores
DELETE FROM stats;
INSERT INTO stats (value, label, caption, sort_order) VALUES
  ('32',  'Estados de la República', 'Enviamos a todo México', 1),
  ('VIE', 'Día de recolección',      'De 10:00 a 16:00',       2),
  ('4',   'Servicios de envío',      'Aéreo, terrestre, Bajapack y tarimas', 3);

-- Recolecciones de ejemplo: ahora el día fijo se define en Ajustes (viernes 10:00–16:00)
DELETE FROM pickups WHERE updated_at = created_at;

-- Ajustes guardados con los textos anteriores: vuelven a los nuevos predeterminados
DELETE FROM site_settings WHERE (key, value) IN (
  ('brand_name', 'Fénix'),
  ('brand_legal', 'Envíos Ayora'),
  ('whatsapp_greeting', 'Hola Fénix, me gustaría información sobre sus servicios de envío.'),
  ('community_eyebrow', 'Comunidad Fénix'),
  ('community_title', 'Más que envíos, un equipo que responde'),
  ('footer_quote', 'Tu mercancía, con un equipo que responde.')
);

INSERT INTO audit_log (action, entity, entity_id, summary)
VALUES ('system.migration', 'system', '002', 'Migración 002: tarifas, comerciantes, espacio personal y 4 servicios de Envíos Ayora');
