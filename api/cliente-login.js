module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://saas-agendamento-seven.vercel.app'];
  if (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Variaveis de ambiente nao configuradas' });
  }

  // DELETE — cancelar agendamento pelo cliente
  if (req.method === 'DELETE') {
    const { agendamento_id, nome, telefone } = req.body || {};
    if (!agendamento_id || !nome || !telefone) {
      return res.status(400).json({ error: 'Campos obrigatorios: agendamento_id, nome, telefone' });
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

    const delRes = await fetch(
      `${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${agendamento_id}`,
      { method: 'DELETE', headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
    );
    if (!delRes.ok) {
      return res.status(500).json({ error: 'Erro ao cancelar agendamento.' });
    }
    return res.status(200).json({ success: true });
  }

  // POST — buscar agendamentos do cliente
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { empresa_id, nome, telefone } = req.body || {};
  if (!empresa_id || !nome || !telefone) {
    return res.status(400).json({ error: 'Campos obrigatorios: empresa_id, nome, telefone' });
  }

  const agRes = await fetch(
    `${SUPABASE_URL}/rest/v1/agendamentos?empresa_id=eq.${empresa_id}&nome_cliente=eq.${encodeURIComponent(nome)}&telefone=eq.${encodeURIComponent(telefone)}&select=id,data,hora,servico_nome&order=data.desc,hora.desc`,
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
