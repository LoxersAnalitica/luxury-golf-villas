import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import { content, crmLabels } from './content.js'

/* ------------------------------------------------------------------ *
 * Iconos
 * ------------------------------------------------------------------ */
const Ico = {
  arrow: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M1 7h12M8 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrowL: (p) => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M13 7H1M6 2L1 7l5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  close: (p) => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
      <path d="M1 1l13 13M14 1L1 14" strokeLinecap="round" />
    </svg>
  ),
  check: (p) => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M1 5.6L4 8.6 10 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  tick: (p) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.2" {...p}>
      <path d="M3 13.5l6 6L23 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  lock: (p) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" {...p}>
      <rect x="1.5" y="5" width="9" height="6" rx="1.2" />
      <path d="M3.6 5V3.4a2.4 2.4 0 0 1 4.8 0V5" />
    </svg>
  ),
  doc: (p) => (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" {...p}>
      <path d="M10.5 1.5H4.5A1.5 1.5 0 0 0 3 3v12a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 15 15V6l-4.5-4.5z" strokeLinejoin="round" />
      <path d="M10.5 1.5V6H15" strokeLinejoin="round" />
    </svg>
  ),
  dl: (p) => (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" {...p}>
      <path d="M9 2v9m0 0l3.4-3.4M9 11L5.6 7.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 12.5V14A1.5 1.5 0 0 0 4 15.5h10a1.5 1.5 0 0 0 1.5-1.5v-1.5" strokeLinecap="round" />
    </svg>
  ),
  clock: (p) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" {...p}>
      <circle cx="6" cy="6" r="5" />
      <path d="M6 3.2V6l2 1.3" strokeLinecap="round" />
    </svg>
  ),
  diamond: (p) => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" {...p}>
      <path d="M5 0l1.6 3.4L10 5 6.6 6.6 5 10 3.4 6.6 0 5l3.4-1.6z" />
    </svg>
  ),
}

/* ------------------------------------------------------------------ *
 * Utilidades
 * ------------------------------------------------------------------ */
const DOSSIER = '/docs/luxury-golf-dossier.pdf'
const PLANOS = '/docs/luxury-golf-planos.pdf'
const MEMORIA = '/docs/luxury-golf-memoria-calidades.pdf'

const MAPS_Q = encodeURIComponent('La Cala Golf, Mijas Costa, Málaga')
const MAPS_EMBED = `https://www.google.com/maps?q=${MAPS_Q}&z=13&output=embed`
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${MAPS_Q}`
const UNLOCK_KEY = 'lg_unlocked_v1'

const store = {
  get(k) { try { return window.localStorage.getItem(k) } catch { return null } },
  set(k, v) { try { window.localStorage.setItem(k, v) } catch { /* modo privado */ } },
}

function detectLang() {
  const q = new URLSearchParams(window.location.search).get('lang')
  if (q === 'es' || q === 'en') return q
  const saved = store.get('lg_lang')
  if (saved === 'es' || saved === 'en') return saved
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en'
}

const DEFAULT_COUNTRY = { es: 'ES', en: 'GB' }

/** Añade la clase .in a los elementos [data-reveal] al entrar en pantalla.
 *  El IntersectionObserver puede saltarse elementos en scrolls muy largos,
 *  así que se refuerza con una comprobación directa al hacer scroll. */
function useReveal(deps) {
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-reveal]:not(.in)')]
    if (!els.length) return
    const show = (el) => el.classList.add('in')

    if (!('IntersectionObserver' in window)) {
      els.forEach(show)
      return
    }

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { show(e.target); io.unobserve(e.target) }
      }),
      { rootMargin: '0px 0px -6% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))

    // Red de seguridad: el coste cae a cero según se van revelando elementos.
    const pending = new Set(els)
    const sweep = () => {
      const h = window.innerHeight
      pending.forEach((el) => {
        if (el.getBoundingClientRect().top < h * 0.94) { show(el); io.unobserve(el); pending.delete(el) }
      })
      if (!pending.size) window.removeEventListener('scroll', sweep)
    }

    window.addEventListener('scroll', sweep, { passive: true })
    sweep()

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', sweep)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}

/** Reproduce el vídeo solo mientras está en pantalla (ahorra batería y datos). */
function useVideoInView() {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return

    const sync = () => {
      const r = v.getBoundingClientRect()
      const visible = r.bottom > 0 && r.top < window.innerHeight
      if (visible === !v.paused) return
      if (visible) v.play?.().catch(() => {})
      else v.pause?.()
    }

    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    document.addEventListener('visibilitychange', sync)
    sync()

    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])
  return ref
}

const R = ({ as: Tag = 'div', d = 0, className = '', children, ...rest }) => (
  <Tag data-reveal className={className} style={{ '--d': `${d}ms` }} {...rest}>{children}</Tag>
)

/* ------------------------------------------------------------------ *
 * Formulario dinámico (una pregunta por pantalla)
 * ------------------------------------------------------------------ */
const STEPS = ['budget', 'location', 'timing', 'name', 'email', 'phone']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

function Wizard({ lang, t, interest, startDone, onClose, onDone }) {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(startDone)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [a, setA] = useState({ budget: '', location: '', timing: '', name: '', email: '', phone: '', consent: false })
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  const key = STEPS[step]
  const q = t.wizard.q[key]
  const isChoice = step < 3

  const set = (k, v) => { setA((s) => ({ ...s, [k]: v })); setErr('') }

  useEffect(() => {
    document.body.classList.add('locked')
    return () => document.body.classList.remove('locked')
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (!isChoice && !done) inputRef.current?.focus()
    panelRef.current?.scrollTo({ top: 0 })
  }, [step, isChoice, done])

  const validate = useCallback(() => {
    if (key === 'name' && a.name.trim().length < 2) return t.wizard.errors.name
    if (key === 'email' && !EMAIL_RE.test(a.email.trim())) return t.wizard.errors.email
    if (key === 'phone') {
      if (!a.phone || !isValidPhoneNumber(a.phone)) return t.wizard.errors.phone
      if (!a.consent) return t.wizard.errors.consent
    }
    return ''
  }, [key, a, t])

  const submit = useCallback(async () => {
    setSending(true)
    setErr('')
    const p = new URLSearchParams(window.location.search)
    const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid']
      .map((k) => (p.get(k) ? `${k}=${p.get(k)}` : null))
      .filter(Boolean)
      .join(' · ')

    try {
      const res = await fetch('/api/kommo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: a.name.trim(),
          email: a.email.trim(),
          phone: a.phone,
          budget: crmLabels.budget[a.budget] || '',
          location: crmLabels.location[a.location] || '',
          timing: crmLabels.timing[a.timing] || '',
          interest: interest || 'Dossier general',
          lang,
          utm,
          referrer: document.referrer || '',
          page: window.location.href,
        }),
      })
      if (!res.ok) throw new Error('bad response')
      setDone(true)
      onDone()
    } catch {
      setErr(t.wizard.errors.server)
    } finally {
      setSending(false)
    }
  }, [a, interest, lang, onDone, t])

  const next = useCallback(() => {
    const e = validate()
    if (e) return setErr(e)
    if (step === STEPS.length - 1) return submit()
    setStep((s) => s + 1)
  }, [validate, step, submit])

  // Elegir opción avanza sola, con un instante de feedback visual.
  const pick = (k, v) => {
    set(k, v)
    window.setTimeout(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 230)
  }

  const pct = done ? 100 : ((step + 1) / STEPS.length) * 100

  return (
    <div className="wiz" role="dialog" aria-modal="true" aria-label={t.wizard.intro}>
      <div className="wiz__bg" onClick={onClose} />
      <div className="wiz__panel" ref={panelRef}>
        <div className="wiz__bar"><i style={{ width: `${pct}%` }} /></div>
        <div className="wiz__head">
          <small>{t.wizard.intro}</small>
          <button className="wiz__close" onClick={onClose} aria-label={t.wizard.close}><Ico.close /></button>
        </div>

        {done ? (
          <div className="wiz__body">
            <div className="done-screen">
              <div className="tick"><Ico.tick /></div>
              <h3>{t.wizard.done.title}</h3>
              <p>{t.wizard.done.text}</p>
              <div className="dl">
                <a href={DOSSIER} download>
                  <Ico.doc /> {t.wizard.done.d1} <Ico.dl className="arr" />
                </a>
                <a href={PLANOS} download>
                  <Ico.doc /> {t.wizard.done.d2} <Ico.dl className="arr" />
                </a>
                <a href={MEMORIA} download>
                  <Ico.doc /> {t.wizard.done.d3} <Ico.dl className="arr" />
                </a>
              </div>
              <button className="wiz__back" style={{ marginTop: '2rem' }} onClick={onClose}>
                <Ico.arrowL /> {t.wizard.done.close}
              </button>
            </div>
          </div>
        ) : (
          <div className="wiz__body">
            <div key={step} className="wiz__anim">
              <span className="wiz__step">{t.wizard.step} {step + 1} {t.wizard.of} {STEPS.length}</span>
              <h2 className="wiz__q">{q.t}</h2>

              {isChoice && (
                <div className="opts">
                  {Object.entries(q.o).map(([val, label]) => (
                    <button
                      key={val}
                      className={`opt${a[key] === val ? ' sel' : ''}`}
                      onClick={() => pick(key, val)}
                    >
                      <i />{label}
                    </button>
                  ))}
                </div>
              )}

              {key === 'name' && (
                <div className="field">
                  <input
                    ref={inputRef} type="text" autoComplete="name" placeholder={q.ph}
                    value={a.name} onChange={(e) => set('name', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && next()}
                  />
                </div>
              )}

              {key === 'email' && (
                <div className="field">
                  <input
                    ref={inputRef} type="email" inputMode="email" autoComplete="email" placeholder={q.ph}
                    value={a.email} onChange={(e) => set('email', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && next()}
                  />
                </div>
              )}

              {key === 'phone' && (
                <div className="field">
                  <PhoneInput
                    ref={inputRef}
                    international
                    defaultCountry={DEFAULT_COUNTRY[lang]}
                    placeholder={q.ph}
                    value={a.phone}
                    onChange={(v) => set('phone', v || '')}
                    onKeyDown={(e) => e.key === 'Enter' && next()}
                  />
                  <span className="hint">{q.hint}</span>
                  <label className="consent">
                    <input type="checkbox" checked={a.consent} onChange={(e) => set('consent', e.target.checked)} />
                    <span className="box"><Ico.check /></span>
                    <span className="txt">
                      {t.wizard.consent}{' '}
                      <a href="https://alternativamalaga.com/politica-de-privacidad/" target="_blank" rel="noreferrer">
                        {t.footer.privacy}
                      </a>
                    </span>
                  </label>
                </div>
              )}

              {err && <span className="err">{err}</span>}

              <div className="wiz__nav">
                {step > 0 && (
                  <button className="wiz__back" onClick={() => { setStep((s) => s - 1); setErr('') }}>
                    <Ico.arrowL /> {t.wizard.back}
                  </button>
                )}
                {!isChoice && (
                  <button className="btn" onClick={next} disabled={sending}>
                    {sending ? t.wizard.sending : step === STEPS.length - 1 ? t.wizard.submit : t.wizard.next}
                    {!sending && <Ico.arrow className="arr" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Lightbox de galería
 * ------------------------------------------------------------------ */
function Lightbox({ items, i, onClose, onMove }) {
  useEffect(() => {
    document.body.classList.add('locked')
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onMove(1)
      if (e.key === 'ArrowLeft') onMove(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('locked') }
  }, [onClose, onMove])

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={items[i].src} alt={items[i].c} />
        <figcaption>{items[i].c}</figcaption>
      </figure>
      <button className="lb-btn lb-prev" onClick={(e) => { e.stopPropagation(); onMove(-1) }} aria-label="←"><Ico.arrowL /></button>
      <button className="lb-btn lb-next" onClick={(e) => { e.stopPropagation(); onMove(1) }} aria-label="→"><Ico.arrow /></button>
      <button className="lb-btn lb-close" onClick={onClose} aria-label="Close"><Ico.close /></button>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * App
 * ------------------------------------------------------------------ */
export default function App() {
  const [lang, setLang] = useState(() => (typeof window === 'undefined' ? 'es' : detectLang()))
  const [wizard, setWizard] = useState(null)      // null | { interest }
  const [unlocked, setUnlocked] = useState(() => store.get(UNLOCK_KEY) === '1')
  const [lb, setLb] = useState(-1)
  const [stuck, setStuck] = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const videoRef = useVideoInView()

  const t = content[lang]

  useEffect(() => {
    document.documentElement.lang = lang
    store.set('lg_lang', lang)
  }, [lang])

  useEffect(() => {
    const onScroll = () => {
      setStuck(window.scrollY > 40)
      setShowSticky(window.scrollY > window.innerHeight * 0.85)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useReveal([lang])

  const open = useCallback((interest) => setWizard({ interest }), [])
  const onDone = useCallback(() => { setUnlocked(true); store.set(UNLOCK_KEY, '1') }, [])

  const gal = t.gallery.items
  const moveLb = useCallback((d) => setLb((i) => (i + d + gal.length) % gal.length), [gal.length])

  const nav = useMemo(() => ([
    ['#concepto', t.nav.concept],
    ['#villas', t.nav.villas],
    ['#galeria', t.nav.gallery],
    ['#ubicacion', t.nav.location],
  ]), [t])

  return (
    <>
      {/* ---------------- Header ---------------- */}
      <header className={`hdr${stuck ? ' stuck' : ''}`}>
        <div className="wrap hdr__inner">
          <a href="#top" className="hdr__logo">
            <img src="/img/logo-fusion.png" alt="Fusión +34" />
            <span>Luxury Golf</span>
          </a>
          <nav className="hdr__nav">
            {nav.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <div className="lang">
            <button onClick={() => setLang('es')} aria-pressed={lang === 'es'}>ES</button>
            <span>/</span>
            <button onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
          </div>
          <button className="btn btn--sm" onClick={() => open('Header')}>{t.nav.cta}</button>
        </div>
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="hero" id="top">
        <div className="hero__media">
          <img src="/img/Contra_fachada_angular.jpg" alt="" fetchPriority="high" />
        </div>
        <div className="wrap hero__inner">
          <span className="eyebrow hero__eyebrow">{t.hero.eyebrow}</span>
          <h1 className="h1">{t.hero.title1}<span className="it">{t.hero.title2}</span></h1>
          <p className="lead hero__lead">{t.hero.lead}</p>
          <div className="hero__cta">
            <button className="btn" onClick={() => open('Hero')}>{t.hero.cta}<Ico.arrow className="arr" /></button>
            <a className="btn btn--ghost" href="#villas">{t.hero.cta2}</a>
          </div>
          <div className="hero__badge">
            <b><span className="dot" />{t.hero.badge}</b>
            <small>{t.hero.badgeSub}</small>
          </div>
        </div>
      </section>

      {/* ---------------- Stats ---------------- */}
      <section className="stats">
        <div className="wrap">
          <div className="stats__grid">
            {t.stats.map((s, i) => (
              <R key={s.l} className="stat" d={i * 70}>
                <b>{s.n}{s.u && <i>{s.u}</i>}</b>
                <span>{s.l}</span>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Concepto ---------------- */}
      <section className="sec" id="concepto">
        <div className="wrap">
          <R className="sec__head">
            <span className="eyebrow">{t.concept.eyebrow}</span>
            <h2 className="h2">{t.concept.title}</h2>
            <p className="lead">{t.concept.text}</p>
          </R>

          <div className="feats">
            {t.concept.features.map((f, i) => (
              <R key={f.t} className="feat" d={i * 90}>
                <span className="feat__n">0{i + 1}</span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </R>
            ))}
          </div>

          <R className="plan" d={120}>
            <img src="/img/aerea.jpg" srcSet="/img/aerea-sm.jpg 1280w, /img/aerea.jpg 2400w" sizes="(max-width: 1320px) 100vw, 1320px" alt="Master Plan Luxury Golf Collection" loading="lazy" />
            <span className="plan__tag">Master Plan · {t.villas.units}</span>
          </R>
        </div>
      </section>

      {/* ---------------- Villa terminada ---------------- */}
      <section className="sec light">
        <div className="wrap split split--wide">
          <R>
            <span className="eyebrow">{t.finished.eyebrow}</span>
            <h2 className="h2" style={{ marginTop: '1.4rem' }}>{t.finished.title}</h2>
            <p className="lead" style={{ marginTop: '1.5rem' }}>{t.finished.text}</p>
            <div className="done-villa__price">
              <small>{t.finished.priceNote}</small>
              <b>{t.villas.items[0].price}</b>
              <span>{t.finished.price} · {t.villas.items[0].name}</span>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <button className="btn" onClick={() => open('Visita villa terminada')}>
                {t.finished.cta}<Ico.arrow className="arr" />
              </button>
            </div>
          </R>
          <R d={140}>
            <div className="facts">
              {t.finished.facts.map(([k, v]) => (
                <div className="fact" key={k}><small>{k}</small><b>{v}</b></div>
              ))}
            </div>
            <div className="media media--wide" style={{ marginTop: '1.5rem' }}>
              <img src="/img/Estar_II_final.jpg" alt="" loading="lazy" />
            </div>
          </R>
        </div>
      </section>

      {/* ---------------- Villas ---------------- */}
      <section className="sec" id="villas">
        <div className="wrap">
          <R className="sec__head">
            <span className="eyebrow">{t.villas.eyebrow}</span>
            <h2 className="h2">{t.villas.title}</h2>
            <p className="lead">{t.villas.text}</p>
          </R>

          <div className="villas__grid">
            {t.villas.items.map((v, i) => (
              <R key={v.id} className="vcard" d={i * 110}>
                <div className="vcard__img">
                  <img src={v.img} alt={v.name} loading="lazy" />
                  <span className={`vcard__tag${v.price ? ' vcard__tag--done' : ''}`}>{v.tag}</span>
                </div>
                <div className="vcard__body">
                  <span className="vcard__n">{v.n}</span>
                  <h3 className="h3">{v.name}</h3>
                  <p className="vcard__d">{v.d}</p>
                  <div className="vcard__specs">
                    {v.specs.map(([k, val]) => (
                      <div key={k}><small>{k}</small><b>{val}</b></div>
                    ))}
                  </div>
                  <div className="vcard__foot">
                    {v.price
                      ? <span className="vcard__price">{v.price}</span>
                      : <span className="vcard__price--locked"><Ico.lock />{t.villas.priceOnRequest}</span>}
                    <button className="btn btn--sm btn--ghost" onClick={() => open(`${v.n} · ${v.name}`)}>
                      {t.villas.cardCta}
                    </button>
                  </div>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Galería ---------------- */}
      <section className="sec sec--tight" id="galeria">
        <div className="wrap">
          <R className="sec__head">
            <span className="eyebrow">{t.gallery.eyebrow}</span>
            <h2 className="h2">{t.gallery.title}</h2>
          </R>
          <div className="gal">
            {gal.map((g, i) => (
              <button key={g.src} onClick={() => setLb(i)} aria-label={g.c}>
                <img src={g.src} alt={g.c} loading="lazy" />
                <span>{g.c}</span>
              </button>
            ))}
          </div>
          <p className="disclaimer">{t.gallery.disclaimer}</p>
        </div>
      </section>

      {/* ---------------- Plantas ---------------- */}
      <section className="sec sec--tight">
        <div className="wrap">
          <R className="sec__head">
            <span className="eyebrow">{t.floors.eyebrow}</span>
          </R>
          <div className="floors">
            {t.floors.items.map((f, i) => (
              <R key={f.t} className="floor" d={i * 90}>
                <i>0{i + 1}</i>
                <b>{f.t}</b>
                <p>{f.d}</p>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Vídeo ---------------- */}
      <section className="vid">
        <video
          ref={videoRef}
          src="/video/sobrevuelo.mp4"
          autoPlay muted loop playsInline
          preload="metadata"
          poster="/img/aerea-sm.jpg"
          aria-label={t.video.sub}
        />
        <div className="vid__ov">
          <div className="wrap">
            <span className="eyebrow">{t.video.sub}</span>
            <h2 className="h2">{t.video.line}</h2>
          </div>
        </div>
      </section>

      {/* ---------------- Ubicación ---------------- */}
      <section className="sec light" id="ubicacion">
        <div className="wrap">
          <div className="split">
            <R>
              <span className="eyebrow">{t.location.eyebrow}</span>
              <h2 className="h2" style={{ marginTop: '1.4rem' }}>{t.location.title}</h2>
              <p className="lead" style={{ marginTop: '1.5rem' }}>{t.location.text}</p>
            </R>
            <R d={120}>
              <div className="loc__groups" style={{ marginTop: 0 }}>
                {t.location.groups.map((g) => (
                  <div className="lgroup" key={g.t}>
                    <b>{g.t}</b>
                    {g.items.map(([k, v]) => (
                      <div key={k}><span>{k}</span><span>{v}</span></div>
                    ))}
                  </div>
                ))}
              </div>
            </R>
          </div>

          <R className="golf" d={80}>
            <span className="eyebrow">{t.location.golf.eyebrow}</span>
            <p className="golf__t">{t.location.golf.t}</p>
            <p className="golf__d">{t.location.golf.d}</p>
          </R>

          <R className="map" d={100}>
            <div className="map__head">
              <div>
                <span className="eyebrow">{t.location.map.t}</span>
                <p>{t.location.map.d}</p>
              </div>
              <a className="link-u" href={MAPS_LINK} target="_blank" rel="noreferrer">
                {t.location.map.cta}<Ico.arrow />
              </a>
            </div>
            <div className="map__frame">
              <iframe
                src={MAPS_EMBED}
                title={t.location.map.t}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </R>
        </div>
      </section>

      {/* ---------------- Calidades ---------------- */}
      <section className="sec">
        <div className="wrap split">
          <R>
            <span className="eyebrow">{t.quality.eyebrow}</span>
            <h2 className="h2" style={{ marginTop: '1.4rem' }}>{t.quality.title}</h2>
            <ul className="qlist">
              {t.quality.items.map((q) => (
                <li key={q}><Ico.diamond />{q}</li>
              ))}
            </ul>
            <div style={{ marginTop: '2.2rem' }}>
              <button className="link-u" onClick={() => open('Memoria de calidades')}>
                {t.quality.more}<Ico.arrow />
              </button>
            </div>
          </R>
          <R d={140} className="media media--tall">
            <img src="/img/Habitacion.jpg" alt="" loading="lazy" />
          </R>
        </div>
      </section>

      {/* ---------------- Dossier ---------------- */}
      <section className="sec gated">
        <div className="wrap gated__grid">
          <R>
            <span className="eyebrow">{t.gated.eyebrow}</span>
            <h2 className="h2" style={{ marginTop: '1.4rem' }}>{t.gated.title}</h2>
            <p className="lead" style={{ marginTop: '1.5rem' }}>{t.gated.text}</p>
            <div style={{ marginTop: '2.2rem' }}>
              <button className="btn" onClick={() => open('Sección dossier')}>
                {t.gated.cta}<Ico.arrow className="arr" />
              </button>
            </div>
            <span className="gated__time"><Ico.clock />{t.gated.time}</span>
          </R>
          <R d={140}>
            <div className="gated__items">
              {t.gated.items.map(([k, v]) => (
                <div className="gitem" key={k}>
                  <Ico.doc />
                  <span><b>{k}</b><small>{v}</small></span>
                </div>
              ))}
            </div>
          </R>
        </div>
      </section>

      {/* ---------------- Proceso ---------------- */}
      <section className="sec">
        <div className="wrap">
          <R className="sec__head">
            <span className="eyebrow">{t.process.eyebrow}</span>
            <h2 className="h2">{t.process.title}</h2>
          </R>
          <div className="steps">
            {t.process.steps.map((s, i) => (
              <R key={s.t} className="step" d={i * 90}>
                <b>{s.t}</b>
                <p>{s.d}</p>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA final ---------------- */}
      <section className="final">
        <img src="/img/Terraza.jpg" alt="" loading="lazy" />
        <div className="wrap">
          <R>
            <h2 className="h2">{t.final.title}</h2>
            <p className="lead">{t.final.text}</p>
            <button className="btn" onClick={() => open('CTA final')}>{t.final.cta}<Ico.arrow className="arr" /></button>
          </R>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="ftr">
        <div className="wrap">
          <div className="ftr__top">
            <div className="ftr__logo">
              <small>{t.footer.promoted}</small>
              <img src="/img/logo-fusion.png" alt="Fusión +34 by Alternativa Málaga" />
            </div>
            <div>
              <h4>Contacto</h4>
              <p>Alternativa Patagonia SL<br />Av. Torreblanca 7<br />29640 Fuengirola · Málaga</p>
              <a href="https://www.fusionmas34.com" target="_blank" rel="noreferrer">www.fusionmas34.com</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="https://alternativamalaga.com/aviso-legal/" target="_blank" rel="noreferrer">{t.footer.legal}</a>
              <a href="https://alternativamalaga.com/politica-de-privacidad/" target="_blank" rel="noreferrer">{t.footer.privacy}</a>
              <a href="https://alternativamalaga.com/politica-de-privacidad/" target="_blank" rel="noreferrer">{t.footer.cookies}</a>
            </div>
          </div>
          <p className="ftr__legal">{t.footer.disclaimer}</p>
          <p className="ftr__copy">© {new Date().getFullYear()} Fusión +34 by Alternativa Málaga · Luxury Golf Collection</p>
        </div>
      </footer>

      {/* ---------------- Sticky móvil ---------------- */}
      <div className={`sticky${showSticky && !wizard ? ' show' : ''}`}>
        <button className="btn btn--wide" onClick={() => open('Sticky móvil')}>
          {t.sticky}<Ico.arrow className="arr" />
        </button>
      </div>

      {/* ---------------- Overlays ---------------- */}
      {lb >= 0 && <Lightbox items={gal} i={lb} onClose={() => setLb(-1)} onMove={moveLb} />}
      {wizard && (
        <Wizard
          lang={lang}
          t={t}
          interest={wizard.interest}
          startDone={unlocked}
          onClose={() => setWizard(null)}
          onDone={onDone}
        />
      )}
    </>
  )
}
