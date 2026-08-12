// api/ag-mark.js
// Marca confirmacao_enviada ou lembrete_enviado como true (gestor)

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://saas-agendamento-seven.vercel.app', 'https://agenplus.com.br', 'https://www.agenplus.com.br'];
  if (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || /\.agenplus\.com\.br$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  // Verifica autenticacao: requer Bearer token de um usuario ativo
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Autenticacao obrigatoria' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'Env nao configurado' });

  // Valida o token chamando /auth/v1/user com o token do usuario
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SERVICE_KEY }
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Token invalido ou expirado' });
  const callerUser = await userRes.json();

  // Busca o perfil para obter empresa_id do chamador
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUser.id}&select=empresa_id,role`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const profiles = await profileRes.json();
  if (!Array.isArray(profiles) || !profiles[0]) {
    return res.status(403).json({ error: 'Perfil não encontrado' });
  }
  const callerEmpresaId = profiles[0].empresa_id;
  const callerRole = profiles[0].role;
  // master pode operar qualquer empresa; owner_empresa só a sua
  const isMaster = callerRole === 'master';

  const { ag_id, cliente_id, campo } = req.body || {};
  if (!campo) return res.status(400).json({ error: 'campo obrigatório' });

  // Agendamentos
  if (ag_id) {
    if (!['confirmacao_enviada', 'lembrete_enviado'].includes(campo)) {
      return res.status(400).json({ error: 'campo inválido' });
    }
    // Verifica que o agendamento pertence à empresa do usuário
    const agCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${ag_id}&select=empresa_id`,
      { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
    );
    const agRows = await agCheck.json();
    if (!Array.isArray(agRows) || !agRows.length) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    if (!isMaster && agRows[0].empresa_id !== callerEmpresaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/agendamentos?id=eq.${ag_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ [campo]: true })
    });
    if (!r.ok) return res.status(500).json({ error: 'Erro ao atualizar' });
    return res.status(200).json({ success: true });
  }

  // Clientes
  if (cliente_id) {
    if (!['ausente_enviado_em'].includes(campo)) {
      return res.status(400).json({ error: 'campo inválido' });
    }
    // Verifica que o cliente pertence à empresa do usuário
    const cliCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?id=eq.${cliente_id}&select=empresa_id`,
      { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
    );
    const cliRows = await cliCheck.json();
    if (!Array.isArray(cliRows) || !cliRows.length) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    if (!isMaster && cliRows[0].empresa_id !== callerEmpresaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    const { reset } = req.body || {};
    const valor = reset ? null : new Date().toISOString();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${cliente_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ [campo]: valor })
    });
    if (!r.ok) return res.status(500).json({ error: 'Erro ao atualizar' });
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'ag_id ou cliente_id obrigatório' });
};
