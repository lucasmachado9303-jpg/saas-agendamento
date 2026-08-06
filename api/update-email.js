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

  const { user_id, email } = req.body || {};
  if (!user_id || !email) {
    return res.status(400).json({ error: 'Campos obrigatórios: user_id, email' });
  }

  const updRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, email_confirm: true })
  });

  if (!updRes.ok) {
    const err = await updRes.json().catch(() => ({}));
    return res.status(500).json({ error: err.message || 'Erro ao atualizar e-mail no Supabase.' });
  }

  return res.status(200).json({ success: true });
};
