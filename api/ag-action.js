// api/ag-action.js
// Confirmar ou cancelar agendamento pelo link direto (?ag=UUID)
// O UUID já é token de acesso suficientemente seguro

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://saas-agendamento-seven.vercel.app'];
  if (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /\.agenplus\.com\.br$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
  }

  const { ag_id, acao } = req.body || {};
  if (!ag_id || !acao) {
    return res.status(400).json({ error: 'Campos obrigatórios: ag_id, acao' });
  }
  if (!['cancelar', 'confirmar'].includes(acao)) {
    return res.status(400).json({ error: 'acao deve ser cancelar ou confirmar' });
  }

  // Verifica que o agendamento existe
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${ag_id}&select=id,status`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const rows = await checkRes.json();
  if (!Array.isArray(rows) || !rows.length) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const novoStatus = acao === 'cancelar' ? 'cancelado' : 'confirmado';
  const updRes = await fetch(
    `${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${ag_id}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ status: novoStatus })
    }
  );
  if (!updRes.ok) {
    return res.status(500).json({ error: 'Erro ao atualizar agendamento.' });
  }
  return res.status(200).json({ success: true, status: novoStatus });
};
