# Fénix · Recolección y Envíos

Sitio público + panel de administración. Next.js 15 (App Router) · TypeScript · PostgreSQL (Aiven) · Vercel.

## Puesta en marcha (5 pasos)

1. **Instala dependencias:** `npm install`
2. **Crea el servicio en Aiven** (PostgreSQL) y copia su *Service URI* y el *CA certificate*.
3. **Configura variables:** copia `.env.example` a `.env.local` y llena:
   - `DATABASE_URL` (Service URI de Aiven)
   - `DATABASE_CA_CERT` (PEM en una línea con `\n`) **o** guarda el archivo en `certs/aiven-ca.pem`
   - `SESSION_SECRET` (genera uno con el comando que indica el archivo)
   - `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 12 caracteres) para el primer administrador
4. **Prepara la base:** `npm run db:setup` (crea tablas + primer admin + contenido de ejemplo).
   Verifica con `npm run db:check`.
5. **Arranca:** `npm run dev` → sitio en `/`, panel en `/admin/login`.

### Despliegue en Vercel
Importa el repositorio, carga las mismas variables en *Settings → Environment Variables* (más `NEXT_PUBLIC_SITE_URL` con tu dominio) y despliega. Ejecuta `npm run db:setup` una vez desde tu equipo apuntando a Aiven.

> Sin `DATABASE_URL` el sitio público funciona con contenido de respaldo; el panel y los formularios requieren la base.

## Qué puede editar la clienta (sin tocar código)
Comunicados · Servicios y su estado (activo/limitado/pausado) · Calendario de recolecciones · Carrusel · Indicadores · Ajustes (marca, WhatsApp, dirección, textos, aviso de privacidad y términos) · Solicitudes recibidas · Usuarios.

## Roles
| Rol | Contenido y solicitudes | Ajustes | Usuarios | Bitácora |
|---|---|---|---|---|
| Administrador | ✔ | ✔ | ✔ | ✔ |
| Trabajador | ✔ | — | — | — |

## Seguridad
- Contraseñas con bcrypt (costo 12); política de 12+ caracteres. Sesión en cookie `httpOnly` firmada (JWT) que se invalida al cambiar contraseña/rol o desactivar la cuenta.
- Bloqueo por intentos fallidos (por correo, por IP y bloqueo temporal de cuenta). Mensajes de error genéricos.
- Toda consulta es parametrizada; tablas y columnas salen de una lista blanca. Entradas saneadas y validadas en servidor.
- Cabeceras de seguridad (CSP, HSTS, X-Frame-Options…), panel con `noindex` y `no-store`.
- Formulario público con campo trampa anti-bots y límite por IP (hash, nunca la IP en claro).
- Errores: se registran en logs estructurados (sin secretos); al usuario solo se le muestra un mensaje seguro con referencia.

## Auditoría obligatoria
Cada creación, edición o borrado hecho por un administrador o trabajador (y cada ajuste, cambio de usuario, inicio/cierre de sesión) se escribe en `audit_log` **dentro de la misma transacción** que la acción: si no se puede registrar, la acción se revierte. Guarda quién, cuándo, qué entidad y los datos antes/después (en borrados, la instantánea completa). La tabla es inmutable (un trigger impide UPDATE, DELETE y TRUNCATE) y nunca almacena contraseñas ni hashes. Se consulta en `/admin/bitacora`.

## Notas
- El contenido de ejemplo (servicios, tiempos, horarios de recolección, indicadores y textos) es de muestra: edítalo desde el panel antes de publicar.
- El aviso de privacidad y los términos son una plantilla base: revísalos con un profesional legal.
- Desarrollo local con Postgres sin SSL: `DATABASE_SSL=off` (se ignora en producción).
