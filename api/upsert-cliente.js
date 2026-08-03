module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://saas-agendamento-seven.vercel.app'];
  if (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
  }

  const { empresa_id, nome, telefone } = req.body || {};
  if (!empresa_id || !nome || !telefone) {
    return res.status(400).json({ error: 'Campos obrigatórios: empresa_id, nome, telefone' });
  }

  // Verifica se ja existe cliente com mesmo nome + telefone + empresa
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/clientes?empresa_id=eq.${empresa_id}&nome=eq.${encodeURIComponent(nome)}&telefone=eq.${encodeURIComponent(telefone)}&select=id&limit=1`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const existentes = await checkRes.json();
  if (Array.isArray(existentes) && existentes.length > 0) {
    return res.status(200).json({ success: true, cliente_id: existentes[0].id, created: false });
  }

  // Cria novo cliente
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/clientes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ empresa_id, nome, telefone })
  });
  if (!insertRes.ok) {
    return res.status(200).json({ success: true, created: false });
  }
  const rows = await insertRes.json();
  return res.status(200).json({ success: true, cliente_id: rows[0]?.id, created: true });
};
