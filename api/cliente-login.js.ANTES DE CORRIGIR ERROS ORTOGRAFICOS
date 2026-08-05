module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://saas-agendamento-seven.vercel.app'];
  if (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Variaveis de ambiente nao configuradas' });
  }

  // PATCH — cancelar ou confirmar agendamento pelo cliente
  if (req.method === 'PATCH') {
    const { agendamento_id, nome, telefone, acao } = req.body || {};
    if (!agendamento_id || !nome || !telefone || !acao) {
      return res.status(400).json({ error: 'Campos obrigatorios: agendamento_id, nome, telefone, acao' });
    }
    if (!['cancelar','confirmar'].includes(acao)) {
      return res.status(400).json({ error: 'acao deve ser cancelar ou confirmar' });
    }

    // Verifica que o agendamento pertence ao cliente
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${agendamento_id}&nome_cliente=eq.${encodeURIComponent(nome)}&telefone=eq.${encodeURIComponent(telefone)}&select=id`,
      { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
    );
    const rows = await checkRes.json();
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(403).json({ error: 'Agendamento nao encontrado ou nao pertence a este cliente.' });
    }

    const novoStatus = acao === 'cancelar' ? 'cancelado' : 'confirmado';
    const updRes = await fetch(
      `${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${agendamento_id}`,
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
  }

  // POST — buscar agendamentos do cliente
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { empresa_id, nome, telefone } = req.body || {};
  if (!empresa_id || !nome || !telefone) {
    return res.status(400).json({ error: 'Campos obrigatorios: empresa_id, nome, telefone' });
  }

  const agRes = await fetch(
    `${SUPABASE_URL}/rest/v1/agendamentos?empresa_id=eq.${empresa_id}&nome_cliente=eq.${encodeURIComponent(nome)}&telefone=eq.${encodeURIComponent(telefone)}&select=id,data,hora,servico_nome,status&order=data.desc,hora.desc`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const agendamentos = await agRes.json();

  if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
    return res.status(404).json({
      error: 'Cliente nao encontrado. Verifique seu nome e WhatsApp conforme foram cadastrados.'
    });
  }

  return res.status(200).json({ agendamentos });
};
