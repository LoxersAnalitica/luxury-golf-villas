# Luxury Golf Collection — landing de captación

Landing bilingüe (ES/EN) para las villas de **La Cala Golf (Mijas Costa)**, promovidas por
Fusión +34 by Alternativa Málaga. Todo el contenido descargable está *gated*: para acceder al
dossier, los planos y la memoria de calidades hay que completar un formulario dinámico de
6 pasos (una pregunta por pantalla), que crea el lead en Kommo.

## Stack

- React 19 + Vite 7 (sin router: una sola página)
- `react-phone-number-input` para el teléfono internacional
- Función serverless en `api/kommo.js` (Vercel) — el mismo handler se monta en el dev server
  de Vite, así que en local el formulario funciona igual que en producción.

## Puesta en marcha

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera dist/
```

Variable de entorno necesaria (en `.env.local` para local y en Vercel → Settings → Environment
Variables para producción):

```
KOMMO_TOKEN=<token de larga duración de Kommo>
```

## Despliegue en Vercel

1. `vercel link` (o importar el repo desde el panel).
2. Añadir `KOMMO_TOKEN` en las variables de entorno del proyecto.
3. `vercel --prod`.

`vercel.json` ya define el build, la carpeta `dist` y el rewrite de SPA excluyendo `/api/`.

## Flujo del lead

El formulario envía un POST a `/api/kommo` y el handler crea el lead en:

- Embudo (pipeline): **14583560** — Alterntiva_Villas
- Etapa (status): **112671308** — Contacto inicial

Además adjunta una nota con la cualificación completa (presupuesto, si está en la Costa del Sol,
horizonte de compra, qué CTA pulsó, idioma de la web, UTM, referrer y URL) y etiqueta el lead.

Las preguntas se envían al CRM **siempre en español**, aunque el visitante navegue en inglés:
el mapeo está en `crmLabels`, al final de `src/content.js`.

Si cambian el embudo o la etapa, se editan las constantes al principio de `api/kommo.js`.

## Consentimiento de cookies

Nada de terceros se carga antes de que el visitante decida. El estado vive en
`localStorage` bajo `lg_consent_v1`; mientras no haya decisión guardada
(`null`) se muestra el banner.

Dos categorías opcionales, además de las necesarias:

| Categoría | Qué activa |
|---|---|
| `marketing` | Inyecta el Meta Pixel (`src/pixel.js`) y permite el evento `Lead` |
| `maps` | Carga el iframe de Google Maps; si no, se ve la dirección y un enlace |

Puntos a respetar si se toca esto:

- **Aceptar y rechazar tienen el mismo peso visual.** No conviene degradar el
  botón de rechazo: es justo lo que miran las autoridades de protección de datos.
- El píxel se inyecta desde `loadPixel()`, nunca desde `index.html`. Si vuelve
  al HTML, se cargaría antes del consentimiento y se pierde todo el sentido.
- `trackLead()` comprueba que exista `window.fbq`: sin consentimiento no envía
  nada, pero **el lead sí se guarda en el CRM**. Rechazar cookies nunca impide
  solicitar el dossier.
- El pie tiene un enlace *Preferencias de cookies* para cambiar la decisión,
  que es obligatorio: el consentimiento debe poder retirarse igual de fácil.

Queda fuera de este alcance el registro de consentimientos (guardar prueba de
quién aceptó y cuándo). Si llega a hacer falta, habría que enviarlo a un
servicio con sello de tiempo.

## Meta Pixel

Píxel `1065074469914692`, en `src/pixel.js`. **Solo se carga con consentimiento
de marketing** (ver arriba). Dispara:

- `PageView` en cada carga.
- `Lead` cuando el formulario se envía **con éxito** (no al abrirlo ni si el
  CRM falla), con la cualificación como parámetros: `presupuesto`, `horizonte`,
  `ubicacion`, `idioma` y `content_category` con la villa o el botón de origen.

Dos decisiones a tener en cuenta:

- **En localhost no se contacta con Meta.** `loadPixel()` deja una función que
  solo escribe en consola, para que las pruebas no ensucien los datos. Para
  verificar de verdad, usar el entorno de preview de Vercel o producción.
- **No se envían datos personales.** Nombre, email y teléfono no viajan a Meta.
  Si en algún momento interesa mejorar la atribución, habría que activar la
  concordancia avanzada, que sí los envía cifrados; es una decisión con
  implicaciones de privacidad, no un simple ajuste técnico.

Cada evento `Lead` lleva un `eventID` único, de modo que si más adelante se
añade la API de Conversiones en servidor, Meta deduplicará sin contar el lead
dos veces.

## Dónde tocar cada cosa

| Qué | Dónde |
|---|---|
| Todos los textos, ES y EN | `src/content.js` |
| Secciones, formulario, galería | `src/App.jsx` |
| Diseño (colores, tipografía, retícula) | `src/index.css` |
| Renders de la Villa I y logo | `public/img/` |
| Renders de la Villa II | `public/img/villa2/` |
| Renders de la Villa III | `public/img/villa3/` |
| Dossier y planos descargables | `public/docs/` |
| Vídeo de sobrevuelo | `public/video/` |
| Integración con Kommo | `api/kommo.js` |

El tema visual se controla con variables CSS en `:root`; la clase `.light` invierte la paleta
para las secciones claras (villa terminada y ubicación), sin duplicar reglas.

## Notas

- El idioma se detecta por `?lang=es|en`, luego por preferencia guardada y, por último, por el
  idioma del navegador. El selector del header lo fija y lo recuerda.
- Una vez enviado el formulario, el visitante queda desbloqueado (`localStorage`): si vuelve a
  pulsar cualquier CTA, va directo a las descargas sin repetir las preguntas.
- Cada villa tiene su propia galería (`gallery` dentro de `villas.items`): la foto de la
  tarjeta abre el visor con los renders de esa villa, nunca mezclados con los de otra.
- Las animaciones de entrada respetan `prefers-reduced-motion`.
- El vídeo solo se reproduce mientras está en pantalla; si el navegador bloquea el autoplay se
  ve el póster (render aéreo), nunca un hueco negro.
