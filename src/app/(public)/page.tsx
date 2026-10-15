import Link from 'next/link';
import { CarrierChips, ServiceLogo, TopNine } from '@/components/HomeBits';
import { Icon, type IconName } from '@/components/Icon';
import { LeadForm } from '@/components/LeadForm';
import { LxHero } from '@/components/LxHero';
import { LxTopBar } from '@/components/LxTopBar';
import { NewsFeatured, NewsItem, NewsMarquee } from '@/components/LxNews';
import { Motion } from '@/components/Motion';
import { QuoteTool } from '@/components/QuoteTool';
import { getSiteContent, type Service } from '@/lib/content';
import { getPublicMerchants } from '@/lib/directory';
import { dateParts, daysBetween, formatLongDate, formatTime, relativeDays } from '@/lib/format';
import { getLatestPost } from '@/lib/posts';
import { DEFAULT_QUOTE_SERVICES, SERVICE_SLUGS, splitCarriers } from '@/lib/quote';
import { getRates } from '@/lib/rates';
import { WEEKDAY_OPTIONS, pairLines, safeUrl, whatsappLink } from '@/lib/settings';

export const revalidate = 60;

const STATUS_LABEL: Record<Service['status'], string> = {
  active: 'Activo',
  limited: 'Limitado',
  paused: 'Pausado',
};

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/';
const HERO_VIDEO = `${CDN}hf_20260511_151648_2bdfbd1c-6bde-4f5d-a967-f57cbced97f6.mp4`;
const SERVICES_VIDEO = `${CDN}hf_20260514_154120_b89bfedd-530d-4ebb-9eb7-42eeafe08667.mp4`;

/** Fondos y recortes biselados de las tres tarjetas de indicadores. */
const STAT_STYLES = [
  {
    image: '/stats/envio-1.webp',
    clip: 'polygon(64px 0, calc(100% - 14px) 0, calc(100% - 4px) 4px, 100% 14px, 100% calc(100% - 14px), calc(100% - 4px) calc(100% - 4px), calc(100% - 14px) 100%, 14px 100%, 4px calc(100% - 4px), 0 calc(100% - 14px), 0 64px)',
    text: 'lx-stat__text--a',
  },
  {
    image: '/stats/envio-2.webp',
    clip: 'polygon(0 14px, 4px 4px, 14px 0, calc(100% - 64px) 0, 100% 64px, 100% calc(100% - 14px), calc(100% - 4px) calc(100% - 4px), calc(100% - 14px) 100%, 64px 100%, 0 calc(100% - 64px))',
    text: 'lx-stat__text--b',
  },
  {
    image: '/stats/envio-3.webp',
    clip: 'polygon(0 14px, 4px 4px, 14px 0, calc(100% - 64px) 0, 100% 64px, 100% calc(100% - 64px), calc(100% - 64px) 100%, 14px 100%, 4px calc(100% - 4px), 0 calc(100% - 14px))',
    text: 'lx-stat__text--c',
  },
];

const COMMUNITY_POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'users', title: 'Grupo de WhatsApp', text: 'Entérate de la ruta, los vendedores y las novedades en tiempo real.' },
  { icon: 'calendar', title: 'Recolección semanal', text: 'Día y horario fijos, publicados para que planees tus envíos.' },
  { icon: 'shieldcheck', title: 'Directorio verificado', text: 'Consulta el estatus de cada comerciante antes de pagar.' },
  { icon: 'whatsapp', title: 'Atención directa', text: 'Habla con una persona de nuestro equipo cuando lo necesites.' },
];

const RING_R = 70;
const RING_C = Math.round(2 * Math.PI * RING_R * 100) / 100;
const OP_TEXT = {
  ok: 'Operación normal · todos los servicios activos',
  warn: 'Operación con avisos · revisa los servicios marcados',
  bad: 'Hay servicios en pausa · consulta el detalle',
} as const;

function monthLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  const text = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1)));
  return (text.charAt(0).toUpperCase() + text.slice(1)).replace(' de ', ' ');
}

function SectionHead({ tag, title, id, left = false, light = false }: { tag: string; title: string; id: string; left?: boolean; light?: boolean }) {
  return (
    <Motion kind="blur" className={`lx-head ${left ? 'lx-head--left' : ''} ${light ? 'lx-head--light' : ''}`}>
      <p className="lx-head__tag">[{tag}]</p>
      <h2 id={id} className="lx-head__title">{title}</h2>
    </Motion>
  );
}

export default async function HomePage() {
  const [c, rates, merchants, post] = await Promise.all([getSiteContent(), getRates(), getPublicMerchants(), getLatestPost()]);
  const { settings: s } = c;
  const wa = whatsappLink(s);
  const waBase = wa.split('?')[0];

  const activeCount = c.services.filter((x) => x.status === 'active').length;
  const latest = c.announcements.slice(0, 3);

  const hasPaused = c.services.some((x) => x.status === 'paused');
  const hasLimited = c.services.some((x) => x.status === 'limited');
  const opState: 'ok' | 'warn' | 'bad' = hasPaused ? 'bad' : hasLimited ? 'warn' : 'ok';
  const ringSeg = Math.max(RING_C / Math.max(c.services.length, 1) - 10, 4);

  const half = Math.ceil(c.services.length / 2);
  const leftServices = c.services.slice(0, half);
  const rightServices = c.services.slice(half);

  const quoteServices = c.services.some((x) => SERVICE_SLUGS.includes(x.slug as never))
    ? c.services
        .filter((x) => SERVICE_SLUGS.includes(x.slug as never))
        .map((x) => ({ slug: x.slug, name: x.name, carriers: splitCarriers(x.carriers), coverage: x.coverage }))
    : DEFAULT_QUOTE_SERVICES;

  const activeMerchants = merchants.filter((m) => m.status === 'activo').length;
  const top = merchants.filter((m) => m.top_rank).sort((a, b) => (a.top_rank ?? 99) - (b.top_rank ?? 99)).slice(0, 9);
  const topLabel = s.top9_label || monthLabel(c.today);

  const steps = pairLines(s.how_steps);
  const schedule = pairLines(s.schedule_rows);
  const weekdayName = WEEKDAY_OPTIONS.find((o) => o.value === s.pickup_weekday)?.label ?? 'Viernes';
  const pickupWindow = `${formatTime(s.pickup_start)} a ${formatTime(s.pickup_end)}`;

  const extendedFee = Number(s.extended_zone_fee) > 0 ? Number(s.extended_zone_fee) : 0;
  const group = safeUrl(s.whatsapp_group_url);
  const fb = safeUrl(s.facebook_url);
  const tt = safeUrl(s.tiktok_url);

  const quick: { href: string; icon: IconName; label: string; sub: string }[] = [
    { href: '/cotizar', icon: 'calc', label: 'Cotizar envío', sub: 'Precio al instante' },
    { href: '/rastreo', icon: 'search', label: 'Rastrear guía', sub: 'Todas las paqueterías' },
    { href: '/comerciantes', icon: 'store', label: 'Comerciantes', sub: merchants.length ? `${activeMerchants} activos` : 'Directorio' },
    { href: '/ruta-del-saldo', icon: 'route', label: 'La Ruta del Saldo', sub: 'Únete al grupo' },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: s.brand_name,
    alternateName: s.brand_legal || undefined,
    description: `${s.brand_name} ${s.brand_tagline}`,
    url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    logo: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/logo.png` : undefined,
    telephone: s.whatsapp_number ? `+${s.whatsapp_number.replace(/\D/g, '')}` : undefined,
    email: s.contact_email || undefined,
    address: { '@type': 'PostalAddress', addressLocality: 'Tijuana', addressRegion: 'Baja California', addressCountry: 'MX' },
    areaServed: { '@type': 'Country', name: 'México' },
  };

  const serviceCard = (sv: Service, i: number) => (
    <Motion key={sv.id} delay={i * 120} className="lx-chamfer lx-service" style={{ ['--c' as string]: '16px' }}>
      <div className="lx-chamfer__in lx-service__in">
        <ServiceLogo sv={sv} size={72} className="lx-service__media" />
        <div className="lx-service__body">
          <h3>{sv.name}</h3>
          {sv.description && <p>{sv.description}</p>}
          <CarrierChips carriers={sv.carriers} />
          <div className="lx-service__meta">
            {sv.coverage && (
              <span className="lx-pill"><Icon name="pin" size={13} /> {sv.coverage}</span>
            )}
            {sv.eta_text && (
              <span className="lx-pill"><Icon name="clock" size={13} /> {sv.eta_text}</span>
            )}
            <span className={`lx-pill lx-pill--${sv.status}`}>
              <span className="lx-pill__dot" /> {STATUS_LABEL[sv.status]}
            </span>
          </div>
          {sv.status_note && <p className="lx-service__note">{sv.status_note}</p>}
          <Link className="lx-link" href={sv.slug ? `/cotizar?servicio=${sv.slug}` : '/cotizar'}>
            Cotizar este servicio <Icon name="arrow" size={14} />
          </Link>
        </div>
      </div>
    </Motion>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {/* ── 01 · Portada ──────────────────────────────────── */}
      <section id="inicio" data-lx-section className="lx-hero" aria-label="Portada">
        <video className="lx-hero__video" autoPlay loop muted playsInline preload="auto" aria-hidden="true" tabIndex={-1}>
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="lx-hero__shade" aria-hidden="true" />
        <LxTopBar settings={s} />
        <div className="lx-hero__center">
          <div className="lx-hero__stack">
            {s.location_badge && (
              <p className="lx-hero__badge"><Icon name="pin" size={13} /> {s.location_badge}</p>
            )}
            <LxHero slides={c.slides} whatsappHref={wa} />
            <ul className="lx-quick" aria-label="Accesos rápidos">
              {quick.map((q) => (
                <li key={q.href}>
                  <Link href={q.href} className="lx-quick__item">
                    <span className="lx-quick__icon"><Icon name={q.icon} size={18} /></span>
                    <span className="lx-quick__txt">
                      <strong>{q.label}</strong>
                      <small>{q.sub}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 02 · Servicios ────────────────────────────────── */}
      <section id="servicios" data-lx-section className="lx-sec lx-sec--a" aria-labelledby="servicios-title">
        <div className="lx-services">
          <div className="lx-services__center">
            <SectionHead tag="servicios" title="Servicios" id="servicios-title" />
            <Motion kind="blur" delay={150} className="lx-services__lead">
              <p>Elige cómo viaja tu mercancía. La paquetería se asigna según disponibilidad del destino.</p>
            </Motion>
            <Motion kind="blur" delay={200} className="lx-square">
              <video autoPlay loop muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1}>
                <source src={SERVICES_VIDEO} type="video/mp4" />
              </video>
            </Motion>
          </div>
          <div className="lx-services__col lx-services__col--l">{leftServices.map((sv, i) => serviceCard(sv, i))}</div>
          <div className="lx-services__col lx-services__col--r">{rightServices.map((sv, i) => serviceCard(sv, i))}</div>
        </div>
        <div className="lx-fade lx-fade--b" aria-hidden="true" />
      </section>

      {/* ── 03 · Quiénes somos + indicadores ──────────────── */}
      <section id="indicadores" data-lx-section className="lx-sec lx-sec--b" aria-labelledby="indicadores-title">
        <div className="lx-wrap">
          <div className="lx-about">
            <Motion kind="blur">
              <h2 id="indicadores-title" className="lx-big">
                {s.brand_name}
                <br />
                <span className="lx-big__accent">{s.brand_tagline}</span>
              </h2>
              {s.owner_names && <p className="lx-big__names">{s.owner_names}</p>}
            </Motion>
            <Motion kind="blur" delay={150} className="lx-about__copy">
              {s.footer_quote && <p>{s.footer_quote}</p>}
              {s.route_text && <p>{s.route_text}</p>}
              <a className="lx-arrowlink" href={wa} target="_blank" rel="noopener noreferrer">
                Hablar con el equipo
                <span className="lx-arrowbox"><Icon name="arrow" size={14} /></span>
              </a>
            </Motion>
          </div>

          {c.stats.length > 0 && (
            <div className="lx-stats">
              {c.stats.map((st, i) => {
                const style = STAT_STYLES[i % STAT_STYLES.length];
                return (
                  <Motion key={st.id} delay={i * 200} className={`lx-stat ${i % 3 === 1 ? 'lx-stat--offset' : ''}`}>
                    <div className="lx-stat__outer" style={{ clipPath: style.clip }}>
                      <div
                        className="lx-stat__img"
                        style={{ clipPath: style.clip, backgroundImage: `url("${style.image}")` }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className={`lx-stat__text ${style.text}`}>
                      <span className="lx-stat__value">{st.value}</span>
                      <span className="lx-stat__label">
                        <strong>{st.label}</strong>
                        {st.caption && <> · {st.caption}</>}
                      </span>
                    </div>
                  </Motion>
                );
              })}
            </div>
          )}
        </div>
        <div className="lx-fade lx-fade--b" aria-hidden="true" />
      </section>

      {/* ── 04 · Cotizador ────────────────────────────────── */}
      <section id="cotizar" data-lx-section className="lx-sec lx-sec--a" aria-labelledby="cotizar-title">
        <div className="lx-wrap">
          <SectionHead tag="cotizador" title="Cotiza tu envío" id="cotizar-title" />
          <div className="lx-quotegrid">
            <Motion className="lx-quotegrid__info">
              <h3>Así de fácil</h3>
              <ol className="lx-howto">
                <li><span>1</span><div><strong>Elige el servicio</strong><p>Aéreo, terrestre, Bajapack o gran volumen en tarimas.</p></div></li>
                <li><span>2</span><div><strong>Indica destino y peso</strong><p>Con el tabulador te mostramos el precio estimado al instante.</p></div></li>
                <li><span>3</span><div><strong>Confírmalo por WhatsApp</strong><p>Te llega el mensaje ya armado; nosotros coordinamos tu recolección.</p></div></li>
              </ol>
              <div className="lx-quotegrid__pick">
                <Icon name="calendar" size={18} />
                <p>Recolección cada <strong>{weekdayName.toLowerCase()}</strong> de {pickupWindow}.</p>
              </div>
              <Link className="lx-arrowlink" href="/cotizar">
                Ver el tabulador completo
                <span className="lx-arrowbox"><Icon name="arrow" size={14} /></span>
              </Link>
            </Motion>
            <Motion delay={150} className="lx-quotegrid__tool">
              <QuoteTool rates={rates} services={quoteServices} whatsappBase={waBase} brandName={s.brand_name} note={s.quote_note} extendedFee={extendedFee} extendedUrl={safeUrl(s.extended_zone_url) ?? ''} />
            </Motion>
          </div>
        </div>
        <div className="lx-fade lx-fade--a" aria-hidden="true" />
      </section>

      {/* ── 05 · Comerciantes y Top 9 ─────────────────────── */}
      <section id="comerciantes" data-lx-section className="lx-sec lx-sec--b" aria-labelledby="comerciantes-title">
        <div className="lx-wrap">
          <SectionHead tag="directorio" title="Comerciantes" id="comerciantes-title" />

          <div className="lx-dirhero">
            <Motion className="lx-dirhero__count lx-chamfer" style={{ ['--c' as string]: '22px' }}>
              <div className="lx-chamfer__in lx-dirhero__in">
                <span className="lx-dirhero__num">{merchants.length > 0 ? activeMerchants : '—'}</span>
                <span className="lx-dirhero__label">comerciantes activos</span>
                <p>Busca por nombre o categoría y consulta su estatus antes de pagar.</p>
                <form className="lx-dirhero__search" action="/comerciantes" role="search">
                  <Icon name="search" size={18} />
                  <input type="search" name="q" placeholder="Busca un comerciante…" aria-label="Buscar comerciante" maxLength={80} />
                  <button type="submit" className="lx-cta">Buscar</button>
                </form>
                <Link className="lx-arrowlink" href="/comerciantes">
                  Ver el directorio completo
                  <span className="lx-arrowbox"><Icon name="arrow" size={14} /></span>
                </Link>
              </div>
            </Motion>
            <Motion delay={120} className="lx-safety">
              <span className="lx-safety__icon"><Icon name="shieldcheck" size={22} /></span>
              <div>
                <strong>Compra con seguridad</strong>
                <p>Antes de pagar a cualquier vendedor, verifica en el directorio que su estatus sea <b>Activo</b>. Si ves <b>Renovación pendiente</b> o <b>Riesgo</b>, consúltanos primero.</p>
              </div>
            </Motion>
          </div>

          <TopNine items={top} label={topLabel} />
        </div>
        <div className="lx-fade lx-fade--b" aria-hidden="true" />
      </section>

      {/* ── 06 · ¿Cómo funciona? + calendario ─────────────── */}
      <section id="funciona" data-lx-section className="lx-sec lx-dark" aria-labelledby="funciona-title">
        <div className="lx-dark__glow" aria-hidden="true" />
        <div className="lx-wrap">
          <SectionHead tag="así trabajamos" title="¿Cómo funciona?" id="funciona-title" light />
          <ol className="lx-steps">
            {steps.map(([title, text], i) => (
              <Motion as="li" key={title} delay={i * 140} className="lx-step">
                <span className="lx-step__n">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Motion>
            ))}
          </ol>

          {schedule.length > 0 && (
            <Motion delay={150} className="lx-sched">
              <div className="lx-sched__head">
                <span className="lx-sched__tag">Calendario interno de pagos y salidas</span>
                <h3>{s.schedule_title}</h3>
                {s.schedule_intro && <p>{s.schedule_intro}</p>}
              </div>
              <ul className="lx-sched__rows">
                {schedule.map(([pay, out]) => (
                  <li key={pay}>
                    <span>{pay}</span>
                    <strong>{out}</strong>
                  </li>
                ))}
              </ul>
              <p className="lx-sched__foot">
                {s.schedule_note ? `${s.schedule_note} ` : ''}
                <strong>Recolección: solo los {weekdayName.toLowerCase()} de {pickupWindow}</strong>
              </p>
            </Motion>
          )}
        </div>
      </section>

      {/* ── 07 · Mensaje personal + misión y visión ───────── */}
      <section id="mensaje" data-lx-section className="lx-sec lx-sec--a" aria-labelledby="mensaje-title">
        <div className="lx-wrap">
          <SectionHead tag="de nuestra parte" title="Un mensaje para ti" id="mensaje-title" />
          <div className="lx-owner">
            <Motion className="lx-owner__photo lx-chamfer" style={{ ['--c' as string]: '28px' }}>
              <div className="lx-chamfer__in lx-owner__frame">
                {post?.photo_id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/media/${post.photo_id}`} alt={post.title} loading="lazy" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="lx-owner__logo" src="/logo.png" alt={`${s.brand_name} · ${s.brand_tagline}`} loading="lazy" />
                )}
              </div>
            </Motion>
            <Motion delay={150} className="lx-owner__text">
              <p className="lx-owner__who">{s.owner_names}{s.owner_role ? ` · ${s.owner_role}` : ''}</p>
              <h3>{post?.title ?? 'Gracias por confiar en nosotros'}</h3>
              <p className="lx-owner__body">
                {post?.body ?? 'Aquí compartiremos novedades, eventos y momentos de nuestro trabajo con la comunidad. Gracias por confiar en nosotros.'}
              </p>
              {post && (
                <p className="lx-owner__sign">
                  {post.author && <strong>{post.author}</strong>}
                  <span>{formatLongDate(post.published_on)}</span>
                </p>
              )}
            </Motion>
          </div>

          <div className="lx-mv">
            {[
              { icon: 'star' as IconName, title: 'Misión', text: s.mission_text },
              { icon: 'route' as IconName, title: 'Visión', text: s.vision_text },
            ]
              .filter((x) => x.text)
              .map((x, i) => (
                <Motion key={x.title} delay={i * 140} className="lx-chamfer" style={{ ['--c' as string]: '20px' }}>
                  <div className="lx-chamfer__in lx-mv__card">
                    <span className="lx-mv__icon"><Icon name={x.icon} size={20} /></span>
                    <h3>{x.title}</h3>
                    <p>{x.text}</p>
                  </div>
                </Motion>
              ))}
          </div>
        </div>
        <div className="lx-fade lx-fade--a" aria-hidden="true" />
      </section>

      {/* ── 08 · Estado operativo + recolecciones ─────────── */}
      <section id="estado" data-lx-section className="lx-sec lx-sec--b" aria-labelledby="estado-title">
        <div className="lx-wrap">
          <SectionHead tag="en tiempo real" title="Estado operativo" id="estado-title" />

          <Motion kind="blur" className="lx-live">
            <span className={`lx-live__dot lx-live__dot--${opState}`} aria-hidden="true" />
            <span>{OP_TEXT[opState]}</span>
          </Motion>

          <div className="lx-duo">
            <Motion className="lx-chamfer" style={{ ['--c' as string]: '24px' }}>
              <div className="lx-chamfer__in lx-panel lx-panel--ops">
                <div className="lx-ops__hero">
                  <div className="lx-ring" style={{ ['--C' as string]: RING_C }}>
                    <svg viewBox="0 0 180 180" aria-hidden="true">
                      <circle className="lx-ring__track" cx="90" cy="90" r={RING_R} />
                      {c.services.map((sv, i) => (
                        <circle
                          key={sv.id}
                          className={`lx-ring__seg lx-ring__seg--${sv.status}`}
                          cx="90"
                          cy="90"
                          r={RING_R}
                          style={{
                            ['--seg' as string]: ringSeg,
                            ['--off' as string]: -(i * (RING_C / Math.max(c.services.length, 1))),
                            transitionDelay: `${300 + i * 180}ms`,
                          }}
                        />
                      ))}
                    </svg>
                    <div className="lx-ring__center">
                      <strong>{activeCount}<small>/{c.services.length}</small></strong>
                      <span>activos</span>
                    </div>
                  </div>
                  <div className="lx-ops__intro">
                    <h3>Servicios</h3>
                    <p>Estado de cada servicio de envío.</p>
                    <span className="lx-ops__foot">Actualizado por el equipo</span>
                  </div>
                </div>

                <ul className="lx-svcgrid">
                  {c.services.map((sv, i) => (
                    <Motion as="li" key={sv.id} delay={200 + i * 100} className="lx-svc">
                      <ServiceLogo sv={sv} size={48} className="lx-svc__logo" />
                      <div className="lx-svc__info">
                        <strong>{sv.name}</strong>
                        <span>{sv.status_note || sv.coverage || sv.carriers}</span>
                      </div>
                      <span className={`lx-pill lx-pill--${sv.status} lx-pill--live`}>
                        <span className="lx-pill__dot" /> {STATUS_LABEL[sv.status]}
                      </span>
                    </Motion>
                  ))}
                </ul>
              </div>
            </Motion>

            <Motion delay={200} className="lx-chamfer" style={{ ['--c' as string]: '24px' }}>
              <div className="lx-chamfer__in lx-panel lx-panel--pick">
                <div className="lx-panel__top">
                  <div>
                    <h3>Próximas recolecciones</h3>
                    <p className="lx-panel__sub">Cada {weekdayName.toLowerCase()} · {pickupWindow}</p>
                  </div>
                  <a
                    className="lx-cta lx-cta--sm"
                    href={whatsappLink(s, `Hola ${s.brand_name}, quiero agendar una recolección.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Agendar <Icon name="arrow" size={13} />
                  </a>
                </div>
                {c.pickups.length === 0 ? (
                  <p className="lx-empty">Escríbenos por WhatsApp para coordinar tu recolección.</p>
                ) : (
                  <ol className="lx-tl">
                    {c.pickups.map((p, i) => {
                      const d = dateParts(p.pickup_date);
                      const diff = daysBetween(c.today, p.pickup_date);
                      return (
                        <Motion as="li" key={p.id} delay={250 + i * 120} className={`lx-tl__item ${i === 0 ? 'is-next' : ''}`}>
                          <span className="lx-tl__dot" aria-hidden="true" />
                          <div className="lx-tl__date">
                            <span>{d.month}</span>
                            <strong>{d.day}</strong>
                            <small>{d.weekday}</small>
                          </div>
                          <div className="lx-tl__info">
                            <div className="lx-tl__tags">
                              {i === 0 && <span className="lx-tl__next">Próxima</span>}
                              <span className="lx-tl__when">{relativeDays(diff)}</span>
                            </div>
                            <strong>{formatTime(p.start_time)} – {formatTime(p.end_time)}</strong>
                            <span>{p.note}</span>
                          </div>
                        </Motion>
                      );
                    })}
                  </ol>
                )}
                {s.address && (
                  <p className="lx-panel__foot lx-panel__foot--addr"><Icon name="pin" size={14} /> {s.address}</p>
                )}
              </div>
            </Motion>
          </div>
        </div>
        <div className="lx-fade lx-fade--b" aria-hidden="true" />
      </section>

      {/* ── 09 · Comunicados ──────────────────────────────── */}
      <section id="comunicados" data-lx-section className="lx-sec lx-sec--a" aria-labelledby="comunicados-title">
        <div className="lx-wrap">
          <SectionHead tag="avisos oficiales" title="Comunicados" id="comunicados-title" />
          {latest.length === 0 ? (
            <p className="lx-empty lx-empty--center">Aún no hay comunicados publicados.</p>
          ) : (
            <>
              <NewsMarquee items={c.announcements.slice(0, 6)} />
              <div className="lx-newsgrid">
                <NewsFeatured item={latest[0]} max={360} />
                <ul className="lx-news">
                  {latest.slice(1).map((a, i) => (
                    <NewsItem key={a.id} item={a} index={i} max={150} />
                  ))}
                  <li className="lx-news__more">
                    <Link className="lx-arrowlink" href="/comunicados">
                      Ver todos los comunicados
                      <span className="lx-arrowbox"><Icon name="arrow" size={14} /></span>
                    </Link>
                    <a className="lx-note-link" href={wa} target="_blank" rel="noopener noreferrer">
                      ¿Dudas? Escríbenos
                    </a>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
        <div className="lx-fade lx-fade--a" aria-hidden="true" />
      </section>

      {/* ── 10 · La Ruta del Saldo + comunidad ────────────── */}
      <section id="ruta" data-lx-section className="lx-sec lx-blue" aria-labelledby="ruta-title">
        <div className="lx-blue__glow lx-blue__glow--a" aria-hidden="true" />
        <div className="lx-blue__glow lx-blue__glow--b" aria-hidden="true" />
        <div className="lx-blue__grid" aria-hidden="true" />
        <div className="lx-wrap">
          <div className="lx-community">
            <div>
              <Motion kind="blur">
                <p className="lx-blue__tag">[la ruta del saldo]</p>
                <h2 id="ruta-title" className="lx-blue__title">{s.route_title}</h2>
                <p className="lx-blue__lead">{s.route_text}</p>
              </Motion>
              <Motion delay={150} className="lx-socials">
                {group && (
                  <a className="lx-cta lx-cta--wa" href={group} target="_blank" rel="noopener noreferrer">
                    <Icon name="users" size={16} /> Unirme al grupo de WhatsApp
                  </a>
                )}
                {fb && (
                  <a className="lx-cta lx-cta--ghost" href={fb} target="_blank" rel="noopener noreferrer">
                    <Icon name="facebook" size={16} /> Facebook
                  </a>
                )}
                {tt && (
                  <a className="lx-cta lx-cta--ghost" href={tt} target="_blank" rel="noopener noreferrer">
                    <Icon name="tiktok" size={16} /> TikTok
                  </a>
                )}
                <Link className="lx-cta lx-cta--ghost" href="/ruta-del-saldo#saldos">
                  Saldos con los que trabajamos <Icon name="arrow" size={14} />
                </Link>
              </Motion>
              <ul className="lx-points lx-points--blue">
                {COMMUNITY_POINTS.map((pt, i) => (
                  <Motion as="li" key={pt.title} delay={i * 120}>
                    <span className="lx-points__icon"><Icon name={pt.icon} size={18} /></span>
                    <div>
                      <strong>{pt.title}</strong>
                      <span>{pt.text}</span>
                    </div>
                  </Motion>
                ))}
              </ul>
            </div>
            <Motion delay={150} className="lx-formwrap">
              <div className="lx-formcard lx-formcard--blue">
                <div className="lx-formcard__bar">
                  <h3>{s.community_title}</h3>
                  <p>{s.community_text}</p>
                </div>
                <div className="lx-formcard__body">
                  <LeadForm whatsappHref={wa} />
                  <a className="lx-cta lx-cta--wa lx-cta--block" href={wa} target="_blank" rel="noopener noreferrer">
                    <Icon name="whatsapp" size={16} /> Hablar por WhatsApp
                  </a>
                </div>
              </div>
            </Motion>
          </div>
        </div>
      </section>
    </>
  );
}
