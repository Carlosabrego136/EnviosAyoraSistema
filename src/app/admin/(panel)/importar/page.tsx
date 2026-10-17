import Link from 'next/link';
import { ImportForm } from '@/components/admin/ImportForm';
import { requirePageUser } from '@/lib/auth';

export const metadata = { title: 'Importar datos' };

export default async function ImportPage() {
  await requirePageUser('content.write');
  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Importar datos</h1>
          <p>Carga muchas filas de golpe copiándolas desde Excel o Google Sheets (también sirve CSV separado por punto y coma).</p>
        </div>
      </header>

      <section className="adm-panel card">
        <div className="adm-panel__head">
          <h2>Tarifas del cotizador</h2>
          <Link className="link-arrow" href="/admin/c/tarifas">Ver tarifas cargadas</Link>
        </div>
        <div className="adm-import">
          <p className="muted">Una fila por rango de peso, con estas 6 columnas (la 7.ª es opcional):</p>
          <pre>{`servicio ; paquetería ; destino ; peso desde ; peso hasta ; precio ; tipo`}</pre>
          <p className="muted">
            <strong>Servicio:</strong> aereo, terrestre, bajapack o tarimas. <strong>Paquetería</strong> y <strong>destino</strong> pueden ir vacíos si el precio
            aplica a todos. <strong>Tipo:</strong> deja vacío para precio fijo del rango, o escribe &quot;por kg&quot; si el precio se multiplica por los kilos.
          </p>
          <pre>{`terrestre ; Paquete Express ; Zona 1 ; 0 ; 1 ; 145
terrestre ; Paquete Express ; Zona 1 ; 1 ; 2 ; 175
aereo ; FedEx ; ; 0 ; 1 ; 260
bajapack ; Baja Pack Express ; Baja California ; 0 ; 5 ; 120`}</pre>
          <p className="muted">
            <strong>Tarimas:</strong> una fila por paquetería y estado, con peso desde 0 hasta 99999 y el precio <em>por tarima</em>; el cotizador lo multiplica por el número de tarimas.
          </p>
          <p className="muted">Los precios del ejemplo son solo ilustrativos. Si la primera fila trae encabezados, se omite sola.</p>
        </div>
        <ImportForm kind="rates" />
      </section>

      <section className="adm-panel card">
        <div className="adm-panel__head">
          <h2>Comerciantes del directorio</h2>
          <Link className="link-arrow" href="/admin/c/comerciantes">Ver comerciantes cargados</Link>
        </div>
        <div className="adm-import">
          <p className="muted">Una fila por comerciante, con estas columnas en este orden (solo el nombre es obligatorio):</p>
          <pre>{`nombre ; categoría ; estatus ; enlace de Facebook ; zona`}</pre>
          <p className="muted">
            <strong>Nombre:</strong> el del negocio o su nombre de Facebook. <strong>Categoría:</strong> si la dejas vacía se marca &quot;Variado&quot;.{' '}
            <strong>Estatus:</strong> activo, pendiente de renovación, baja o riesgo (vacío = activo). <strong>Enlace:</strong> su perfil de Facebook, que debe empezar con https://.
            Si un nombre ya existe, se actualiza en lugar de duplicarse. Puedes pegar cientos de filas de una vez.
          </p>
          <pre>{`Alaska León ; Saldos ; activo ; https://www.facebook.com/ejemplo ; Tijuana
Tienda Mary ; Belleza ; pendiente de renovación ; https://www.facebook.com/ejemplo2 ; Ensenada`}</pre>
          <p className="muted">No se publican teléfonos ni datos personales: solo el nombre, la categoría, el estatus y el enlace a su perfil público.</p>
        </div>
        <ImportForm kind="merchants" />
      </section>
    </>
  );
}
