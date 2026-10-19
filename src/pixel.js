// Meta Pixel. No se carga nada hasta que el visitante da su consentimiento:
// loadPixel() solo se llama desde App cuando `consent.marketing` es true.

const PIXEL_ID = '1065074469914692'

const isLocal = () =>
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)

let loaded = false

/** Inyecta el píxel y registra la visita. Idempotente. */
export function loadPixel() {
  if (loaded || typeof window === 'undefined') return
  loaded = true

  if (isLocal()) {
    // En desarrollo no se contacta con Meta: así las pruebas no ensucian los datos.
    window.fbq = (...args) => console.log('[fbq · dev]', args)
  } else {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }
      if (!f._fbq) f._fbq = n
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []
      t = b.createElement(e); t.async = !0; t.src = v
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    /* eslint-enable */
  }

  window.fbq('init', PIXEL_ID)
  window.fbq('track', 'PageView')
}

/** Evento de cliente potencial. Si no hay consentimiento, `window.fbq` no
 *  existe y no se envía nada: el lead ya está guardado en el CRM igualmente.
 *  El `eventID` permite deduplicar si algún día se añade la API de
 *  Conversiones en servidor. Nunca se envían datos personales. */
export function trackLead(data) {
  if (typeof window === 'undefined' || !window.fbq) return null
  const eventID = `lead.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`
  try {
    window.fbq('track', 'Lead', {
      content_name: 'Dossier Luxury Golf Collection',
      content_category: data.interest,
      presupuesto: data.budget,
      horizonte: data.timing,
      ubicacion: data.location,
      idioma: data.lang,
    }, { eventID })
  } catch {
    /* bloqueador de anuncios */
  }
  return eventID
}
