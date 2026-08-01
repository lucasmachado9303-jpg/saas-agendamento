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

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });
  const token = authHeader.slice(7);

  // Obtém o usuário a partir do token
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SERVICE_KEY }
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Token inválido' });
  const user = await userRes.json();

  if (!user.email_confirmed_at) return res.status(403).json({ error: 'Email ainda não confirmado' });

  const meta = user.user_metadata || {};
  const nomeEmpresa = (meta.nome_empresa || '').trim();
  const whatsapp    = (meta.whatsapp || '').trim();
  if (!nomeEmpresa) return res.status(400).json({ error: 'Nome da empresa não encontrado nos dados do cadastro' });

  // Idempotência: se já tem perfil, retorna o slug da empresa existente
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=empresa_id`,
    { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
  );
  const profiles = await profileRes.json();
  if (Array.isArray(profiles) && profiles[0]?.empresa_id) {
    const empRes = await fetch(
      `${SUPABASE_URL}/rest/v1/empresas?id=eq.${profiles[0].empresa_id}&select=slug`,
      { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
    );
    const emps = await empRes.json();
    if (emps[0]?.slug) return res.status(200).json({ slug: emps[0].slug });
  }

  // Gera slug único
  function slugify(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  const RESERVADOS = ['api','app','admin','master','login','logout','static','assets','sw','manifest','index','null','undefined','favicon','www','cadastro'];
  let baseSlug = slugify(nomeEmpresa);
  if (!baseSlug) baseSlug = 'empresa';
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
  const empresaBody = {
    slug, nome: nomeEmpresa, whatsapp: whatsapp || null, bloqueada: false,
    foto_url: null, descricao: null, logo: null,
    cor_principal: '#3d1f3a', texto_destaque: null
  };
  const empInsert = await fetch(`${SUPABASE_URL}/rest/v1/empresas`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=representation'
    },
    body: JSON.stringify(empresaBody)
  });
  if (!empInsert.ok) {
    const err = await empInsert.text();
    return res.status(500).json({ error: 'Erro ao criar empresa: ' + err });
  }
  const empCriada = (await empInsert.json())[0];
  if (!empCriada?.id) return res.status(500).json({ error: 'Empresa criada sem ID' });

  // Atualiza ou cria o perfil do gestor
  // Usa PATCH primeiro (caso trigger ja tenha criado uma linha vazia)
  const profileData = { nome: nomeEmpresa, email: user.email, role: 'owner_empresa', empresa_id: empCriada.id, status: 'ativo' };
  let profileOk = false;

  const profilePatch = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal'
    },
    body: JSON.stringify(profileData)
  });

  if (profilePatch.ok) {
    // Verifica se o PATCH realmente atualizou algo (linha pode nao existir)
    const count = profilePatch.headers.get('content-range');
    if (!count || count === '*/0') {
      // Nenhuma linha atualizada — faz INSERT
      const profilePost = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ id: user.id, ...profileData })
      });
      profileOk = profilePost.ok;
      if (!profileOk) {
        const err = await profilePost.text();
        await fetch(`${SUPABASE_URL}/rest/v1/empresas?id=eq.${empCriada.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
        });
        return res.status(500).json({ error: 'Erro ao criar perfil: ' + err });
      }
    } else {
      profileOk = true;
    }
  } else {
    const err = await profilePatch.text();
    await fetch(`${SUPABASE_URL}/rest/v1/empresas?id=eq.${empCriada.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
    });
    return res.status(500).json({ error: 'Erro ao atualizar perfil: ' + err });
  }

  return res.status(200).json({ slug });
};
