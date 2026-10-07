// Serverless function (Vercel) — also reused by the Vite dev server (see vite.config.js)
// Crea el lead en el embudo "Alterntiva_Villas" de Kommo con contacto + nota de cualificación.

const KOMMO_BASE = 'https://pedropablocastro1995.kommo.com';
const PIPELINE_ID = 14583560;   // Alterntiva_Villas
const STATUS_ID = 112671308;    // "Contacto inicial"

const kommo = (path, token, body) =>
  fetch(`${KOMMO_BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const token = process.env.KOMMO_TOKEN;
  if (!token) return res.status(500).json({ error: 'KOMMO_TOKEN no configurado' });

  try {
    const d = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (!d.name || !d.email || !d.phone) return res.status(400).json({ error: 'Faltan datos de contacto' });

    const leadName = `[Luxury Golf] ${d.name} · ${d.budget || 's/p'}`;
    const tags = ['Luxury Golf', 'Landing Villas', d.budget, d.location, d.timing, d.lang?.toUpperCase()]
      .filter(Boolean)
      .map((name) => ({ name: String(name).slice(0, 50) }));

    const payload = [{
      name: leadName,
      pipeline_id: PIPELINE_ID,
      status_id: STATUS_ID,
      _embedded: {
        tags,
        contacts: [{
          name: d.name,
          custom_fields_values: [
            { field_code: 'PHONE', values: [{ value: d.phone, enum_code: 'WORK' }] },
            { field_code: 'EMAIL', values: [{ value: d.email, enum_code: 'WORK' }] },
          ],
        }],
      },
    }];

    const leadResp = await kommo('/api/v4/leads/complex', token, payload);
    if (!leadResp.ok) {
      const details = await leadResp.text();
      console.error('[LUXURY GOLF] Kommo error:', details);
      return res.status(502).json({ error: 'Error CRM', details });
    }

    const [{ id: leadId }] = await leadResp.json();

    const note = [
      '🏌️ LEAD LANDING · LUXURY GOLF COLLECTION (La Cala Golf)',
      '',
      '📌 CONTACTO',
      `Nombre: ${d.name}`,
      `Teléfono: ${d.phone}`,
      `Email: ${d.email}`,
      `Idioma web: ${d.lang || '-'}`,
      '',
      '🎯 CUALIFICACIÓN',
      `Presupuesto: ${d.budget || '-'}`,
      `¿Está en la Costa del Sol?: ${d.location || '-'}`,
      `Horizonte de compra: ${d.timing || '-'}`,
      `Interés / origen del clic: ${d.interest || '-'}`,
      '',
      '📈 ORIGEN',
      `UTM: ${d.utm || '-'}`,
      `Referrer: ${d.referrer || '-'}`,
      `Página: ${d.page || '-'}`,
    ].join('\n');

    try {
      await kommo('/api/v4/leads/notes', token, [{ entity_id: leadId, note_type: 'common', params: { text: note } }]);
    } catch (e) {
      console.error('[LUXURY GOLF] Note failed:', e);
    }

    return res.status(200).json({ success: true, leadId });
  } catch (err) {
    console.error('[LUXURY GOLF] Server error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
