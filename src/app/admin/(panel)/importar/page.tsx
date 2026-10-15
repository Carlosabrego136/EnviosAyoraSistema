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
          <p className="muted">Una fila por comerciante, con estas columnas (solo el nombre es obligatorio):</p>
          <pre>{`nombre ; categoría ; estatus ; whatsapp ; zona ; descripción`}</pre>
          <p className="muted">
            <strong>Estatus:</strong> activo, inactivo, renovación pendiente o riesgo (si lo dejas vacío se marca como activo). Si un nombre ya existe, se actualiza en
            lugar de duplicarse. Todos se publican en el directorio; puedes ocultar uno editándolo.
          </p>
          <pre>{`Bazar La Esperanza ; Ropa ; activo ; 6641234567 ; Tijuana
Tienda Mary ; Belleza ; renovación pendiente ; ; Ensenada`}</pre>
          <p className="muted">Antes de publicar sus datos de contacto, confirma que cada comerciante lo autorizó.</p>
        </div>
        <ImportForm kind="merchants" />
      </section>
    </>
  );
}
