module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ['https://agenplus.com.br', 'https://www.agenplus.com.br', 'https://saas-agendamento-seven.vercel.app'];
  if (allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'Variáveis de ambiente não configuradas' });

  const { nome_empresa, email, password, whatsapp } = req.body || {};
  if (!nome_empresa || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios: nome_empresa, email, password' });
  if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });

  // Verifica se email já existe
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const existing = await checkRes.json();
  if (Array.isArray(existing) && existing.length > 0) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
  }

  // Cria usuario via admin (sem enviar email)
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, email_confirm: true })
  });
  if (!createRes.ok) {
    const err = await createRes.json();
    return res.status(400).json({ error: err.msg || err.message || 'Erro ao criar usuário' });
  }
  const newUser = await createRes.json();

  // Gera slug único
  function slugify(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  const RESERVADOS = ['api','app','admin','master','login','logout','static','assets','sw','manifest','index','null','undefined','favicon','www','cadastro'];
  let baseSlug = slugify(nome_empresa) || 'empresa';
  if (RESERVADOS.includes(baseSlug)) baseSlug = baseSlug + '-ag';

  const slugsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/empresas?select=slug`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const slugsData = await slugsRes.json();
  const slugsExistentes = new Set((slugsData || []).map(e => e.slug));
  let slug = baseSlug, n = 1;
  while (slugsExistentes.has(slug)) { slug = baseSlug + '-' + (++n); }

  // Cria a empresa
  const empInsert = await fetch(`${SUPABASE_URL}/rest/v1/empresas`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      slug, nome: nome_empresa.trim(), whatsapp: whatsapp || null, bloqueada: false,
      status: 'trial',
      foto_url: null, descricao: null, logo: null, cor_principal: '#3d1f3a', texto_destaque: null,
      trial_expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
  });
  if (!empInsert.ok) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${newUser.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
    });
    const err = await empInsert.text();
    return res.status(500).json({ error: 'Erro ao criar empresa: ' + err });
  }
  const empCriada = (await empInsert.json())[0];
  if (!empCriada?.id) return res.status(500).json({ error: 'Empresa criada sem ID' });

  // Cria perfil do gestor
  const profilePost = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      id: newUser.id, nome: nome_empresa.trim(), email,
      role: 'owner_empresa', empresa_id: empCriada.id, status: 'ativo'
    })
  });
  if (!profilePost.ok) {
    await fetch(`${SUPABASE_URL}/rest/v1/empresas?id=eq.${empCriada.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
    });
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${newUser.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
    });
    const err = await profilePost.text();
    return res.status(500).json({ error: 'Erro ao criar perfil: ' + err });
  }

  return res.status(200).json({ slug });
};
