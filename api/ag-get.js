// api/ag-get.js
// Busca dados de um agendamento pelo UUID (para a tela de confirmação pública)

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://saas-agendamento-seven.vercel.app'];
  if (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /\.agenplus\.com\.br$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
  }

  const { ag_id } = req.query;
  if (!ag_id) return res.status(400).json({ error: 'ag_id obrigatório' });

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${ag_id}&select=id,nome_cliente,servico_nome,data,hora,status`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const rows = await r.json();
  if (!Array.isArray(rows) || !rows.length) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }
  return res.status(200).json(rows[0]);
};
