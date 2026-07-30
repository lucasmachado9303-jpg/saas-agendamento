module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://saas-agendamento-seven.vercel.app'];
  if (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });
  }

  // Verifica token do chamador
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const callerToken = authHeader.slice(7);

  // Valida o token e obtém o usuário chamador
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${callerToken}`, 'apikey': SERVICE_KEY }
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Token inválido' });
  const callerUser = await userRes.json();

  // Verifica se o chamador é master
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${callerUser.id}&select=role`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const profiles = await profileRes.json();
  if (!Array.isArray(profiles) || !profiles[0] || profiles[0].role !== 'master') {
    return res.status(403).json({ error: 'Acesso restrito ao master' });
  }

  const { empresa_id } = req.body || {};
  if (!empresa_id) {
    return res.status(400).json({ error: 'empresa_id obrigatório' });
  }

  // Busca o profile do gestor da empresa para obter o auth user id
  const gestorRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?empresa_id=eq.${empresa_id}&role=eq.owner_empresa&select=id`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const gestores = await gestorRes.json();

  if (!Array.isArray(gestores) || gestores.length === 0) {
    return res.status(200).json({ success: true, message: 'Nenhum gestor encontrado para remover' });
  }

  // Remove cada gestor do auth.users (o profile é removido via cascade)
  const erros = [];
  for (const g of gestores) {
    const delRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${g.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
    });
    if (!delRes.ok) {
      const err = await delRes.json().catch(() => ({}));
      erros.push(`user ${g.id}: ${err.message || delRes.status}`);
    }
  }

  if (erros.length > 0) {
    return res.status(500).json({ error: 'Erros ao remover usuários: ' + erros.join(', ') });
  }

  return res.status(200).json({ success: true });
};
