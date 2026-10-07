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

## Dónde tocar cada cosa

| Qué | Dónde |
|---|---|
| Todos los textos, ES y EN | `src/content.js` |
| Secciones, formulario, galería | `src/App.jsx` |
| Diseño (colores, tipografía, retícula) | `src/index.css` |
| Renders y logo | `public/img/` |
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
- Las animaciones de entrada respetan `prefers-reduced-motion`.
- El vídeo solo se reproduce mientras está en pantalla; si el navegador bloquea el autoplay se
  ve el póster (render aéreo), nunca un hueco negro.
