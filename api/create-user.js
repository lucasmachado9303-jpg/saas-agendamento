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

  // Valida campos obrigatórios
  const { email, password, nome, empresa_id } = req.body || {};
  if (!email || !password || !nome || !empresa_id) {
    return res.status(400).json({ error: 'Campos obrigatórios: email, password, nome, empresa_id' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  // Cria o usuário no Supabase Auth (já confirmado, sem email de verificação)
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, email_confirm: true })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    return res.status(400).json({ error: err.msg || err.message || 'Erro ao criar usuário' });
  }
  const newUser = await createRes.json();

  // Cria o perfil na tabela profiles
  const profileInsert = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      id: newUser.id,
      nome,
      email,
      role: 'owner_empresa',
      empresa_id,
      status: 'ativo'
    })
  });

  if (!profileInsert.ok) {
    // Rollback: remove o auth user criado
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${newUser.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
    });
    const errBody = await profileInsert.text();
    return res.status(500).json({ error: 'Erro ao criar perfil: ' + errBody });
  }

  return res.status(200).json({ success: true, user_id: newUser.id });
};
