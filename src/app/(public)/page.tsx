import Image from 'next/image';
import Link from 'next/link';
import { HeroCarousel } from '@/components/HeroCarousel';
import { Icon, serviceIcon } from '@/components/Icon';
import { LeadForm } from '@/components/LeadForm';
import { Reveal } from '@/components/Reveal';
import { getSiteContent, type Service } from '@/lib/content';
import { dateParts, daysBetween, formatTime, relativeDays } from '@/lib/format';
import { whatsappLink } from '@/lib/settings';

export const revalidate = 60;

const STATUS_LABEL: Record<Service['status'], string> = {
  active: 'Activo',
  limited: 'Limitado',
  paused: 'Pausado',
};

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_064251_c78c4e3f-1d2f-485e-9ca4-56976efd496f.mp4';

const SERVICES_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261003_062910_04059e54-1a17-4d55-b1e3-028adec90dff.mp4';

/** Logo ilustrado por tipo de servicio (campo "icon"). Si el servicio usa otro ícono, se muestra el ícono de línea. */
const SERVICE_IMAGES: Record<string, string> = {
  plane: '/services/aereo.webp',
  truck: '/services/terrestre.webp',
  box: '/services/nacional.webp',
  mail: '/services/postal.webp',
};

const STAT_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_143605_bc7bd6c0-9c68-49ff-a9d3-073a10759fa4.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_145119_f4ec4d9f-3ecd-4116-baa3-26e8cf2df976.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_140728_ae719193-f10b-4105-82fc-c989610b3aa6.mp4',
];

const COMMUNITY_POINTS: { icon: 'megaphone' | 'calendar' | 'pulse' | 'whatsapp'; title: string; text: string }[] = [
  { icon: 'megaphone', title: 'Avisos oficiales', text: 'Comunicados claros sobre cambios, temporadas y novedades de operación.' },
  { icon: 'calendar', title: 'Calendario de recolecciones', text: 'Días y horarios publicados con anticipación para que planees tus envíos.' },
  { icon: 'pulse', title: 'Estado de cada servicio', text: 'Consulta qué servicios están activos y sus tiempos estimados de entrega.' },
  { icon: 'whatsapp', title: 'Atención directa', text: 'Habla con una persona del equipo por WhatsApp cuando lo necesites.' },
];

export default async function HomePage() {
  const c = await getSiteContent();
  const { settings: s } = c;
  const wa = whatsappLink(s);

  const activeCount = c.services.filter((x) => x.status === 'active').length;
  const latest = c.announcements.slice(0, 3);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: s.brand_name,
    alternateName: s.brand_legal || undefined,
    description: `${s.brand_name} ${s.brand_tagline}`,
    url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    logo: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/logo.png` : undefined,
    telephone: s.whatsapp_number ? `+${s.whatsapp_number.replace(/\D/g, '')}` : undefined,
    email: s.contact_email || undefined,
    areaServed: { '@type': 'Country', name: 'México' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {/* ── Portada ───────────────────────────────────────── */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__bg" aria-hidden="true">
          <video className="hero__video" autoPlay loop muted playsInline preload="auto" tabIndex={-1}>
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
          {Array.from({ length: 14 }, (_, i) => (
            <span key={i} className="ember" style={{ ['--i' as string]: i }} />
          ))}
        </div>
        <div className="container hero__inner">
          <div className="hero__copy" id="hero-title">
            <HeroCarousel slides={c.slides} whatsappHref={wa} />
          </div>
          <div className="hero__art" aria-hidden="true">
            <Image src="/logo.png" alt="" width={878} height={467} priority sizes="(max-width: 900px) 80vw, 520px" />
          </div>
        </div>
      </section>

      {/* ── Indicadores ───────────────────────────────────── */}
      {c.stats.length > 0 && (
        <section className="container stats-wrap" aria-label="Indicadores">
          <div className="stats">
            {c.stats.map((st, i) => (
              <Reveal key={st.id} delay={i * 200} className="stat">
                <video
                  className="stat__video"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <source src={STAT_VIDEOS[i % STAT_VIDEOS.length]} type="video/mp4" />
                </video>
                <span className={`stat__tint stat__tint--${i % 3}`} aria-hidden="true" />
                <div className="stat__body">
                  <span className="stat__value">{st.value}</span>
                  <span className="stat__label">{st.label}</span>
                  {st.caption && <span className="stat__caption">{st.caption}</span>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Servicios ─────────────────────────────────────── */}
      <section id="servicios" className="services-band" aria-labelledby="servicios-title">
        <video
          className="services-band__video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={SERVICES_VIDEO} type="video/mp4" />
        </video>
        <div className="container services-band__inner">
        <Reveal className="section__head">
          <span className="ornament"><i /> <b>Servicios que conectan a México</b> <i /></span>
          <h2 id="servicios-title" className="section__title">Elige cómo viaja tu mercancía</h2>
        </Reveal>
        <div className="grid grid--services">
          {c.services.map((sv, i) => (
            <Reveal key={sv.id} delay={i * 70} className="card service">
              {SERVICE_IMAGES[sv.icon] ? (
                <span className="service__media">
                  <Image src={SERVICE_IMAGES[sv.icon]} alt="" width={112} height={112} sizes="112px" />
                </span>
              ) : (
                <span className="service__icon"><Icon name={serviceIcon(sv.icon)} size={26} /></span>
              )}
              <h3>{sv.name}</h3>
              {sv.description && <p>{sv.description}</p>}
              <div className="service__meta">
                {sv.eta_text && (
                  <span className="pill"><Icon name="clock" size={14} /> {sv.eta_text}</span>
                )}
                <span className={`pill pill--${sv.status}`}>
                  <span className="pill__dot" /> {STATUS_LABEL[sv.status]}
                </span>
              </div>
              {sv.status_note && <p className="service__note">{sv.status_note}</p>}
              <a
                className="link-arrow"
                href={whatsappLink(s, `Hola ${s.brand_name}, quiero cotizar un envío por ${sv.name.toLowerCase()}.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Cotizar este servicio <Icon name="arrow" size={15} />
              </a>
            </Reveal>
          ))}
        </div>
        </div>
      </section>

      {/* ── Estado operativo + recolecciones ──────────────── */}
      <section id="estado" className="estado-band">
        <div className="container">
        <div className="grid grid--duo">
          <Reveal className="card panel">
            <p className="eyebrow"><span className="eyebrow__gem" aria-hidden="true" />En tiempo real</p>
            <div className="panel__head">
              <h2>Estado operativo</h2>
            </div>
            <div className="op-summary">
              <span className="op-summary__num">{activeCount}<small>/{c.services.length}</small></span>
              <span className="op-summary__label">Servicios activos</span>
            </div>
            <div className="op-bars" aria-hidden="true">
              {c.services.map((sv) => (
                <span key={sv.id} className={`op-bar op-bar--${sv.status}`} />
              ))}
            </div>
            <ul className="op-list">
              {c.services.map((sv) => (
                <li key={sv.id}>
                  <div>
                    <strong>{sv.name}</strong>
                    <span>{sv.status_note || sv.eta_text}</span>
                  </div>
                  <span className={`pill pill--${sv.status}`}>
                    <span className="pill__dot" /> {STATUS_LABEL[sv.status]}
                  </span>
                </li>
              ))}
            </ul>
            <p className="panel__foot">Tiempos estimados en días hábiles.</p>
          </Reveal>

          <Reveal className="card panel" delay={90}>
            <p className="eyebrow"><span className="eyebrow__gem" aria-hidden="true" />Calendario</p>
            <div className="panel__head">
              <h2>Próximas recolecciones</h2>
              <a
                className="link-arrow"
                href={whatsappLink(s, `Hola ${s.brand_name}, quiero agendar una recolección.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Agendar <Icon name="arrow" size={15} />
              </a>
            </div>
            {c.pickups.length === 0 ? (
              <p className="empty">Pronto publicaremos las próximas fechas. Escríbenos por WhatsApp para coordinar tu recolección.</p>
            ) : (
              <ul className="tickets">
                {c.pickups.map((p) => {
                  const d = dateParts(p.pickup_date);
                  const diff = daysBetween(c.today, p.pickup_date);
                  return (
                    <li key={p.id} className="ticket">
                      <div className="ticket__date">
                        <span className="ticket__month">{d.month}</span>
                        <span className="ticket__day">{d.day}</span>
                        <span className="ticket__weekday">{d.weekday}</span>
                      </div>
                      <div className="ticket__info">
                        <span className="pill pill--soft">{relativeDays(diff)}</span>
                        <strong>{formatTime(p.start_time)} – {formatTime(p.end_time)}</strong>
                        <span>{p.note}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {s.address && (
              <p className="panel__foot panel__foot--addr"><Icon name="pin" size={15} /> {s.address}</p>
            )}
          </Reveal>
        </div>
        </div>
      </section>

      {/* ── Comunicados ───────────────────────────────────── */}
      <section id="comunicados" className="section container">
        <Reveal className="card panel panel--wide">
          <p className="eyebrow"><span className="eyebrow__gem" aria-hidden="true" />Avisos oficiales</p>
          <div className="panel__head">
            <h2>Comunicados</h2>
            <Link className="link-arrow" href="/comunicados">Ver todos <Icon name="arrow" size={15} /></Link>
          </div>
          {latest.length === 0 ? (
            <p className="empty">Aún no hay comunicados publicados.</p>
          ) : (
            <ul className="news">
              {latest.map((a, i) => {
                const d = dateParts(a.published_on);
                return (
                  <li key={a.id} className="news__item">
                    <div className="datebox" aria-hidden="true">
                      <strong>{d.day}</strong>
                      <span>{d.month}</span>
                      <small>{d.year}</small>
                    </div>
                    <div className="news__body">
                      <div className="news__tags">
                        <span className="pill pill--outline">{a.category}</span>
                        {i === 0 && <span className="news__latest">Más reciente</span>}
                      </div>
                      <h3>{a.title}</h3>
                      <p>{a.body.length > 190 ? `${a.body.slice(0, 190).trimEnd()}…` : a.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="panel__foot">
            ¿Dudas sobre un comunicado?{' '}
            <a href={whatsappLink(s)} target="_blank" rel="noopener noreferrer">Escríbenos</a>
          </p>
        </Reveal>
      </section>

      {/* ── Comunidad + formulario ────────────────────────── */}
      <section id="comunidad" className="section container">
        <div className="community">
          <Reveal className="community__copy">
            <p className="eyebrow"><span className="eyebrow__gem" aria-hidden="true" />{s.community_eyebrow}</p>
            <h2 className="section__title section__title--left">{s.community_title}</h2>
            <p className="lead">{s.community_text}</p>
            <ul className="points">
              {COMMUNITY_POINTS.map((pt) => (
                <li key={pt.title}>
                  <span className="points__icon"><Icon name={pt.icon} size={20} /></span>
                  <div>
                    <strong>{pt.title}</strong>
                    <span>{pt.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="card form-card" delay={100}>
            <h3>Únete a la comunidad</h3>
            <p className="form-card__sub">Déjanos tus datos y te contactamos. También puedes escribirnos directo.</p>
            <LeadForm whatsappHref={wa} />
            <a className="btn btn--wa btn--block form-card__wa" href={wa} target="_blank" rel="noopener noreferrer">
              <Icon name="whatsapp" size={18} /> Hablar por WhatsApp
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
