// api/subdomain-page.js
// Serve app.html com OG meta tags dinamicas por empresa/agendamento
// Usado pelo WhatsApp e outros crawlers ao compartilhar links

const fs   = require('fs');
const path = require('path');

// app.html tem ~5000 linhas — le do disco uma vez e reusa entre requisicoes.
// TTL de 5 minutos: apos um deploy, instancias em execucao recarregam o arquivo.
let _appHtmlCache = null;
let _appHtmlCachedAt = 0;
const APP_HTML_TTL_MS = 5 * 60 * 1000;

module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const host = req.headers.host || '';
  const slugMatch = host.match(/^([^.]+)\.agenplus\.com\.br$/);
  const slug = slugMatch ? slugMatch[1] : null;

  // Le o app.html do disco (api/ fica uma pasta abaixo da raiz)
  let html;
  try {
    const now = Date.now();
    if (!_appHtmlCache || (now - _appHtmlCachedAt) > APP_HTML_TTL_MS) {
      _appHtmlCache = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
      _appHtmlCachedAt = now;
    }
    html = _appHtmlCache;
  } catch(e) {
    console.error('[subdomain-page] erro ao ler app.html:', e.message, 'cwd:', process.cwd(), '__dirname:', __dirname);
    return res.status(500).send('Erro ao carregar página: ' + e.message);
  }

  // Sem slug ou sem env: serve app.html sem modificar
  if (!slug || !SUPABASE_URL || !SERVICE_KEY) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  // Busca dados da empresa
  let emp = null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/empresas?slug=eq.${encodeURIComponent(slug)}&select=id,nome,logo,bloqueada,tipo&limit=1`,
      { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
    );
    const rows = await r.json();
    if (Array.isArray(rows) && rows.length) emp = rows[0];
  } catch(e) { console.error('[subdomain-page] erro ao buscar empresa:', e.message); }

  // Busca agendamento se ?ag= presente
  const agId = (req.query && req.query.ag) || new URL('https://x.com' + req.url).searchParams.get('ag');
  let ag = null;
  if (agId && emp) {
    try {
      const isUUID = /^[0-9a-f-]{36}$/i.test(agId);
      const filtro = isUUID ? `id=eq.${agId}` : `token_curto=eq.${encodeURIComponent(agId)}`;
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/agendamentos?${filtro}&select=servico_nome,data,hora&limit=1`,
        { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } }
      );
      const rows = await r.json();
      if (Array.isArray(rows) && rows.length) ag = rows[0];
    } catch(e) { console.error('[subdomain-page] erro ao buscar agendamento:', e.message); }
  }

  // Monta titulo e descricao
  const empNome   = emp ? emp.nome : 'Agen+';
  const currentUrl = req.headers['x-original-url'] || `https://${host}${req.url}`;

  const empLogo = emp && emp.logo ? emp.logo : null;

  let ogTitle, ogDesc, ogImage;
  if (ag) {
    // Link de confirmacao: sem imagem
    ogTitle = `${empNome} — Confirme seu agendamento`;
    ogDesc  = `Acesse o link para confirmar ou cancelar seu agendamento.`;
    ogImage = null;
  } else if (emp && emp.tipo === 'pagina') {
    // Empresa de pagina: so o nome
    ogTitle = empNome;
    ogDesc  = '';
    ogImage = null;
  } else {
    // Empresa de agendamento
    ogTitle = `${empNome} — Agende seu horário`;
    ogDesc  = `Agende online de forma rápida e simples.`;
    ogImage = null;
  }

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  const ogTags = [
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:url" content="${esc(currentUrl)}"/>`,
    `<meta property="og:title" content="${esc(ogTitle)}"/>`,
    `<meta property="og:description" content="${esc(ogDesc)}"/>`,
    ...(ogImage ? [`<meta property="og:image" content="${esc(ogImage)}"/>`] : []),
    `<meta property="og:site_name" content="${esc(empNome)}"/>`,
    `<meta name="twitter:card" content="summary"/>`,
    `<meta name="twitter:title" content="${esc(ogTitle)}"/>`,
    `<meta name="twitter:description" content="${esc(ogDesc)}"/>`,
  ].join('\n');

  // Injeta no <head>: substitui title, remove description generica, adiciona OG
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(ogTitle)}</title>`);
  html = html.replace(/<meta name="description"[^/]*\/>/, '');
  html = html.replace('</head>', ogTags + '\n</head>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).send(html);
};
