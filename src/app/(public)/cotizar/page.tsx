import type { Metadata } from 'next';
import { LxTopBar } from '@/components/LxTopBar';
import { Motion } from '@/components/Motion';
import { QuoteTool } from '@/components/QuoteTool';
import { getSiteContent } from '@/lib/content';
import { DEFAULT_QUOTE_SERVICES, SERVICE_LABEL, SERVICE_SLUGS, formatKg, formatMXN, splitCarriers } from '@/lib/quote';
import { getRates } from '@/lib/rates';
import { whatsappLink } from '@/lib/settings';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Cotizar envío',
  description: 'Cotiza tu envío aéreo, terrestre, Bajapack o en tarimas con el tabulador de precios.',
};

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ servicio?: string }> }) {
  const { servicio } = await searchParams;
  const [c, rates] = await Promise.all([getSiteContent(), getRates()]);
  const s = c.settings;
  const wa = whatsappLink(s);
  const services = c.services.some((x) => SERVICE_SLUGS.includes(x.slug as never))
    ? c.services
        .filter((x) => SERVICE_SLUGS.includes(x.slug as never))
        .map((x) => ({ slug: x.slug, name: x.name, carriers: splitCarriers(x.carriers), coverage: x.coverage }))
    : DEFAULT_QUOTE_SERVICES;

  const groups = new Map<string, typeof rates>();
  for (const r of rates) {
    const key = `${r.service_slug}|${r.carrier}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  return (
    <>
      <div className="lx-subhero"><LxTopBar settings={s} /></div>
      <section className="lx-page lx-page--wide">
        <div className="lx-page__inner lx-page__inner--wide">
          <Motion kind="blur" className="lx-head">
            <p className="lx-head__tag">[cotizador]</p>
            <h1 className="lx-head__title">Cotiza tu envío</h1>
          </Motion>
          <div className="lx-quotegrid">
            <div className="lx-quotegrid__info">
              <h3>Cómo cotizar</h3>
              <ol className="lx-howto">
                <li><span>1</span><div><strong>Elige el servicio</strong><p>Aéreo, terrestre, Bajapack o tarimas.</p></div></li>
                <li><span>2</span><div><strong>Paquetería, destino y peso</strong><p>El precio se calcula con nuestro tabulador.</p></div></li>
                <li><span>3</span><div><strong>Envía tu cotización por WhatsApp</strong><p>Confirmamos y coordinamos tu recolección.</p></div></li>
              </ol>
            </div>
            <div className="lx-quotegrid__tool">
              <QuoteTool rates={rates} services={services} whatsappBase={wa.split('?')[0]} brandName={s.brand_name} note={s.quote_note} initialSlug={servicio} />
            </div>
          </div>

          <h2 className="lx-sub">Tabulador de precios</h2>
          {rates.length === 0 ? (
            <p className="lx-empty lx-empty--center">
              Estamos cargando el tabulador. Mientras tanto,{' '}
              <a href={wa} target="_blank" rel="noopener noreferrer">cotiza por WhatsApp</a>.
            </p>
          ) : (
            <div className="lx-tabs">
              {[...groups.entries()].map(([key, list]) => {
                const [slug, carrier] = key.split('|');
                return (
                  <div key={key} className="lx-tab">
                    <h3>{SERVICE_LABEL[slug] ?? slug} · {carrier}</h3>
                    <div className="lx-tab__scroll">
                      <table>
                        <thead><tr><th>Destino</th><th>Peso</th><th>Precio</th></tr></thead>
                        <tbody>
                          {list.map((r, i) => (
                            <tr key={i}>
                              <td>{r.destination}</td>
                              <td>{r.weight_to > 0 ? `${formatKg(r.weight_from)} – ${formatKg(r.weight_to)}` : `Desde ${formatKg(r.weight_from)}`}</td>
                              <td>{formatMXN(r.price)}{r.price_type === 'per_kg' ? ' / kg' : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {s.quote_note && <p className="lx-note">{s.quote_note}</p>}
        </div>
      </section>
    </>
  );
}
