let currentUser      = null;
let currentProfile   = null;
let modoRecuperacao  = false;   // true quando o usuário chega pelo link de redefinir senha

const LABEL_POR_TIPO = {
  whatsapp: 'WhatsApp', instagram: 'Instagram',
  maps: 'Google Maps', site: 'Site', personalizado: 'Personalizado'
};

let empresas = [];
let agendamentos = [];

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}

// Valores que vem do banco e sao inseridos no HTML (inclusive dentro de onclick) passam por aqui.
// O banco aceita escrita publica (agendamentos) e do gestor (empresa, botoes, horarios),
// entao o formato nao e confiavel: sem isso, um campo malicioso executaria codigo na tela do gestor/master.
function slugSeguro(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, ''); }
function horaSegura(h){ const m = /^(\d{2}):(\d{2})/.exec(String(h || '')); return m ? m[1] + ':' + m[2] : ''; }
function dataSegura(d){ const s = String(d || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''; }
function soDigitos(t){ return String(t || '').replace(/\D/g, ''); }
function corHexSegura(c){ return /^#[0-9a-fA-F]{6}$/.test(String(c || '')) ? String(c) : ''; }
function urlImagemSegura(u){ return /^https:\/\/[^\s"'()<>\\]+$/.test(String(u || '')) ? String(u) : ''; }
// Telefone no formato nacional (DDD + numero), sem +55 e sem 0 inicial.
// Cuidado: 55 tambem e DDD (RS), por isso so remove o 55 quando sobra digito demais.
function telefoneNacional(v){
  let d = soDigitos(v);
  if(d.startsWith('55') && d.length > 11) d = d.slice(2);
  if(d.startsWith('0')) d = d.slice(1);
  return d;
}

async function loadData(){
  // Carrega so o necessario: master ve todas as empresas; gestor so a dele;
  // visitante so a empresa do subdominio (antes todo visitante baixava todas as empresas).
  let qEmpresas = supabaseClient.from('empresas').select('*');
  if(currentProfile?.role === 'master'){
    // todas
  } else if(currentProfile?.role === 'owner_empresa'){
    qEmpresas = currentProfile.empresa_id ? qEmpresas.eq('id', currentProfile.empresa_id) : null;
  } else {
    const _sub = slugDoSubdominio();
    qEmpresas = _sub ? qEmpresas.eq('slug', _sub) : null;
  }
  try{
    const { data, error } = qEmpresas ? await qEmpresas : { data: [], error: null };
    if(error) throw error;
    empresas = (data || []).map(e => ({
      id:                   e.id,
      slug:                 slugSeguro(e.slug),
      nome:                 e.nome                  || '',
      fotoUrl:              urlImagemSegura(e.foto_url),
      whatsapp:             soDigitos(e.whatsapp),

      bloqueada:            e.bloqueada,
      status:               e.status || 'ativa',
      trialExpiraEm:        e.trial_expira_em || null,
      // Campos de personalização (Fase 2)
      descricao:            e.descricao             || '',
      logo:                 urlImagemSegura(e.logo),
      corPrincipal:         sanitizeCor(e.cor_principal || '#3d1f3a'),
      textoDestaque:        e.texto_destaque        || '',
      // Mensagens de lembrete
      msgConfirmacao:       e.msg_confirmacao       || '',
      msgLembrete:          e.msg_lembrete          || '',
      msgInativo:           e.msg_inativo           || '',
      textoAgendar:         e.texto_agendar         || '',
      // Relações
      servicos:             [],
      horariosPorMes:       {},
      bloqueios:            [],
      botoes:               [],
      cancelamentoHoras:    e.cancelamento_horas ?? 2,
      tipo:                 e.tipo || 'agendamento'
    }));
  }catch(e){ console.error('Erro ao carregar empresas:', e); empresas = []; }

  if(empresas.length > 0){
    const ids = empresas.map(e => e.id);
    const podeVerDadosPessoais = currentProfile?.role === 'master'
                              || currentProfile?.role === 'owner_empresa';

    const queries = [
      supabaseClient.from('servicos').select('*').in('empresa_id', ids),
      supabaseClient.from('horarios_disponiveis').select('*').in('empresa_id', ids),
      supabaseClient.from('bloqueios').select('*').in('empresa_id', ids),
      supabaseClient.from('botoes_empresa').select('*').in('empresa_id', ids),
      podeVerDadosPessoais
        ? supabaseClient.from('agendamentos').select('*').in('empresa_id', ids)
        : supabaseClient.from('horarios_ocupados').select('*').in('empresa_id', ids),
      currentProfile?.role === 'master'
        ? supabaseClient.from('profiles').select('id, empresa_id, email, status').eq('role','owner_empresa')
        : Promise.resolve({ data: null })
    ];

    let rServicos, rHorarios, rBloqueios, rBotoes, rAg, rProfiles;
    try{
      [rServicos, rHorarios, rBloqueios, rBotoes, rAg, rProfiles] = await Promise.all(queries);
    }catch(e){
      console.error('Erro ao carregar dados:', e);
      agendamentos = []; return;
    }

    (rServicos.data || []).forEach(s => {
      const emp = empresas.find(e => e.id === s.empresa_id);
      if(emp && !emp.servicos.find(x => x.id === s.id)) emp.servicos.push({ id: s.id, nome: s.nome, duracao: s.duracao, preco: Number(s.preco) });
    });

    (rHorarios.data || []).forEach(h => {
      const emp = empresas.find(e => e.id === h.empresa_id);
      if(!emp) return;
      // _dias_ guarda dias da semana (0-6); as demais chaves guardam horarios HH:MM
      const valor = h.mes === '_dias_'
        ? (/^[0-6]$/.test(String(h.hora)) ? String(h.hora) : '')
        : horaSegura(h.hora);
      if(!valor) return;
      emp.horariosPorMes[h.mes] = emp.horariosPorMes[h.mes] || [];
      if(!emp.horariosPorMes[h.mes].includes(valor)) emp.horariosPorMes[h.mes].push(valor);
    });
    // Distingue empresa nunca configurada (_dias_ undefined = default todos os dias)
    // de empresa que explicitamente desativou todos os dias (_dias_ = [] vazio).
    // Se existem slots de dia específicos (_d0_ a _d6_) mas não existe _dias_,
    // significa que a empresa foi configurada e depois todos os dias foram removidos.
    empresas.forEach(e => {
      if(Object.keys(e.horariosPorMes).some(k => /^_d[0-6]_$/.test(k)) && !('_dias_' in e.horariosPorMes)){
        e.horariosPorMes['_dias_'] = [];
      }
    });

    (rBloqueios.data || []).forEach(b => {
      const emp = empresas.find(e => e.id === b.empresa_id);
      const data = dataSegura(b.data), hora = horaSegura(b.hora);
      if(emp && data && hora && !emp.bloqueios.find(x => x.id === b.id)) emp.bloqueios.push({ id: b.id, data, hora });
    });

    (rBotoes.data || []).forEach(b => {
      const emp = empresas.find(e => e.id === b.empresa_id);
      if(emp && !emp.botoes.find(x => x.id === b.id)) emp.botoes.push({
        id: b.id, nome: b.nome, tipo: b.tipo, link: b.link,
        icone: b.icone || '', ordem: b.ordem, ativo: b.ativo,
        abrirNovaAba: b.abrir_nova_aba, cor: corHexSegura(b.cor)
      });
    });
    empresas.forEach(e => e.botoes.sort((a, b) => a.ordem - b.ordem));

    // Agendamentos podem ser criados por qualquer visitante: data/hora/telefone fora do formato sao descartados
    const agsValidos = (rAg.data || []).filter(a => dataSegura(a.data) && horaSegura(a.hora));
    if(podeVerDadosPessoais){
      agendamentos = agsValidos.map(a => {
        const emp = empresas.find(e => e.id === a.empresa_id);
        let servicosNomes = [];
        try {
          const ids = JSON.parse(a.servicos_json || '[]');
          servicosNomes = ids.map(id => { const s = emp?.servicos?.find(x=>x.id===id); return s?.nome||''; }).filter(Boolean);
        } catch(e){}
        return {
          id:                  a.id,
          slug:                emp ? emp.slug : '',
          clienteId:           a.cliente_id || null,
          servicoId:           a.servico_id,
          servicoNome:         servicosNomes.length > 1 ? servicosNomes.join(', ') : a.servico_nome,
          servicosNomes:       servicosNomes,
          data:                dataSegura(a.data),
          hora:                horaSegura(a.hora),
          nome:                a.nome_cliente || '',
          telefone:            soDigitos(a.telefone),
          criadoEm:            a.criado_em,
          confirmacaoEnviada:  a.confirmacao_enviada || false,
          lembreteEnviado:     a.lembrete_enviado    || false,
          status:              a.status || 'nao_confirmado',
          tokenCurto:          a.token_curto ? String(a.token_curto).replace(/[^a-z0-9]/gi, '') : null
        };
      });
    } else {
      agendamentos = agsValidos.map(a => {
        const emp = empresas.find(e => e.id === a.empresa_id);
        return { slug: emp ? emp.slug : '', data: dataSegura(a.data), hora: horaSegura(a.hora) };
      });
    }

    (rProfiles.data || []).forEach(p => {
      const emp = empresas.find(e => e.id === p.empresa_id);
      if(emp){ emp.gestorEmail = p.email; emp.gestorStatus = p.status; emp.gestorUserId = p.id; }
    });
  } else {
    agendamentos = [];
  }
}

// Converte a empresa da memoria para as colunas do banco
function _linhaEmpresa(e){
  return {
    slug:                  e.slug,
    nome:                  e.nome,
    foto_url:              e.fotoUrl              || null,
    whatsapp:              e.whatsapp              || null,

    bloqueada:             e.bloqueada,
    status:                e.status || 'ativa',
    trial_expira_em:       e.trialExpiraEm || null,
    // Campos de personalização (Fase 2)
    descricao:             e.descricao             || null,
    logo:                  e.logo                  || null,
    cor_principal:         e.corPrincipal          || '#3d1f3a',
    texto_destaque:        e.textoDestaque         || null,
    cancelamento_horas:    e.cancelamentoHoras != null ? e.cancelamentoHoras : 2,
    tipo:                  e.tipo || 'agendamento',
  };
}

// Cria a empresa no banco e preenche e.id. Retorna o erro (ou null).
async function inserirEmpresa(e){
  const { data, error } = await supabaseClient.from('empresas').insert(_linhaEmpresa(e)).select('id').single();
  if(error){ console.error('Erro ao criar empresa:', error); return error; }
  e.id = data.id;
  return null;
}

// Atualiza SO as colunas informadas, SO desta empresa. Antes, salvar qualquer empresa
// regravava todas com os dados da memoria e desfazia alteracoes feitas pelos gestores.
async function atualizarEmpresa(e, colunas){
  const linha = _linhaEmpresa(e);
  const patch = {};
  colunas.forEach(c => { patch[c] = linha[c]; });
  const { error } = await supabaseClient.from('empresas').update(patch).eq('id', e.id);
  if(error) console.error('Erro ao atualizar empresa:', error);
  return error || null;
}
function slugify(s){
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
}

let currentRoute = { master:null, empresa:null, page:"" };

function getParams(){
  return currentRoute;
}
function slugDoSubdominio(){
  const parts = location.hostname.split('.');
  // helloah.agenplus.com.br → 4 partes, agenplus.com.br → 3 partes
  if(parts.length >= 4 && parts[0] !== 'www') return parts[0];
  // suporte a localhost (ex: helloah.localhost para testes)
  if(parts.length === 2 && parts[1] === 'localhost') return parts[0];
  return null;
}

// Em localhost (testes) os redirecionamentos ficam locais: slug.localhost:PORTA
const _ehLocal = location.hostname === 'localhost' || location.hostname.endsWith('.localhost');
function urlPrincipal(path){
  return _ehLocal ? `http://localhost:${location.port}${path}` : `https://agenplus.com.br${path}`;
}
function urlEmpresa(slug, path){
  return _ehLocal ? `http://${slug}.localhost:${location.port}${path}` : `https://${slug}.agenplus.com.br${path}`;
}

function goto(params){
  pararPolling();
  currentRoute = { master:null, empresa:null, page:"", ...params };
  const subSlug = slugDoSubdominio();

  if(params.master){
    if(subSlug){
      location.href = urlPrincipal('/master');
      return;
    }
    history.pushState(currentRoute, '', '/master');
  } else if(params.empresa){
    const slug = params.empresa;
    const path = params.page ? `/${params.page}` : '/';
    if(subSlug !== slug){
      // Usuarios autenticados ficam em agenplus.com.br para preservar sessao
      if(currentProfile?.role === 'master' || currentProfile?.role === 'owner_empresa'){
        const qs = params.page ? `/app.html?empresa=${slug}&page=${params.page}` : `/app.html?empresa=${slug}`;
        history.pushState(currentRoute, '', qs);
      } else {
        location.href = urlEmpresa(slug, path);
        return;
      }
    } else {
      history.pushState(currentRoute, '', path);
    }
  } else {
    history.pushState(currentRoute, '', '/');
  }
  route();
}
window.addEventListener('popstate', e => {
  if(e.state){ pararPolling(); currentRoute = e.state; route(); }
});

function defaultEmpresa(){
  return {
    slug:"", nome:"", fotoUrl:"", whatsapp:"", bloqueada:false, msgInativo:"",
    descricao:"", logo:"", corPrincipal:"#3d1f3a", textoDestaque:"",
    servicos:[], horariosPorMes:{}, bloqueios:[], botoes:[], cancelamentoHoras:2,
    tipo:"agendamento"
  };
}

// IMPORTANTE: usa a data LOCAL, não UTC.
// toISOString() converteria para UTC e, no Brasil (UTC-3), a partir
// das 21h o sistema passaria a considerar que já é o dia seguinte.
function mesKey(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
// Retorna slots para um dia da semana especifico (0=Dom...6=Sab).
// Usa _dN_ se existir; senao cai em _uni_ para compatibilidade.
function horariosParaDia(emp, diaSemana){
  const key = '_d' + diaSemana + '_';
  const hpm = emp.horariosPorMes || {};
  if(hpm[key]) return [...hpm[key]].sort();
  return [...(hpm['_uni_'] || [])].sort();
}
function isoData(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function gerarTokenCurto(){
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let t = '';
  for(let i=0;i<8;i++) t += chars[Math.floor(Math.random()*chars.length)];
  return t;
}

const root = document.getElementById('root');
function render(html){ root.innerHTML = html; }

function toast(msg, type='info', ms=3200){
  let c = document.getElementById('toast-root');
  if(!c){ c = document.createElement('div'); c.id='toast-root'; document.body.appendChild(c); }
  const el = document.createElement('div');
  el.className = `toast${type==='ok'?' ok':type==='err'?' err':''}`;
  el.textContent = msg;
  c.appendChild(el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
  setTimeout(()=>{
    el.classList.remove('show');
    el.addEventListener('transitionend',()=>el.remove(),{once:true});
    // Garante a remocao mesmo se a transicao nao disparar (aba em segundo plano, animacoes desligadas)
    setTimeout(()=>el.remove(), 500);
  }, ms);
}
function friendlyError(err, fallback='Algo deu errado. Tente novamente.'){
  if(!err) return fallback;
  if(err.code==='23505'){
    // Duplicidade: so e "horario ocupado" quando a restricao violada e a de agendamentos
    const txt = (err.message || '') + ' ' + (err.details || '');
    return /agendamentos/i.test(txt) ? 'Esse horário já está reservado. Escolha outro.' : 'Este registro já existe.';
  }
  if(err.code==='42501'||err.code==='PGRST301') return 'Sem permissão para esta ação.';
  if(err.message && err.message.toLowerCase().includes('network')) return 'Sem conexão. Verifique sua internet.';
  return fallback;
}
function mensagemErroRede(e){
  if(!navigator.onLine) return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
  if(e && (e.name==='TypeError' || e.message?.includes('Failed to fetch'))) return 'Não foi possível conectar ao servidor. Tente novamente em instantes.';
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

function fmtTelStr(val){
  if(!val) return '';
  const d = telefoneNacional(val).slice(0,11);
  if(d.length > 7) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if(d.length > 2) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return d;
}
window.maskTel = (input)=>{
  input.value = fmtTelStr(input.value);
};

let _pollFn = null;
function iniciarPolling(fn){
  pararPolling();
  _pollFn = fn;
}
function pararPolling(){
  _pollFn = null;
}
// Recarrega os dados da tela aberta (painel master ou gestao).
// Roda ao voltar para a aba e a cada 60s enquanto a aba esta visivel.
let _atualizandoDados = false;
async function atualizarDadosDaTela(){
  if(document.hidden || !_pollFn || _atualizandoDados) return;
  _atualizandoDados = true;
  try {
    await loadData();
    if(_pollFn) _pollFn();
    // Se a gestao estiver na aba de clientes, recarrega a lista junto
    if(typeof window._recarregarClientes === 'function') window._recarregarClientes();
  } finally {
    _atualizandoDados = false;
  }
}
document.addEventListener('visibilitychange', atualizarDadosDaTela);
setInterval(atualizarDadosDaTela, 60000);

// ---------- INIT ----------
let _appInitialized = false;
async function init(){
  render(`<div class="loading-wrap"><div class="spinner spinner-dark" style="width:28px;height:28px;"></div><div>Carregando…</div></div>`);

  // Estabelece sessao a partir de tokens no hash (redirect cross-domain)
  const _hp = new URLSearchParams(location.hash.slice(1));
  const _at = _hp.get('access_token'), _rt = _hp.get('refresh_token');
  if(_at && _rt){
    const _tipo = _hp.get('type');
    try { await supabaseClient.auth.setSession({ access_token: _at, refresh_token: _rt }); } catch(e){}
    history.replaceState(null, '', location.pathname + location.search);
    if(_tipo === 'recovery'){
      modoRecuperacao = true;
      const { data: { session: _sr } } = await supabaseClient.auth.getSession();
      currentUser = _sr?.user || null;
      renderRedefinirSenha();
      return;
    }
    // Busca perfil e roteia diretamente, sem depender do onAuthStateChange
    const { data: { session: _s } } = await supabaseClient.auth.getSession();
    if(_s?.user){
      currentUser = _s.user;
      const { data: _p, error: _profErr3 } = await supabaseClient.from('profiles').select('*').eq('id', _s.user.id).single();
      if(_profErr3 && _profErr3.code !== 'PGRST116') console.error('Erro ao carregar perfil (redirect):', _profErr3);
      currentProfile = _p || null;
      await loadData();
      if(currentProfile?.role === 'master'){
        // Se a URL tem ?ag= nao redireciona, deixa o roteamento normal mostrar a pagina de confirmacao
        if(!new URLSearchParams(location.search).get('ag')){
          goto({ master: 1 }); _appInitialized = true; return;
        }
      } else if(currentProfile?.role === 'owner_empresa'){
        const _e = empresas.find(e => e.id === currentProfile.empresa_id);
        // Se a URL tem ?ag= nao redireciona, deixa o roteamento normal mostrar a pagina de confirmacao
        if(_e && !new URLSearchParams(location.search).get('ag')){ goto({ empresa: _e.slug, page: 'gestao' }); _appInitialized = true; return; }
      }
    }
  }

  // Escuta mudanças de auth (inclui PASSWORD_RECOVERY vindo do e-mail)
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      // Trava a navegação: sem isso, o route() no fim do init()
      // apagaria a tela de redefinição assim que ela aparecesse.
      modoRecuperacao = true;
      currentUser = session?.user || null;
      renderRedefinirSenha();
      return;
    }
    currentUser = session?.user || null;
    if (currentUser) {
      const { data, error: profErr } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
      if(profErr && profErr.code !== 'PGRST116') console.error('Erro ao carregar perfil:', profErr);
      currentProfile = data || null;
    } else {
      currentProfile = null;
    }

    if (event === 'SIGNED_IN' && !_appInitialized && currentUser && currentProfile && location.pathname !== '/cadastro' && location.pathname !== '/login') {
      await loadData();
      const _goto = localStorage.getItem('ob_goto');
      if (_goto) {
        localStorage.removeItem('ob_goto');
        try {
          goto(JSON.parse(_goto)); return;
        } catch(e){}
      }
      if(!new URLSearchParams(location.search).get('ag')){
        if (currentProfile.role === 'master') {
          goto({ master: 1 });
        } else if (currentProfile.role === 'owner_empresa') {
          const emp = empresas.find(e => e.id === currentProfile.empresa_id);
          if (emp) goto({ empresa: emp.slug, page: 'gestao' });
        }
      }
    }
  });

  // Sessão existente (ex: ao recarregar a página)
  const { data: { session } } = await supabaseClient.auth.getSession();
  currentUser = session?.user || null;
  if (currentUser) {
    const { data, error: profErr2 } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
    if(profErr2 && profErr2.code !== 'PGRST116') console.error('Erro ao carregar perfil:', profErr2);
    currentProfile = data || null;
    // Usuario autenticado sem perfil = conta orfa (sem gestao associada), trata como anonimo
    if(!currentProfile){ await supabaseClient.auth.signOut(); currentUser = null; }
  }

  await loadData();
  if(modoRecuperacao) return;   // não sobrepõe a tela de redefinir senha

  const _obGoto = localStorage.getItem('ob_goto');
  if(_obGoto && currentUser){
    localStorage.removeItem('ob_goto');
    try {
      const t = JSON.parse(_obGoto);
      currentRoute = { master: null, empresa: null, page: '', ...t };
      route(); return;
    } catch(e){}
  }

  const subSlug = slugDoSubdominio();
  const path = location.pathname.replace(/^\/+|\/+$/g, ''); // ex: 'gestao', 'master', 'login', ''

  if(subSlug){
    // Subdomínio: helloah.agenplus.com.br
    currentRoute.empresa = subSlug;
    // _p vem do redirect do index.html quando o rewrite do Vercel não pega
    const _pParam = new URLSearchParams(location.search).get('_p') || '';
    const subPage = _pParam || (path === 'app.html' ? '' : path);
    const agParam = new URLSearchParams(location.search).get('ag');
    if(agParam){ currentRoute.page = 'ag'; currentRoute.agId = agParam; }
    else if(subPage === 'gestao')      currentRoute.page = 'gestao';
    else if(subPage === 'agendar')     currentRoute.page = 'agendar';
    // Limpa /app.html da URL para ficar estetico
    if(path === 'app.html' || _pParam){
      const cleanPath = currentRoute.page === 'ag'
        ? '/?ag=' + encodeURIComponent(currentRoute.agId)
        : (currentRoute.page ? '/' + currentRoute.page : '/');
      history.replaceState(currentRoute, '', cleanPath);
    }
  } else if(path === 'cadastro'){
    renderCadastro(); return;
  } else if(path === 'master'){
    currentRoute.master = 1;
  } else if(path === 'login'){
    if(currentUser && currentProfile){
      // ja logado: redireciona para o destino correto
      if(currentProfile.role === 'master'){
        history.replaceState(null,'','/master');
        currentRoute = { master: 1 };
      } else {
        const _empLogin = empresas.find(e => e.id === currentProfile.empresa_id);
        if(_empLogin){
          history.replaceState(null,'','/gestao');
          currentRoute = { empresa: _empLogin.slug, page: 'gestao' };
        } else {
          renderLoginUnificado(); return;
        }
      }
    } else {
      renderLoginUnificado(); return;
    }
  } else {
    const qp = new URLSearchParams(location.search);
    const qEmpresa = qp.get('empresa');
    const qPage = qp.get('page');
    if(qEmpresa && currentUser){
      currentRoute.empresa = qEmpresa;
      if(qPage) currentRoute.page = qPage;
    } else if(currentProfile?.role === 'master'){
      currentRoute.master = 1;
    } else if(currentProfile?.role === 'owner_empresa'){
      const emp = empresas.find(e => e.id === currentProfile.empresa_id);
      if(emp){ goto({ empresa: emp.slug, page: 'gestao' }); return; }
    } else {
      renderLoginUnificado(); return;
    }
  }
  route();
  _appInitialized = true;
}

function route(){
  const {master, empresa, page} = getParams();
  // #35: o resumo do ultimo agendamento so vale ate a proxima navegacao
  lastBooking = null;
  if(master){
    renderMaster();
  } else if(empresa){
    const emp = empresas.find(e=>e.slug===empresa);
    if(!emp){ renderNotFound(); return; }
    if(page==="agendar") renderAgendar(emp);
    else if(page==="ag") renderAgConfirmar(emp, currentRoute.agId);
    else if(page==="gestao"){
      const isMaster = currentProfile?.role === 'master';
      const isOwner  = currentProfile?.role === 'owner_empresa'
                    && currentProfile?.empresa_id === emp.id
                    && currentProfile?.status === 'ativo';
      if(isMaster || isOwner){
        if(emp.bloqueada && !isMaster){
          render(`${barraVoltarMaster()}<div class="container"><div class="empty"><h2 class="display">Empresa bloqueada</h2><p>Esta empresa está bloqueada pelo administrador. Entre em contato para mais informações.</p></div></div>`);
        } else { renderGestao(emp); }
      } else {
        localStorage.setItem('ob_goto', JSON.stringify({ empresa: emp.slug, page: 'gestao' }));
        renderLoginUnificado();
      }
    }
    else renderHome(emp);
  } else {
    renderMaster();
  }
}

function barraVoltarMaster(){
  if(currentProfile?.role !== 'master') return "";
  return `<div style="background:#f0f0f0;color:#1a1a1a;padding:10px 20px;text-align:center;font-size:13px;font-weight:700;">
    Modo visualização (via painel master) — <span role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goto({master:1})}" style="text-decoration:underline;cursor:pointer;" onclick="goto({master:1})">Voltar ao painel master</span>
  </div>`;
}

function renderNotFound(){
  render(`<div class="container"><div class="empty"><h2 class="display">Empresa não encontrada</h2><p>Verifique o link e tente novamente.</p></div></div>`);
}

function setPageMeta(title, description, imageUrl){
  document.title = title;
  // Cria a tag com o name/property correto quando ela ainda nao existe
  // (antes criava uma <meta> vazia a cada chamada, que nunca era reencontrada)
  const setMeta = (attr, chave, val) => {
    let el = document.querySelector(`meta[${attr}="${chave}"]`);
    if(!el){ el = document.createElement('meta'); el.setAttribute(attr, chave); document.head.appendChild(el); }
    el.setAttribute('content', val);
  };
  setMeta('name', 'description', description || '');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description || '');
  if(imageUrl) setMeta('property', 'og:image', imageUrl);
}

