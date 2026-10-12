import Image from 'next/image';
import Link from 'next/link';
import { Icon, serviceIcon } from '@/components/Icon';
import { LeadForm } from '@/components/LeadForm';
import { LxHero } from '@/components/LxHero';
import { LxTopBar } from '@/components/LxTopBar';
import { Motion } from '@/components/Motion';
import { getSiteContent, type Service } from '@/lib/content';
import { dateParts, daysBetween, formatTime, relativeDays } from '@/lib/format';
import { whatsappLink } from '@/lib/settings';

export const revalidate = 60;

const STATUS_LABEL: Record<Service['status'], string> = {
  active: 'Activo',
  limited: 'Limitado',
  paused: 'Pausado',
};

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/';
const HERO_VIDEO = `${CDN}hf_20260511_151648_2bdfbd1c-6bde-4f5d-a967-f57cbced97f6.mp4`;
const SERVICES_VIDEO = `${CDN}hf_20260514_154120_b89bfedd-530d-4ebb-9eb7-42eeafe08667.mp4`;

const statImage = (file: string) =>
  `https://images.higgs.ai/?default=1&output=webp&url=${encodeURIComponent(`${CDN}${file}`)}&w=1280&q=85`;

/** Fondos y recortes biselados de las tres tarjetas de indicadores. */
const STAT_STYLES = [
  {
    image: statImage('hf_20260514_154203_6c6f94dc-a07e-4ba5-8688-106f01ccd2c8.png'),
    clip: 'polygon(64px 0, calc(100% - 14px) 0, calc(100% - 4px) 4px, 100% 14px, 100% calc(100% - 14px), calc(100% - 4px) calc(100% - 4px), calc(100% - 14px) 100%, 14px 100%, 4px calc(100% - 4px), 0 calc(100% - 14px), 0 64px)',
    text: 'lx-stat__text--a',
  },
  {
    image: statImage('hf_20260514_154151_45c62c60-3bcc-4f21-8f9d-03722ebb5df8.png'),
    clip: 'polygon(0 14px, 4px 4px, 14px 0, calc(100% - 64px) 0, 100% 64px, 100% calc(100% - 14px), calc(100% - 4px) calc(100% - 4px), calc(100% - 14px) 100%, 64px 100%, 0 calc(100% - 64px))',
    text: 'lx-stat__text--b',
  },
  {
    image: statImage('hf_20260514_152238_24ec8db4-d728-4739-bb30-e985533e9637.png'),
    clip: 'polygon(0 14px, 4px 4px, 14px 0, calc(100% - 64px) 0, 100% 64px, 100% calc(100% - 64px), calc(100% - 64px) 100%, 14px 100%, 4px calc(100% - 4px), 0 calc(100% - 14px))',
    text: 'lx-stat__text--c',
  },
];

/** Logo ilustrado por tipo de servicio (campo "icon"). Si el servicio usa otro ícono, se muestra el ícono de línea. */
const SERVICE_IMAGES: Record<string, string> = {
  plane: '/services/aereo.webp',
  truck: '/services/terrestre.webp',
  box: '/services/nacional.webp',
  mail: '/services/postal.webp',
};

const COMMUNITY_POINTS: { icon: 'megaphone' | 'calendar' | 'pulse' | 'whatsapp'; title: string; text: string }[] = [
  { icon: 'megaphone', title: 'Avisos oficiales', text: 'Comunicados claros sobre cambios, temporadas y novedades de operación.' },
  { icon: 'calendar', title: 'Calendario de recolecciones', text: 'Días y horarios publicados con anticipación para que planees tus envíos.' },
  { icon: 'pulse', title: 'Estado de cada servicio', text: 'Consulta qué servicios están activos y sus tiempos estimados de entrega.' },
  { icon: 'whatsapp', title: 'Atención directa', text: 'Habla con una persona del equipo por WhatsApp cuando lo necesites.' },
];

function SectionHead({ tag, title, id, left = false }: { tag: string; title: string; id: string; left?: boolean }) {
  return (
    <Motion kind="blur" className={`lx-head ${left ? 'lx-head--left' : ''}`}>
      <p className="lx-head__tag">[{tag}]</p>
      <h2 id={id} className="lx-head__title">{title}</h2>
    </Motion>
  );
}

export default async function HomePage() {
  const c = await getSiteContent();
  const { settings: s } = c;
  const wa = whatsappLink(s);

  const activeCount = c.services.filter((x) => x.status === 'active').length;
  const latest = c.announcements.slice(0, 3);

  const half = Math.ceil(c.services.length / 2);
  const leftServices = c.services.slice(0, half);
  const rightServices = c.services.slice(half);

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

  const serviceCard = (sv: Service, i: number) => (
    <Motion key={sv.id} delay={i * 120} className="lx-chamfer lx-service" style={{ ['--c' as string]: '16px' }}>
      <div className="lx-chamfer__in lx-service__in">
        {SERVICE_IMAGES[sv.icon] ? (
          <span className="lx-service__media">
            <Image src={SERVICE_IMAGES[sv.icon]} alt="" width={112} height={112} sizes="72px" />
          </span>
        ) : (
          <span className="lx-service__media lx-service__media--icon"><Icon name={serviceIcon(sv.icon)} size={28} /></span>
        )}
        <div className="lx-service__body">
          <h3>{sv.name}</h3>
          {sv.description && <p>{sv.description}</p>}
          <div className="lx-service__meta">
            {sv.eta_text && (
              <span className="lx-pill"><Icon name="clock" size={13} /> {sv.eta_text}</span>
            )}
            <span className={`lx-pill lx-pill--${sv.status}`}>
              <span className="lx-pill__dot" /> {STATUS_LABEL[sv.status]}
            </span>
          </div>
          {sv.status_note && <p className="lx-service__note">{sv.status_note}</p>}
          <a
            className="lx-link"
            href={whatsappLink(s, `Hola ${s.brand_name}, quiero cotizar un envío por ${sv.name.toLowerCase()}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cotizar este servicio <Icon name="arrow" size={14} />
          </a>
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
          <LxHero slides={c.slides} whatsappHref={wa} />
        </div>
      </section>

      {/* ── 02 · Servicios ────────────────────────────────── */}
      <section id="servicios" data-lx-section className="lx-sec lx-sec--a" aria-labelledby="servicios-title">
        <div className="lx-services">
          <div className="lx-services__center">
            <SectionHead tag="servicios" title="Servicios" id="servicios-title" />
            <Motion kind="blur" delay={150} className="lx-services__lead">
              <p>Elige cómo viaja tu mercancía a todo México.</p>
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

      {/* ── 03 · Indicadores ──────────────────────────────── */}
      <section id="indicadores" data-lx-section className="lx-sec lx-sec--b" aria-labelledby="indicadores-title">
        <div className="lx-wrap">
          <div className="lx-about">
            <Motion kind="blur">
              <h2 id="indicadores-title" className="lx-big">
                {s.brand_name}
                <br />
                {s.brand_tagline}
              </h2>
            </Motion>
            <Motion kind="blur" delay={150} className="lx-about__copy">
              {s.footer_quote && <p>{s.footer_quote}</p>}
              {s.community_text && <p>{s.community_text}</p>}
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
                  <Motion
                    key={st.id}
                    delay={i * 200}
                    className={`lx-stat ${i % 3 === 1 ? 'lx-stat--offset' : ''}`}
                  >
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

      {/* ── 04 · Estado operativo + recolecciones ─────────── */}
      <section id="estado" data-lx-section className="lx-sec lx-sec--a" aria-labelledby="estado-title">
        <div className="lx-wrap">
          <SectionHead tag="en tiempo real" title="Estado operativo" id="estado-title" />
          <div className="lx-duo">
            <Motion className="lx-chamfer" style={{ ['--c' as string]: '20px' }}>
              <div className="lx-chamfer__in lx-panel">
                <div className="lx-panel__top">
                  <h3>Servicios</h3>
                  <div className="lx-op">
                    <span className="lx-op__num">{activeCount}<small>/{c.services.length}</small></span>
                    <span className="lx-op__label">activos</span>
                  </div>
                </div>
                <div className="lx-bars" aria-hidden="true">
                  {c.services.map((sv) => (
                    <span key={sv.id} className={`lx-bar lx-bar--${sv.status}`} />
                  ))}
                </div>
                <ul className="lx-oplist">
                  {c.services.map((sv) => (
                    <li key={sv.id}>
                      <div>
                        <strong>{sv.name}</strong>
                        <span>{sv.status_note || sv.eta_text}</span>
                      </div>
                      <span className={`lx-pill lx-pill--${sv.status}`}>
                        <span className="lx-pill__dot" /> {STATUS_LABEL[sv.status]}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="lx-panel__foot">Tiempos estimados en días hábiles.</p>
              </div>
            </Motion>

            <Motion delay={200} className="lx-chamfer" style={{ ['--c' as string]: '20px' }}>
              <div className="lx-chamfer__in lx-panel">
                <div className="lx-panel__top">
                  <h3>Próximas recolecciones</h3>
                  <a
                    className="lx-link"
                    href={whatsappLink(s, `Hola ${s.brand_name}, quiero agendar una recolección.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Agendar <Icon name="arrow" size={14} />
                  </a>
                </div>
                {c.pickups.length === 0 ? (
                  <p className="lx-empty">Pronto publicaremos las próximas fechas. Escríbenos por WhatsApp para coordinar tu recolección.</p>
                ) : (
                  <ul className="lx-tickets">
                    {c.pickups.map((p) => {
                      const d = dateParts(p.pickup_date);
                      const diff = daysBetween(c.today, p.pickup_date);
                      return (
                        <li key={p.id}>
                          <div className="lx-date">
                            <span>{d.month}</span>
                            <strong>{d.day}</strong>
                            <small>{d.weekday}</small>
                          </div>
                          <div className="lx-tickets__info">
                            <span className="lx-pill">{relativeDays(diff)}</span>
                            <strong>{formatTime(p.start_time)} – {formatTime(p.end_time)}</strong>
                            <span>{p.note}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
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

      {/* ── 05 · Comunicados ──────────────────────────────── */}
      <section id="comunicados" data-lx-section className="lx-sec lx-sec--b" aria-labelledby="comunicados-title">
        <div className="lx-wrap lx-wrap--narrow">
          <SectionHead tag="avisos oficiales" title="Comunicados" id="comunicados-title" />
          {latest.length === 0 ? (
            <p className="lx-empty lx-empty--center">Aún no hay comunicados publicados.</p>
          ) : (
            <ul className="lx-news">
              {latest.map((a, i) => {
                const d = dateParts(a.published_on);
                return (
                  <Motion as="li" key={a.id} delay={i * 150} className="lx-chamfer" style={{ ['--c' as string]: '16px' }}>
                    <div className="lx-chamfer__in lx-newsitem">
                      <div className="lx-date" aria-hidden="true">
                        <strong>{d.day}</strong>
                        <span>{d.month}</span>
                        <small>{d.year}</small>
                      </div>
                      <div className="lx-newsitem__body">
                        <div className="lx-newsitem__tags">
                          <span className="lx-pill">{a.category}</span>
                          {i === 0 && <span className="lx-latest">Más reciente</span>}
                        </div>
                        <h3>{a.title}</h3>
                        <p>{a.body.length > 190 ? `${a.body.slice(0, 190).trimEnd()}…` : a.body}</p>
                      </div>
                    </div>
                  </Motion>
                );
              })}
            </ul>
          )}
          <div className="lx-center-actions">
            <Link className="lx-arrowlink" href="/comunicados">
              Ver todos los comunicados
              <span className="lx-arrowbox"><Icon name="arrow" size={14} /></span>
            </Link>
          </div>
          <p className="lx-note">
            ¿Dudas sobre un comunicado?{' '}
            <a href={wa} target="_blank" rel="noopener noreferrer">Escríbenos</a>
          </p>
        </div>
        <div className="lx-fade lx-fade--a" aria-hidden="true" />
      </section>

      {/* ── 06 · Comunidad + formulario ───────────────────── */}
      <section id="comunidad" data-lx-section className="lx-sec lx-sec--a" aria-labelledby="comunidad-title">
        <div className="lx-wrap">
          <div className="lx-community">
            <div>
              <Motion kind="blur">
                <p className="lx-head__tag lx-head__tag--left">[{s.community_eyebrow.toLowerCase()}]</p>
                <h2 id="comunidad-title" className="lx-big lx-big--sm">{s.community_title}</h2>
              </Motion>
              <ul className="lx-points">
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
            <Motion delay={150} className="lx-chamfer" style={{ ['--c' as string]: '24px' }}>
              <div className="lx-chamfer__in lx-formcard">
                <h3>Únete a la comunidad</h3>
                <p className="lx-formcard__sub">Déjanos tus datos y te contactamos. También puedes escribirnos directo.</p>
                <LeadForm whatsappHref={wa} />
                <a className="lx-cta lx-cta--wa lx-cta--block" href={wa} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={16} /> Hablar por WhatsApp
                </a>
              </div>
            </Motion>
          </div>
        </div>
      </section>
    </>
  );
}
