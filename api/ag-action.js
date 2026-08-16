// api/ag-action.js
// Confirmar ou cancelar agendamento pelo link direto (?ag=UUID)
// O UUID já é token de acesso suficientemente seguro

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://saas-agendamento-seven.vercel.app', 'https://agenplus.com.br', 'https://www.agenplus.com.br'];
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

  // Detecta se é UUID (36 chars) ou token curto
  const isUUID = /^[0-9a-f-]{36}$/i.test(ag_id);
  const filtro = isUUID ? `id=eq.${ag_id}` : `token_curto=eq.${encodeURIComponent(ag_id)}`;

  // Verifica que o agendamento existe e busca dados necessários para as validações
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/agendamentos?${filtro}&select=id,status,data,hora,empresa_id`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const rows = await checkRes.json();
  if (!Array.isArray(rows) || !rows.length) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }
  const ag = rows[0];

  // #4: Impede ação repetida (ex: confirmar um agendamento já confirmado)
  if (acao === 'confirmar' && ag.status === 'confirmado') {
    return res.status(409).json({ error: 'Agendamento já está confirmado.' });
  }
  if (acao === 'cancelar' && ag.status === 'cancelado') {
    return res.status(409).json({ error: 'Agendamento já está cancelado.' });
  }

  // #5: Valida prazo de cancelamento conforme configuração da empresa
  if (acao === 'cancelar') {
    const empRes = await fetch(
      `${SUPABASE_URL}/rest/v1/empresas?id=eq.${ag.empresa_id}&select=cancelamento_horas`,
      { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
    );
    const empRows = await empRes.json();
    const cancelHoras = (Array.isArray(empRows) && empRows[0]?.cancelamento_horas != null)
      ? empRows[0].cancelamento_horas : 2;
    if (cancelHoras > 0) {
      // Interpreta data/hora como horario de Brasilia (UTC-3) para calcular antecedencia corretamente
      const agDateTime = new Date(`${ag.data}T${ag.hora}:00-03:00`);
      const horasRestantes = (agDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (horasRestantes < cancelHoras) {
        return res.status(403).json({ error: `Cancelamento não permitido com menos de ${cancelHoras}h de antecedência.` });
      }
    }
  }

  const novoStatus = acao === 'cancelar' ? 'cancelado' : 'confirmado';
  const realId = ag.id;
  const updRes = await fetch(
    `${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${realId}`,
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
