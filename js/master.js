// ---------- PAINEL MASTER ----------
function setFavicon(show){
  const el = document.getElementById('favicon');
  if(el) el.href = show ? '/favicon.png' : 'data:,';
}

function renderMaster(){
  if(currentProfile?.role !== 'master'){ renderLoginUnificado(); return; }
  setFavicon(true);
  renderMasterPanel();
}

let editingSlug = null;
let masterSearch = '';
let masterAba = 'dashboard'; // 'dashboard' | 'empresas' | 'financeiro'
let _filtroEmpStatus = 'todos'; // 'todos' | 'ativa' | 'trial' | 'bloqueada'
let financeiroData = []; // registros da tabela financeiro
let _masterDetalheSlug = null; // slug da empresa aberta no detalhe
let mensalidades = []; // historico de mensalidades por empresa
let _finPeriodo = (()=>{ const n=new Date(); return {mes:n.getMonth(),ano:n.getFullYear()}; })();
let _finDetalheEmpId = null; // empresa aberta no detalhe financeiro

async function carregarFinanceiro(){
  const { data, error } = await supabaseClient.from('financeiro').select('*');
  if(!error && data) financeiroData = data;
}

async function carregarMensalidades(){
  const { data, error } = await supabaseClient.from('mensalidades').select('*').order('referencia', { ascending:false });
  if(!error && data) mensalidades = data;
}

function renderMasterPanel(){
  applyAccent('#1c1917');
  document.title = 'Painel Master — Agen+';

  const M_ICO = {
    dashboard:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    empresas:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><rect x="2" y="7" width="20" height="15" rx="1"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="8" y1="12" x2="8" y2="16"/><line x1="16" y1="12" x2="16" y2="16"/></svg>`,
    financeiro:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    sair:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  };

  const MASTER_NAV = [
    { id:'dashboard',  label:'Dashboard',  ico: M_ICO.dashboard },
    { id:'empresas',   label:'Empresas',   ico: M_ICO.empresas },
    { id:'financeiro', label:'Financeiro', ico: M_ICO.financeiro },
  ];

  let masterDrawerMode = null; // null | 'criar' | 'editar'

  const SIDEBAR_CSS = `
    <style>
      .ml { display:flex; flex-direction:column; min-height:100vh; }
      .ml-content { flex:1; padding:24px 20px 80px; max-width:700px; margin:0 auto; width:100%; }

      /* Bottom nav mobile */
      .m-nav { position:fixed; bottom:0; left:0; right:0; height:60px; background:#fff; box-shadow:0 -4px 16px rgba(0,0,0,.10); display:flex; align-items:stretch; z-index:200; }
      .m-nb { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; border:none; background:none; color:#bbb; cursor:pointer; font-size:11px; font-weight:600; font-family:inherit; transition:color .15s; padding:0; }
      .m-nb:hover { color:#888; }
      .m-nb.on { color:#1a1a1a; }
      .m-nb-ico { width:22px; height:22px; }

      /* Desktop sidebar */
      @media(min-width:768px){
        .ml { flex-direction:row; }
        .ml-content { padding-bottom:24px; }
        .m-nav { position:sticky; top:0; height:100vh; width:140px; flex-direction:column; box-shadow:none; border-right:1px solid var(--line); }
        .m-nb { flex:none; flex-direction:row; justify-content:flex-start; gap:10px; padding:14px 18px; font-size:13px; }
        .m-nb.on { background:#f5f5f5; color:#1a1a1a; }
        .m-nb-ico { width:18px; height:18px; }
      }

      /* Stat strip */
      .m-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:24px; }
      .m-stat { background:var(--paper); border:1px solid var(--line); border-radius:12px; padding:14px 16px; }
      .m-stat-val { font-size:24px; font-weight:800; line-height:1; color:var(--ink); }
      .m-stat-label { font-size:11px; color:var(--ink-soft); margin-top:5px; text-transform:uppercase; letter-spacing:.04em; }

      /* Section header */
      .m-sh { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; gap:12px; }
      .m-sh-title { font-size:16px; font-weight:800; color:var(--ink); }
      .m-sh-sub { font-size:13px; color:var(--ink-soft); margin-top:1px; }

      /* Add button */
      .m-add { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; background:#111; color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:700; font-family:inherit; cursor:pointer; white-space:nowrap; flex-shrink:0; }
      .m-add:hover { opacity:.85; }
      .m-add svg { width:15px; height:15px; }

      /* Search */
      .m-search { width:100%; padding:10px 14px; border:1.5px solid var(--line); border-radius:10px; font-size:14px; background:var(--paper); outline:none; font-family:inherit; color:var(--ink); margin-bottom:14px; }
      .m-search:focus { border-color:#888; }

      /* Status badges */
      .m-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; white-space:nowrap; }
      .m-badge-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
      .m-badge.ativa     { background:#dcfce7; color:#16a34a; }
      .m-badge.trial     { background:#fef3c7; color:#b45309; }
      .m-badge.bloqueada { background:#fee2e2; color:#dc2626; }

      /* Fin filter tabs */
      .m-tabs { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
      .m-tab { padding:6px 14px; border-radius:20px; border:1.5px solid var(--line); font-size:13px; cursor:pointer; background:var(--paper); color:var(--ink); font-family:inherit; font-weight:600; transition:background .12s, color .12s; }
      .m-tab.on { background:#111; color:#fff; border-color:#111; }

      /* Form view (substitui drawer) */
      .m-back { display:inline-flex; align-items:center; gap:8px; border:none; background:none; color:var(--ink-soft); font-size:14px; font-weight:600; cursor:pointer; padding:0 0 20px; font-family:inherit; }
      .m-back:hover { color:var(--ink); }
      .m-back svg { width:18px; height:18px; }
      .m-form-title { font-size:20px; font-weight:800; color:var(--ink); margin-bottom:24px; }
      .m-form-actions { display:flex; flex-direction:column; gap:8px; margin-top:24px; }

      /* Edit form novo */
      .m-emp-header { display:flex; align-items:center; gap:14px; margin-bottom:24px; }
      .m-emp-avatar { width:50px; height:50px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; color:#fff; flex-shrink:0; }
      .m-emp-header-name { font-size:21px; font-weight:800; color:var(--ink); letter-spacing:-0.4px; }
      .m-emp-header-link { font-size:12px; color:var(--ink-soft); margin-top:2px; }
      .m-section { background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden; margin-bottom:12px; }
      .m-section-title { font-size:11px; font-weight:700; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.06em; padding:12px 16px 0; }
      .m-field-row { padding:10px 16px; border-bottom:0.5px solid var(--line); }
      .m-field-row:last-child { border-bottom:none; }
      .m-field-lbl { font-size:11px; font-weight:700; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px; }
      .m-field-inp { width:100%; border:1.5px solid var(--line); border-radius:9px; outline:none; font-size:15px; color:var(--ink); font-family:inherit; background:#fff; padding:9px 12px; margin-top:4px; }
      .m-field-inp:focus { border-color:#3d1f3a; }
      .m-field-inp::placeholder { color:var(--ink-soft); }
      .m-field-hint { font-size:11px; color:var(--ink-soft); margin-top:3px; }
      .m-link-row { display:flex; align-items:center; gap:3px; }
      .m-link-pfx { font-size:13px; color:var(--ink-soft); white-space:nowrap; }
      .m-link-inp { flex:1; border:1.5px solid var(--line); border-radius:9px; outline:none; font-size:15px; color:var(--accent); font-family:inherit; background:#fff; font-weight:600; min-width:0; padding:7px 10px; }
      .m-link-inp:focus { border-color:#3d1f3a; }
      .m-status-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:12px 16px; }
      .m-status-opt { border:2px solid var(--line); border-radius:12px; padding:10px 6px; text-align:center; cursor:pointer; transition:all .14s; background:var(--paper); }
      .m-status-opt:hover { border-color:#c4b5c0; }
      .m-status-opt.s-ativa     { border-color:#16a34a; background:#dcfce7; }
      .m-status-opt.s-trial     { border-color:#f59e0b; background:#fef3c7; }
      .m-status-opt.s-bloqueada { border-color:#dc2626; background:#fee2e2; }
      .m-status-dot { width:8px; height:8px; border-radius:50%; margin:0 auto 5px; background:var(--line); }
      .m-status-opt.s-ativa     .m-status-dot { background:#16a34a; }
      .m-status-opt.s-trial     .m-status-dot { background:#f59e0b; }
      .m-status-opt.s-bloqueada .m-status-dot { background:#dc2626; }
      .m-status-lbl { font-size:13px; font-weight:700; color:var(--ink-soft); }
      .m-status-opt.s-ativa     .m-status-lbl { color:#16a34a; }
      .m-status-opt.s-trial     .m-status-lbl { color:#b45309; }
      .m-status-opt.s-bloqueada .m-status-lbl { color:#dc2626; }
      .m-status-sub { font-size:11px; color:var(--ink-soft); margin-top:2px; }
      .m-btn-save { width:100%; height:46px; background:var(--accent); color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; margin-bottom:10px; }
      .m-acoes-sec { display:flex; gap:8px; }
      .m-btn-sec { flex:1; height:38px; border:1.5px solid var(--line); border-radius:10px; background:var(--paper); font-size:13px; font-weight:600; color:var(--ink-soft); cursor:pointer; font-family:inherit; }
      .m-btn-sec:hover { border-color:#c4b5c0; color:var(--ink); }
      .m-btn-del { flex:1; height:38px; border:1.5px solid #fca5a5; border-radius:10px; background:var(--paper); font-size:13px; font-weight:600; color:#dc2626; cursor:pointer; font-family:inherit; }
      .m-btn-del:hover { background:#fee2e2; }

      /* Seletor de tipo de conta */
      .m-tipo-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px; }
      .m-tipo-opt { border:2px solid var(--line); border-radius:12px; padding:12px 10px; cursor:pointer; transition:all .14s; background:var(--paper); }
      .m-tipo-opt:hover { border-color:#c4b5c0; }
      .m-tipo-opt.sel { border-color:#3d1f3a; background:#f3eef5; }
      .m-tipo-opt-title { font-size:13px; font-weight:700; color:var(--ink); margin-bottom:3px; }
      .m-tipo-opt-sub { font-size:11px; color:var(--ink-soft); line-height:1.4; }
      .m-tipo-opt.sel .m-tipo-opt-title { color:#3d1f3a; }

      /* Empresa card clicavel */
      .m-ec { cursor:pointer; display:flex; align-items:center; gap:12px; padding:13px 16px; background:#fff; border:1px solid var(--line); border-radius:14px; transition:background .1s; }
      .m-ec:hover { border-color:#bbb; background:#faf9fc; }
      .m-ec-body { flex:1; min-width:0; }
      .m-ec-name { font-size:14px; font-weight:700; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .m-ec-link { font-size:12px; color:var(--ink-soft); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .m-chevron { color:var(--line); flex-shrink:0; }
      .m-chevron svg { width:16px; height:16px; display:block; }

      /* Detalhe empresa */
      .m-det-header { background:#fff; border:1px solid var(--line); border-radius:14px; padding:18px; margin-bottom:14px; display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
      .m-det-info { flex:1; min-width:0; }
      .m-det-nome { font-size:18px; font-weight:800; color:var(--ink); letter-spacing:-.3px; }
      .m-det-slug { font-size:12px; color:var(--ink-soft); margin-top:2px; }
      .m-det-badges { display:flex; gap:6px; margin-top:6px; flex-wrap:wrap; }
      .m-det-right { text-align:right; flex-shrink:0; }
      .m-det-venc-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--ink-soft); }
      .m-det-venc-val { font-size:15px; font-weight:800; color:var(--ink); margin-top:2px; }

      /* Historico pagamentos detalhe */
      .m-pag-sec { background:#fff; border:1px solid var(--line); border-radius:14px; overflow:hidden; margin-bottom:14px; }
      .m-pag-head { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--line); }
      .m-pag-title { font-size:13px; font-weight:700; color:var(--ink); }

      /* Acoes grid no detalhe */
      .m-acoes-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:12px 16px; }
      .m-acao-btn { display:flex; align-items:center; gap:10px; padding:11px 12px; border:1.5px solid var(--line); border-radius:12px; background:var(--paper); cursor:pointer; font-family:inherit; transition:border-color .12s,background .12s; text-align:left; }
      .m-acao-btn:hover { border-color:#c4b5c0; background:#faf9fc; }
      .m-acao-btn.danger { border-color:var(--line); }
      .m-acao-btn.danger:hover { background:#fff5f5; }
      .m-acao-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .m-acao-label { font-size:13px; font-weight:700; color:var(--ink); line-height:1.2; }
      .m-acao-sub { font-size:11px; color:var(--ink-soft); margin-top:2px; }
      .m-acao-btn.danger .m-acao-label { color:#dc2626; }

      /* Financeiro novo */
      .m-fin-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; gap:10px; flex-wrap:wrap; }
      .m-period-nav { display:flex; align-items:center; background:var(--paper); border:1px solid var(--line); border-radius:10px; overflow:hidden; }
      .m-period-btn { width:34px; height:34px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--ink-soft); transition:background .1s; }
      .m-period-btn:hover { background:var(--paper); color:var(--ink); }
      .m-period-lbl { padding:0 14px; font-size:14px; font-weight:700; color:var(--ink); border-left:1px solid var(--line); border-right:1px solid var(--line); height:34px; display:flex; align-items:center; white-space:nowrap; }
      .m-btn-csv { display:flex; align-items:center; gap:6px; height:34px; padding:0 14px; border:1.5px solid var(--line); border-radius:10px; background:var(--paper); font-size:13px; font-weight:600; color:var(--ink-soft); cursor:pointer; font-family:inherit; }
      .m-btn-csv:hover { border-color:#c4b5c0; }
      .m-sum-row { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
      .m-sum-card { background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 16px; position:relative; overflow:hidden; }
      .m-sum-stripe { position:absolute; left:0; top:0; bottom:0; width:4px; }
      .m-sum-card.sg .m-sum-stripe { background:#16a34a; }
      .m-sum-card.sa .m-sum-stripe { background:#f59e0b; }
      .m-sum-card.sr .m-sum-stripe { background:#dc2626; }
      .m-sum-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--ink-soft); margin-bottom:5px; }
      .m-sum-val { font-size:20px; font-weight:800; letter-spacing:-.4px; font-variant-numeric:tabular-nums; }
      .m-sum-card.sg .m-sum-val { color:#16a34a; }
      .m-sum-card.sa .m-sum-val { color:#b45309; }
      .m-sum-card.sr .m-sum-val { color:#dc2626; }
      .m-sum-sub { font-size:11px; color:var(--ink-soft); margin-top:3px; }
      .m-chart-wrap { background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px 18px 14px; margin-bottom:16px; }
      .m-chart-title { font-size:13px; font-weight:700; color:var(--ink); margin-bottom:12px; }
    </style>
  `;

  if(!document.getElementById('sidebar-css')){ const _ss=document.createElement('div'); _ss.innerHTML=SIDEBAR_CSS; const _el=_ss.firstElementChild; _el.id='sidebar-css'; document.head.appendChild(_el); }

  window.masterSearchInput = (v, ss) => {
    masterSearch = v;
    drawMaster();
    const inp = document.querySelector('.m-search');
    if(inp){ inp.focus(); try{ inp.setSelectionRange(ss, ss); }catch(_){} }
  };

  function drawMasterShell(conteudo){
    const navItems = MASTER_NAV.map(n=>`
      <button class="m-nb ${masterAba===n.id?'on':''}" onclick="masterIrAba('${n.id}')">
        <span class="m-nb-ico">${n.ico}</span><span>${n.label}</span>
      </button>`).join('');

    render(`
      <div class="ml">
        <nav class="m-nav">
          ${navItems}
          <button class="m-nb" onclick="masterLogout()" style="margin-top:auto;">
            <span class="m-nb-ico">${M_ICO.sair}</span><span>Sair</span>
          </button>
        </nav>
        <div class="ml-content">${conteudo}</div>
      </div>
    `);
  }

  window.masterFecharDrawer = () => { masterDrawerMode = null; editingSlug = null; draw(); };
  window.masterAbrirDrawer  = (mode) => { masterDrawerMode = mode; editingSlug = null; draw(); };

  function draw(){
    if(masterAba === 'dashboard') drawDashboard();
    else if(masterAba === 'empresas') drawEmpresas();
    else if(masterAba === 'financeiro') drawFinanceiro();
  }

  // Status real salvo no banco. Trial vencido continua 'trial' (a empresa NAO e bloqueada
  // automaticamente; o gestor so recebe um aviso). Antes aparecia como 'bloqueada' e a tela
  // de edicao ja vinha com "Bloqueada" marcado, bloqueando a empresa ao salvar qualquer campo.
  function _empStatus(e){
    if(e.bloqueada || e.status === 'bloqueada') return 'bloqueada';
    return e.status === 'trial' ? 'trial' : 'ativa';
  }
  function _diasTrialRestantes(e){
    if(!e.trialExpiraEm) return null;
    const diff = Math.ceil((new Date(e.trialExpiraEm) - new Date()) / 86400000);
    return diff;
  }
  function _trialLabel(e){
    const dias = _diasTrialRestantes(e);
    if(dias === null) return 'Trial';
    return dias < 0 ? 'Trial vencido' : `Trial · ${dias}d`;
  }
  function _statusBadgeHtml(e){
    const s = _empStatus(e);
    const label = s === 'trial' ? _trialLabel(e) : s === 'ativa' ? 'Ativa' : 'Bloqueada';
    return `<span class="m-badge ${s}"><span class="m-badge-dot"></span>${label}</span>`;
  }

  function drawDashboard(){
    const total     = empresas.length;
    const nAtivas   = empresas.filter(e=>_empStatus(e)==='ativa').length;
    const nTrial    = empresas.filter(e=>_empStatus(e)==='trial').length;
    const nBloq     = empresas.filter(e=>_empStatus(e)==='bloqueada').length;

    // Trial expirando em até 3 dias
    const expirando = empresas.filter(e=>{
      if(_empStatus(e)!=='trial') return false;
      const d = _diasTrialRestantes(e);
      return d !== null && d <= 3;
    }).sort((a,b)=>_diasTrialRestantes(a)-_diasTrialRestantes(b));

    const hoje = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const hojeStr = hoje.charAt(0).toUpperCase() + hoje.slice(1);

    const alertaHtml = expirando.length ? `
      <div style="background:#fff8f0;border:1px solid #fcd34d;border-radius:14px;padding:14px 18px;display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>
          <div style="font-size:14px;font-weight:700;color:#92400e;">${expirando.length} empresa${expirando.length!==1?'s':''} com trial vencido ou vencendo em até 3 dias</div>
          <div style="font-size:13px;color:#b45309;margin-top:3px;">${expirando.map(e=>{ const d=_diasTrialRestantes(e); return `${escapeHtml(e.nome)} (${d < 0 ? 'vencido' : d+'d'})`; }).join(' · ')}</div>
        </div>
      </div>` : '';

    drawMasterShell(`
      <div class="m-sh" style="margin-bottom:20px;">
        <div>
          <div class="m-sh-title">Dashboard</div>
          <div class="m-sh-sub">${hojeStr}</div>
        </div>
      </div>
      <div class="m-stats" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px;">
        <div class="m-stat"><div class="m-stat-val">${total}</div><div class="m-stat-label">Total</div></div>
        <div class="m-stat"><div class="m-stat-val" style="color:#16a34a;">${nAtivas}</div><div class="m-stat-label">Ativas</div></div>
        <div class="m-stat"><div class="m-stat-val" style="color:#b45309;">${nTrial}</div><div class="m-stat-label">Trial</div></div>
        <div class="m-stat"><div class="m-stat-val" style="color:#dc2626;">${nBloq}</div><div class="m-stat-label">Bloqueadas</div></div>
      </div>
      ${alertaHtml}
    `);
  }

  const ICO_BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

  function drawEmpresas(){
    const editing = editingSlug ? empresas.find(e=>e.slug===editingSlug) : null;

    // Formulario de criar — substitui a lista
    if(masterDrawerMode === 'criar'){
      drawMasterShell(`
        <button class="m-back" onclick="masterFecharDrawer()">${ICO_BACK} Voltar</button>
        <div class="m-form-title">Nova empresa</div>
        <div class="field">
          <label>Tipo de conta</label>
          <div class="m-tipo-grid">
            <div class="m-tipo-opt sel" id="tipoAgendamento" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();masterSelTipo('agendamento')}" onclick="masterSelTipo('agendamento')">
              <div class="m-tipo-opt-title">Agendamento</div>
              <div class="m-tipo-opt-sub">Agenda, clientes, relatorios e financeiro</div>
            </div>
            <div class="m-tipo-opt" id="tipoPagina" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();masterSelTipo('pagina')}" onclick="masterSelTipo('pagina')">
              <div class="m-tipo-opt-title">Pagina</div>
              <div class="m-tipo-opt-sub">Apenas links e presenca online</div>
            </div>
          </div>
          <input type="hidden" id="novoTipo" value="agendamento"/>
        </div>
        <div class="field"><label>Nome da empresa</label><input id="novoNome" placeholder="Ex: Studio Bella"/></div>
        <div class="field"><label>WhatsApp</label><input id="novoWhats" type="tel" inputmode="numeric" maxlength="16" placeholder="(xx) xxxxx-xxxx" onkeydown="if(event.key.length===1&&!/[0-9]/.test(event.key))event.preventDefault()" oninput="maskTel(this)"/></div>
        <div class="field"><label>E-mail do gestor</label><input type="email" id="novoEmail" placeholder="gestor@email.com"/></div>
        <div class="field"><label>Senha temporária</label><input type="password" id="novaSenha" placeholder="Mínimo 6 caracteres"/></div>
        <input type="hidden" id="novaCor" value="#3d1f3a"/>
        <div class="m-form-actions">
          <button class="btn" style="width:100%;" onclick="masterCriar()">Criar empresa</button>
          <button class="btn ghost" style="width:100%;" onclick="masterFecharDrawer()">Cancelar</button>
        </div>
      `);
      return;
    }

    // Formulario de editar — substitui a lista
    if(masterDrawerMode === 'editar' && editing){
      const initiais = (editing.nome||'?').split(' ').filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const stAtual = _empStatus(editing);
      const diasTrial = editing.trialExpiraEm ? _diasTrialRestantes(editing) : null;
      const statusSub = {
        ativa:     'acesso completo',
        trial:     diasTrial === null ? 'período de teste' : diasTrial < 0 ? `vencido há ${-diasTrial}d` : `${diasTrial}d restantes`,
        bloqueada: 'sem acesso',
      };
      drawMasterShell(`
        <button class="m-back" onclick="masterFecharDrawer()">${ICO_BACK} Voltar</button>
        <div class="m-emp-header">
          <div class="m-emp-avatar" style="background:${escapeAttr(editing.corPrincipal||'#3d1f3a')}">${escapeHtml(initiais)}</div>
          <div>
            <div class="m-emp-header-name">${escapeHtml(editing.nome)}</div>
            <div class="m-emp-header-link">${escapeHtml(editing.slug)}.agenplus.com.br</div>
          </div>
        </div>
        <div class="m-section">
          <div class="m-section-title">Dados</div>
          <div class="m-field-row">
            <div class="m-field-lbl">Nome</div>
            <input class="m-field-inp" id="editNome" maxlength="100" value="${escapeAttr(editing.nome)}"/>
          </div>
          <div class="m-field-row">
            <div class="m-field-lbl">WhatsApp</div>
            <input class="m-field-inp" id="editWhats" type="tel" inputmode="numeric" maxlength="16" value="${escapeAttr(fmtTelStr(editing.whatsapp))}" onkeydown="if(event.key.length===1&&!/[0-9]/.test(event.key))event.preventDefault()" oninput="maskTel(this)"/>
          </div>
          <div class="m-field-row">
            <div class="m-field-lbl">Link público</div>
            <div class="m-link-row">
              <span class="m-link-pfx">https://</span>
              <input class="m-link-inp" id="masterSlugInput" value="${escapeAttr(editing.slug)}" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9-]/g,'')"/>
              <span class="m-link-pfx">.agenplus.com.br</span>
            </div>
            <div class="m-field-hint">Alterar o link quebra o endereço antigo.</div>
          </div>
          <div class="m-field-row">
            <div class="m-field-lbl">E-mail do gestor</div>
            <input class="m-field-inp" id="masterEmailInput" type="email" value="${escapeAttr(editing.gestorEmail||'')}"/>
          </div>
        </div>
        <div class="m-section">
          <div class="m-section-title">Tipo de conta</div>
          <div class="m-tipo-grid" style="padding:12px 16px;">
            <div class="m-tipo-opt${(editing.tipo||'agendamento')==='agendamento'?' sel':''}" id="editTipoAgendamento" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();masterSelTipoEdit('agendamento')}" onclick="masterSelTipoEdit('agendamento')">
              <div class="m-tipo-opt-title">Agendamento</div>
              <div class="m-tipo-opt-sub">Agenda, clientes e financeiro</div>
            </div>
            <div class="m-tipo-opt${(editing.tipo||'agendamento')==='pagina'?' sel':''}" id="editTipoPagina" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();masterSelTipoEdit('pagina')}" onclick="masterSelTipoEdit('pagina')">
              <div class="m-tipo-opt-title">Página</div>
              <div class="m-tipo-opt-sub">Apenas links e presença</div>
            </div>
          </div>
          <input type="hidden" id="editTipoInput" value="${escapeAttr(editing.tipo||'agendamento')}"/>
        </div>
        <div class="m-section">
          <div class="m-section-title">Status da conta</div>
          <div class="m-status-grid">
            ${['trial','ativa','bloqueada'].map(s=>`
              <div class="m-status-opt${stAtual===s?' s-'+s:''}" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();masterSelStatus(this,'${s}')}" onclick="masterSelStatus(this,'${s}')">
                <div class="m-status-dot"></div>
                <div class="m-status-lbl">${s.charAt(0).toUpperCase()+s.slice(1)}</div>
                <div class="m-status-sub">${statusSub[s]}</div>
              </div>`).join('')}
          </div>
        </div>
        <button class="m-btn-save" onclick="masterSalvarEdicao()">Salvar alterações</button>
        <div class="m-acoes-sec">
          <button class="m-btn-sec" onclick="masterRedefinirSenha()">Redefinir senha</button>
          <button class="m-btn-del" onclick="masterExcluir('${editing.slug}')">Excluir empresa</button>
        </div>
      `);
      return;
    }

    // Lista normal
    const ICO_CHV = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    const _tipoBadge = e => e.tipo === 'pagina'
      ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:#e0f2fe;color:#0369a1;white-space:nowrap;">Pagina</span>`
      : '';

    const empRow = e => {
      return `<div class="m-ec" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();masterAbrirDetalhe('${e.slug}')}" onclick="masterAbrirDetalhe('${e.slug}')">
        <div class="m-ec-body">
          <div class="m-ec-name">${escapeHtml(e.nome)}</div>
          <div class="m-ec-link" style="display:flex;align-items:center;gap:6px;">${escapeHtml(e.slug)}.agenplus.com.br ${_tipoBadge(e)}</div>
        </div>
        ${_statusBadgeHtml(e)}
        <div class="m-chevron">${ICO_CHV}</div>
      </div>`;
    };

    // Detalhe da empresa
    if(_masterDetalheSlug){
      const e = empresas.find(x=>x.slug===_masterDetalheSlug);
      if(!e){ _masterDetalheSlug=null; }
      else {
        const st  = _empStatus(e);
        const finReg = financeiroData.find(f=>f.empresa_id===e.id);
        const _dTrial = _diasTrialRestantes(e);

        const vencInfo = st==='trial' && _dTrial !== null
          ? `<div class="m-det-right"><div class="m-det-venc-lbl">${_dTrial < 0 ? 'Trial' : 'Trial expira em'}</div><div class="m-det-venc-val">${_dTrial < 0 ? 'vencido' : _dTrial + ' dias'}</div></div>`
          : st==='ativa' && finReg
          ? `<div class="m-det-right"><div class="m-det-venc-lbl">Vencimento</div><div class="m-det-venc-val">Dia ${finReg.dia_vencimento}</div></div>`
          : '';

        const ICO_PENCIL = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        const ICO_EXTL  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
        const ICO_LOCK  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
        const ICO_TRASH = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;

        drawMasterShell(`
          <button class="m-back" onclick="masterVoltarEmpresas()">${ICO_BACK} Empresas</button>
          <div class="m-det-header">
            <div class="m-det-info">
              <div class="m-det-nome">${escapeHtml(e.nome)}</div>
              <div class="m-det-slug">${escapeHtml(e.slug)}.agenplus.com.br</div>
              <div class="m-det-badges">${_statusBadgeHtml(e)}</div>
            </div>
            ${vencInfo}
          </div>
          <div class="m-pag-sec">
            <div class="m-pag-head"><span class="m-pag-title">Ações</span></div>
            <div class="m-acoes-grid">
              <button class="m-acao-btn" onclick="masterEditarEmpresa('${e.slug}')">
                <div class="m-acao-icon" style="background:#f3eef5;">${ICO_PENCIL}</div>
                <div><div class="m-acao-label">Editar cadastro</div><div class="m-acao-sub">Nome, WhatsApp, e-mail</div></div>
              </button>
              <button class="m-acao-btn" onclick="goto({empresa:'${e.slug}',page:'gestao'})">
                <div class="m-acao-icon" style="background:#dcfce7;">${ICO_EXTL}</div>
                <div><div class="m-acao-label">Entrar na gestão</div><div class="m-acao-sub">Painel da empresa</div></div>
              </button>
              <button class="m-acao-btn" onclick="masterToggleEmpStatus('${e.slug}')">
                <div class="m-acao-icon" style="background:#fef3c7;">${ICO_LOCK}</div>
                <div><div class="m-acao-label">${st==='bloqueada'?'Desbloquear':'Bloquear'}</div><div class="m-acao-sub">${st==='bloqueada'?'Reativar acesso':'Suspender acesso'}</div></div>
              </button>
              <button class="m-acao-btn danger" onclick="masterExcluir('${e.slug}')">
                <div class="m-acao-icon" style="background:#fee2e2;">${ICO_TRASH}</div>
                <div><div class="m-acao-label">Excluir empresa</div><div class="m-acao-sub">Ação irreversível</div></div>
              </button>
            </div>
          </div>
        `);
        return;
      }
    }

    // Filtro por status
    const filtros = ['todos','ativa','trial','bloqueada'];
    const filtroLabels = {todos:'Todas',ativa:'Ativas',trial:'Trial',bloqueada:'Bloqueadas'};
    const filtroTabs = filtros.map(f=>`
      <button class="m-tab ${_filtroEmpStatus===f?'on':''}" onclick="_filtroEmpStatus='${f}';drawMaster();">
        ${filtroLabels[f]}
      </button>`).join('');

    const listaFiltrada = empresas.filter(e=>{
      const matchStatus = _filtroEmpStatus==='todos' || _empStatus(e)===_filtroEmpStatus;
      const matchSearch = !masterSearch || e.nome.toLowerCase().includes(masterSearch.toLowerCase());
      return matchStatus && matchSearch;
    });

    const lista = listaFiltrada.length
      ? `<div style="display:flex;flex-direction:column;gap:8px;">${listaFiltrada.map(empRow).join('')}</div>`
      : `<p class="muted">${masterSearch ? 'Nenhuma empresa encontrada.' : 'Nenhuma empresa nesta categoria.'}</p>`;

    drawMasterShell(`
      <div class="m-sh">
        <div>
          <div class="m-sh-title">Empresas</div>
          <div class="m-sh-sub">${empresas.length} cadastrada${empresas.length!==1?'s':''}</div>
        </div>
        <button class="m-add" onclick="masterAbrirDrawer('criar')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nova empresa
        </button>
      </div>
      <div class="m-tabs">${filtroTabs}</div>
      <input class="m-search" placeholder="Buscar empresa..." value="${escapeAttr(masterSearch)}" oninput="masterSearchInput(this.value,this.selectionStart)"/>
      ${lista}
    `);
  }

  function drawFinanceiro(){
    const MESES_PT = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje = new Date();
    const refHoje = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
    const refAtual = `${_finPeriodo.ano}-${String(_finPeriodo.mes+1).padStart(2,'0')}`;
    const periodoLabel = `${MESES_PT[_finPeriodo.mes]} ${_finPeriodo.ano}`;
    const refPadrao = refHoje;
    const fmtR = v => 'R$ ' + parseFloat(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
    const mensPeriodo = mensalidades.filter(m => m.referencia === refAtual);

    const ICO_BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
    const ICO_DL   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    const ICO_CHV  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    // Calcula status de cada empresa no periodo
    function empFinStatus(e){
      const finReg = financeiroData.find(f => f.empresa_id === e.id);
      const mens   = mensPeriodo.find(m => m.empresa_id === e.id);
      const val    = mens ? parseFloat(mens.valor||0) : (finReg ? parseFloat(finReg.valor||0) : 0);
      if(!finReg && !mens) return { tipo:'sem-config', val:0, pagoEm:null, finReg:null, mens:null };
      if(mens?.pago_em)    return { tipo:'pago', val, pagoEm: mens.pago_em, finReg, mens };
      const finDia   = finReg?.dia_vencimento || 28;
      const emAtraso = refAtual < refHoje || (refAtual === refHoje && hoje.getDate() > finDia);
      return { tipo: emAtraso ? 'atraso' : 'pendente', val, pagoEm: null, finReg, mens };
    }

    // ── DETALHE DE UMA EMPRESA ─────────────────────────────────────
    if(_finDetalheEmpId){
      const e = empresas.find(x => x.id === _finDetalheEmpId);
      if(!e){ _finDetalheEmpId = null; }
      else {
        const { finReg } = empFinStatus(e);
        const empMens = mensalidades.filter(m => m.empresa_id === e.id);

        const histRows = empMens.length ? empMens.map(m => {
          const [yy,mm] = m.referencia.split('-');
          const _d = new Date(+yy,+mm-1,1);
          const mesLbl = _d.toLocaleString('pt-BR',{month:'long'}).replace(/^\w/,c=>c.toUpperCase()) + ' de ' + _d.getFullYear();
          const ok = !!m.pago_em;
          const dataStr = ok ? new Date(m.pago_em+'T00:00:00').toLocaleDateString('pt-BR') : null;
          const valStr = fmtR(m.valor||0);
          return `
            <div style="display:flex;align-items:center;gap:12px;padding:16px;border-bottom:1px solid var(--line);">
              <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${ok?'#dcfce7':'#fee2e2'};">
                ${ok
                  ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
                  : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
                }
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:700;color:var(--ink);">${mesLbl}</div>
                <div style="font-size:12px;color:var(--ink-soft);margin-top:1px;">${ok ? 'Pago em ' + dataStr : 'Não pago'}</div>
              </div>
              <div style="font-size:14px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;">${valStr}</div>
              <button onclick="event.stopPropagation();finExcluirLancamento('${m.id}')"
                style="width:28px;height:28px;border:1px solid #fca5a5;border-radius:8px;background:#fff;color:#dc2626;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
                title="Excluir lançamento">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
              </button>
            </div>`;
        }).join('') : `<div style="padding:20px 0;font-size:14px;color:var(--ink-soft);text-align:center;">Nenhum lançamento ainda.</div>`;

        const INP = `width:100%;padding:11px 14px;border:1.5px solid var(--line);border-radius:10px;font-size:15px;background:var(--paper);color:var(--ink);font-family:inherit;outline:none;box-sizing:border-box;`;
        const LBL = `font-size:12px;font-weight:700;color:var(--ink-soft);display:block;margin-bottom:6px;`;
        const SEC = `font-size:13px;font-weight:800;color:var(--ink);margin:20px 0 10px;`;

        drawMasterShell(`
          <button class="m-back" onclick="finVoltarLista()">${ICO_BACK} Financeiro</button>
          <div style="margin-bottom:20px;">
            <div style="font-size:20px;font-weight:800;color:var(--ink);">${escapeHtml(e.nome)}</div>
            <div style="font-size:13px;color:var(--ink-soft);margin-top:2px;">${escapeHtml(e.slug)}.agenplus.com.br</div>
          </div>

          <div style="${SEC}">Cobrança mensal</div>
          <div style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:4px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div>
                <label style="${LBL}">Valor mensal (R$)</label>
                <input id="finValor_${e.id}" type="number" step="0.01" placeholder="0,00"
                  value="${escapeAttr(finReg?.valor ? parseFloat(finReg.valor).toFixed(2) : '')}" style="${INP}"/>
              </div>
              <div>
                <label style="${LBL}">Dia de vencimento</label>
                <input id="finDia_${e.id}" type="number" min="1" max="28" placeholder="Ex: 10"
                  value="${escapeAttr(String(finReg?.dia_vencimento||''))}" style="${INP}"/>
              </div>
            </div>
            <button onclick="masterSalvarFinConfig('${e.id}')"
              style="width:100%;padding:12px;background:#111;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
              Salvar configuração
            </button>
          </div>

          <div style="${SEC}">Registrar pagamento</div>
          <div style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:4px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div>
                <label style="${LBL}">Referência</label>
                <input id="finLancRef_${e.id}" type="month" value="${refPadrao}" style="${INP}"/>
              </div>
              <div>
                <label style="${LBL}">Valor (R$)</label>
                <input id="finLancValor_${e.id}" type="number" step="0.01" placeholder="0,00"
                  value="${escapeAttr(finReg?.valor ? parseFloat(finReg.valor).toFixed(2) : '')}" style="${INP}"/>
              </div>
            </div>
            <div style="margin-bottom:12px;">
              <label style="${LBL}">Data do pagamento</label>
              <div style="font-size:11px;color:var(--ink-soft);margin-bottom:6px;">Deixe em branco se ainda não pagou</div>
              <input id="finLancData_${e.id}" type="date"
                value="${refPadrao+'-'+String(hoje.getDate()).padStart(2,'0')}" style="${INP}"/>
            </div>
            <button onclick="masterLancarMensalidadeFin('${e.id}')"
              style="width:100%;padding:12px;background:#16a34a;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
              Registrar pagamento
            </button>
          </div>

          <div style="${SEC}">Histórico de pagamentos</div>
          <div style="background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;">
            ${histRows}
          </div>
        `);
        return;
      }
    }

    // ── LISTA DE EMPRESAS ──────────────────────────────────────────
    let totalRecebido=0, totalPendente=0, totalAtraso=0;
    let cntRecebido=0, cntPendente=0, cntAtraso=0;
    empresas.forEach(e => {
      const s = empFinStatus(e);
      if(!s.val) return;
      if(s.tipo==='pago')     { totalRecebido+=s.val; cntRecebido++; }
      else if(s.tipo==='atraso')  { totalAtraso+=s.val; cntAtraso++; }
      else if(s.tipo==='pendente'){ totalPendente+=s.val; cntPendente++; }
    });

    const STATUS_CFG = {
      pago:       { lbl:'Pago',       bg:'#dcfce7', clr:'#16a34a' },
      pendente:   { lbl:'Pendente',   bg:'#fef3c7', clr:'#b45309' },
      atraso:     { lbl:'Em atraso',  bg:'#fee2e2', clr:'#dc2626' },
      'sem-config':{ lbl:'Sem config', bg:'#f3f4f6', clr:'#6b7280' },
    };

    const empRows = empresas.map(e => {
      const s = empFinStatus(e);
      const sc = STATUS_CFG[s.tipo];
      const sub = s.tipo==='pago'
        ? 'Pago em ' + new Date(s.pagoEm+'T00:00:00').toLocaleDateString('pt-BR')
        : s.finReg?.dia_vencimento
        ? `Vence dia ${s.finReg.dia_vencimento}`
        : 'Configure o vencimento';
      return `
        <div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();finAbrirDetalhe('${e.id}')}" onclick="finAbrirDetalhe('${e.id}')"
          style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--line);cursor:pointer;transition:background .1s;"
          onmouseover="this.style.background='#faf9fc'" onmouseout="this.style.background=''">
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(e.nome)}</div>
            <div style="font-size:12px;color:var(--ink-soft);margin-top:2px;">${sub}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            ${s.val ? `<span style="font-size:13px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums;">${fmtR(s.val)}</span>` : ''}
            <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${sc.bg};color:${sc.clr};white-space:nowrap;">${sc.lbl}</span>
            <span style="width:16px;height:16px;color:var(--ink-soft);display:flex;align-items:center;">${ICO_CHV}</span>
          </div>
        </div>`;
    }).join('');

    // Chart — ultimos 6 meses
    const chartMeses = [];
    for(let i=5;i>=0;i--){
      let m=_finPeriodo.mes-i, a=_finPeriodo.ano;
      if(m<0){m+=12;a--;}
      const ref=`${a}-${String(m+1).padStart(2,'0')}`;
      const lbl=new Date(a,m,1).toLocaleString('pt-BR',{month:'short'}).replace('.','');
      const tot=mensalidades.filter(x=>x.referencia===ref&&x.pago_em).reduce((s,x)=>s+parseFloat(x.valor||0),0);
      chartMeses.push({lbl,tot,ref,atual:ref===refAtual});
    }
    const maxVal=Math.max(...chartMeses.map(c=>c.tot),1);
    const chartBars=chartMeses.map(c=>{
      const pct=Math.round((c.tot/maxVal)*100);
      const clr=c.atual?'#3d1f3a':'#e8e5ec';
      const txtClr=c.atual?'#3d1f3a':'#8e8e93';
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="font-size:10px;font-weight:700;color:${txtClr};font-variant-numeric:tabular-nums;">${c.tot>0?fmtR(c.tot):''}</div>
        <div style="width:100%;height:60px;display:flex;align-items:flex-end;">
          <div style="width:100%;height:${Math.max(pct,3)}%;background:${clr};border-radius:4px 4px 0 0;min-height:4px;transition:height .3s;"></div>
        </div>
        <div style="font-size:11px;color:${txtClr};font-weight:${c.atual?'700':'400'};">${c.lbl}</div>
      </div>`;
    }).join('');

    const totalPeriodo = totalRecebido+totalPendente+totalAtraso;

    drawMasterShell(`
      <div class="m-fin-hdr">
        <div class="m-period-nav">
          <button class="m-period-btn" onclick="finMudarPeriodo(-1)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
          <span class="m-period-lbl">${periodoLabel}</span>
          <button class="m-period-btn" onclick="finMudarPeriodo(1)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
        <button class="m-btn-csv" onclick="finExportarCSV('${refAtual}')">${ICO_DL} CSV</button>
      </div>

      <div class="m-sum-row">
        <div class="m-sum-card sg"><div class="m-sum-stripe"></div><div class="m-sum-lbl">Recebido</div><div class="m-sum-val">${fmtR(totalRecebido)}</div><div class="m-sum-sub">${cntRecebido} empresa${cntRecebido!==1?'s':''}</div></div>
        <div class="m-sum-card sa"><div class="m-sum-stripe"></div><div class="m-sum-lbl">Pendente</div><div class="m-sum-val">${fmtR(totalPendente)}</div><div class="m-sum-sub">${cntPendente} empresa${cntPendente!==1?'s':''}</div></div>
        <div class="m-sum-card sr"><div class="m-sum-stripe"></div><div class="m-sum-lbl">Em atraso</div><div class="m-sum-val">${fmtR(totalAtraso)}</div><div class="m-sum-sub">${cntAtraso} empresa${cntAtraso!==1?'s':''}</div></div>
      </div>

      <div class="m-chart-wrap">
        <div class="m-chart-title">Receita recebida — ultimos 6 meses</div>
        <div style="display:flex;gap:6px;align-items:flex-end;">${chartBars}</div>
      </div>

      <div style="background:#fff;border:1px solid var(--line);border-radius:14px;overflow:hidden;">
        <div style="padding:14px 16px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:14px;font-weight:700;color:var(--ink);">Empresas</span>
          <span style="font-size:13px;color:var(--ink-soft);font-variant-numeric:tabular-nums;">${fmtR(totalRecebido)} / ${fmtR(totalPeriodo)}</span>
        </div>
        ${empresas.length ? empRows : '<div style="padding:24px 16px;font-size:14px;color:var(--ink-soft);text-align:center;">Nenhuma empresa cadastrada.</div>'}
      </div>
    `);
  }

  window.drawMaster = draw;
  window.masterIrAba = async (aba) => {
    masterAba = aba; _masterDetalheSlug = null; _finDetalheEmpId = null;
    if(aba === 'financeiro'){
      await Promise.all([carregarFinanceiro(), carregarMensalidades()]);
    }
    draw();
  };

  window.finAbrirDetalhe = async (empId) => {
    _finDetalheEmpId = empId; draw();
    await Promise.all([carregarFinanceiro(), carregarMensalidades()]); draw();
  };
  window.finVoltarLista = () => { _finDetalheEmpId = null; draw(); };

  window.masterAbrirDetalhe = async (slug) => {
    _masterDetalheSlug = slug; draw();
    await carregarMensalidades(); draw();
  };
  window.masterVoltarEmpresas = () => { _masterDetalheSlug = null; masterDrawerMode = null; editingSlug = null; draw(); };

  window.finExcluirLancamento = (id) => {
    confirmarAcao('Excluir este lançamento?', async ()=>{
      const { error } = await supabaseClient.from('mensalidades').delete().eq('id', id);
      if(error){ toast('Erro ao excluir.','err'); return; }
      toast('Lançamento excluído.','ok');
      await carregarMensalidades(); draw();
    });
  };

  window.masterLancarMensalidadeFin = async (empresaId) => {
    const ref   = document.getElementById('finLancRef_'+empresaId)?.value||'';
    const valor = parseFloat(document.getElementById('finLancValor_'+empresaId)?.value)||0;
    const pago  = document.getElementById('finLancData_'+empresaId)?.value||'';
    if(!ref){ toast('Informe a referencia.','err'); return; }
    if(!valor){ toast('Informe o valor.','err'); return; }
    const existe = mensalidades.find(m=>m.empresa_id===empresaId && m.referencia===ref);
    let erro;
    if(existe){
      const { error } = await supabaseClient.from('mensalidades').update({ valor, pago_em: pago||null }).eq('id', existe.id);
      erro = error;
    } else {
      const { error } = await supabaseClient.from('mensalidades').insert({ empresa_id: empresaId, referencia: ref, valor, pago_em: pago||null });
      erro = error;
    }
    if(erro){ toast('Erro ao salvar lancamento.','err'); return; }
    toast('Lancamento salvo!','ok');
    await carregarMensalidades(); draw();
  };

  window.masterSalvarFinConfig = async (empresaId) => {
    const valor = parseFloat(document.getElementById('finValor_'+empresaId)?.value)||0;
    const dia   = parseInt(document.getElementById('finDia_'+empresaId)?.value)||0;
    if(!valor){ toast('Informe o valor mensal.','err'); return; }
    // O banco aceita 1 a 28 (todo mes tem esses dias)
    if(!dia || dia < 1 || dia > 28){ toast('Informe um dia de vencimento de 1 a 28.','err'); return; }
    const existe = financeiroData.find(f=>f.empresa_id===empresaId);
    let erro;
    if(existe){
      const { error } = await supabaseClient.from('financeiro').update({ valor, dia_vencimento: dia }).eq('empresa_id', empresaId);
      erro = error;
    } else {
      const { error } = await supabaseClient.from('financeiro').insert({ empresa_id: empresaId, valor, dia_vencimento: dia });
      erro = error;
    }
    if(erro){ toast('Erro ao salvar configuracao.','err'); return; }
    toast('Configuracao salva!','ok');
    await carregarFinanceiro(); draw();
  };

  window.finMudarPeriodo = (d) => {
    let m = _finPeriodo.mes + d, a = _finPeriodo.ano;
    if(m>11){m=0;a++;} if(m<0){m=11;a--;}
    _finPeriodo = {mes:m,ano:a}; draw();
  };

  window.finExportarCSV = (refAtual) => {
    const mensPeriodo = mensalidades.filter(m=>m.referencia===refAtual);
    const linhas = [['Empresa','Referencia','Valor','Pago em']];
    empresas.forEach(e=>{
      const m = mensPeriodo.find(x=>x.empresa_id===e.id);
      const finReg = financeiroData.find(f=>f.empresa_id===e.id);
      // #36: valor em branco vira 0,00 em vez de string vazia
      const valRaw = m ? m.valor : (finReg ? finReg.valor : null);
      const val = valRaw != null ? parseFloat(valRaw).toFixed(2).replace('.', ',') : '0,00';
      const pago = m?.pago_em || '';
      linhas.push([e.nome, refAtual, val, pago]);
    });
    // Celula que comeca com = + - @ seria executada como formula pelo Excel: prefixa com '
    const celula = c => { let s = String(c); if(/^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g,'""')}"`; };
    const csv = linhas.map(r=>r.map(celula).join(',')).join('\n');
    baixarArquivo('﻿'+csv, `financeiro-${refAtual}.csv`, 'text/csv;charset=utf-8;');
  };

  window.masterCriar = async ()=>{
    const nome  = document.getElementById('novoNome').value.trim();
    const email = document.getElementById('novoEmail').value.trim();
    const senha = document.getElementById('novaSenha').value;
    if(!nome){ toast('Digite o nome da empresa.','err'); return; }
    if(!email){ toast('Digite o e-mail do gestor.','err'); return; }
    if(senha.length < 6){ toast('A senha deve ter pelo menos 6 caracteres.','err'); return; }
    const _whatsRaw = document.getElementById('novoWhats').value.trim();
    if(_whatsRaw){
      let _wd = _whatsRaw.replace(/\D/g,'');
      if(_wd.startsWith('55') && _wd.length > 11) _wd = _wd.slice(2);
      if(_wd.startsWith('0')) _wd = _wd.slice(1);
      if(_wd.length < 10 || _wd.length > 11){ toast('WhatsApp inválido. Use o formato (xx) xxxxx-xxxx.','err'); return; }
    }

    // 1. Cria a empresa no banco
    const SLUGS_RESERVADOS = ['api','app','admin','master','login','logout','auth','static','assets','sw','manifest','index','null','undefined','favicon','www','mail','suporte','ajuda','cdn','blog','help','cadastro'];
    let slug = slugify(nome);
    if(!slug){ toast('Use letras ou números no nome da empresa (ele vira o link).','err'); return; }
    if(SLUGS_RESERVADOS.includes(slug)){ toast(`O nome "${nome}" é reservado pelo sistema. Use um nome diferente.`,'err'); return; }
    let s2 = slug, n=1;
    while(empresas.some(e=>e.slug===s2)){ s2 = slug+"-"+(++n); }
    const nova = defaultEmpresa();
    nova.slug = s2; nova.nome = nome;
    // Salva digitos limpos, sem mascara
    let _wdLimpo = document.getElementById('novoWhats').value.trim().replace(/\D/g,'');
    if(_wdLimpo.startsWith('55') && _wdLimpo.length > 11) _wdLimpo = _wdLimpo.slice(2);
    if(_wdLimpo.startsWith('0')) _wdLimpo = _wdLimpo.slice(1);
    nova.whatsapp = _wdLimpo;
    nova.corPrincipal = sanitizeCor(document.getElementById('novaCor')?.value || '#3d1f3a');
    nova.tipo = document.getElementById('novoTipo')?.value || 'agendamento';
    nova.status = 'trial';
    nova.trialExpiraEm = new Date(Date.now() + 7*24*60*60*1000).toISOString();
    const errCriar = await inserirEmpresa(nova);
    if(errCriar || !nova.id){
      toast(errCriar?.code === '23505' ? 'Já existe uma empresa com esse link. Tente outro nome.' : 'Não foi possível criar a empresa. Verifique sua conexão e tente novamente.','err',6000);
      masterDrawerMode = null; draw(); return;
    }
    empresas.push(nova);
    const empCriada = nova;

    // 2. Cria o usuário gestor via API segura
    let _sessionData;
    try { ({ data: { session: _sessionData } } = await supabaseClient.auth.getSession()); }
    catch(_){ toast('Sessão expirada. Faça login novamente.','err'); masterDrawerMode=null; draw(); return; }
    const session = _sessionData;
    let apiOk = false;
    try {
      const resp = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token
        },
        body: JSON.stringify({ email, password: senha, nome, empresa_id: empCriada.id })
      });
      if(!resp.ok){
        const err = await resp.json();
        toast('Empresa criada, mas erro ao criar usuário: ' + (err.error || 'Erro desconhecido') + '. Crie manualmente no Supabase.','err',8000);
      } else {
        apiOk = true;
      }
    } catch(e) {
      toast('Empresa criada, mas não foi possível contatar a API. Crie o usuário manualmente no Supabase.','err',8000);
    }

    masterDrawerMode = null;
    if(apiOk){
      toast(`"${nome}" criada! Gestor: ${email}. Compartilhe a senha por canal seguro.`,'ok',8000);
    }
    draw();
  };
  window.masterEditarEmpresa = async (slug) => {
    editingSlug = slug;
    masterDrawerMode = 'editar';
    draw();
    const emp = empresas.find(e => e.slug === slug);
    if(emp && !emp.gestorEmail){
      const { data } = await supabaseClient.from('profiles').select('id, email').eq('empresa_id', emp.id).eq('role','owner_empresa').single();
      if(data?.email){ emp.gestorEmail = data.email; emp.gestorUserId = data.id; draw(); }
    }
  };
  window.masterSelTipo = (tipo) => {
    document.getElementById('novoTipo').value = tipo;
    document.getElementById('tipoAgendamento').classList.toggle('sel', tipo === 'agendamento');
    document.getElementById('tipoPagina').classList.toggle('sel', tipo === 'pagina');
  };
  window.masterSelTipoEdit = (tipo) => {
    document.getElementById('editTipoInput').value = tipo;
    document.getElementById('editTipoAgendamento').classList.toggle('sel', tipo === 'agendamento');
    document.getElementById('editTipoPagina').classList.toggle('sel', tipo === 'pagina');
  };
  window.masterSelStatus = (el, novoStatus) => {
    const grid = el.closest('.m-status-grid');
    if(grid) grid.querySelectorAll('.m-status-opt').forEach(o => o.className = 'm-status-opt');
    else document.querySelectorAll('.m-status-opt').forEach(o => o.className = 'm-status-opt');
    el.classList.add('s-' + novoStatus);
  };
  window.masterSalvarEdicao = async ()=>{
    const e = empresas.find(x=>x.slug===editingSlug);
    if(!e){ editingSlug=null; draw(); return; }

    // Ler campos do novo formulario
    const novoNome  = (document.getElementById('editNome')?.value||'').trim();
    const novoWhats = (document.getElementById('editWhats')?.value||'').trim();
    const novoSlug  = (document.getElementById('masterSlugInput')?.value||'').trim();
    const novoEmail = (document.getElementById('masterEmailInput')?.value||'').trim();
    const novoTipo  = (document.getElementById('editTipoInput')?.value||'agendamento');
    const selOpt    = document.querySelector('.m-status-opt.s-ativa,.m-status-opt.s-trial,.m-status-opt.s-bloqueada');
    const novoStatus = selOpt ? ['ativa','trial','bloqueada'].find(s=>selOpt.classList.contains('s-'+s)) : null;

    // Valida tudo ANTES de alterar o objeto da empresa
    const _wd = telefoneNacional(novoWhats);
    if(_wd && (_wd.length < 10 || _wd.length > 11)){ toast('WhatsApp invalido. Use o formato (xx) xxxxx-xxxx.','err'); return; }
    const RESERVADOS = ['api','app','admin','master','login','logout','auth','static','assets','sw','manifest','index','null','undefined','favicon','www','mail','suporte','ajuda','cdn','blog','help','cadastro'];
    const trocaSlug = !!novoSlug && novoSlug !== editingSlug;
    if(trocaSlug){
      if(!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(novoSlug)){
        toast('Link inválido. Use apenas letras minúsculas, números e hífens.','err'); return;
      }
      if(RESERVADOS.includes(novoSlug)){ toast('Esse link é reservado pelo sistema.','err'); return; }
      if(empresas.some(x=>x.slug===novoSlug && x.id!==e.id)){ toast('Esse link já está em uso por outra empresa.','err'); return; }
    }

    const antes = { nome:e.nome, tipo:e.tipo, whatsapp:e.whatsapp, status:e.status, bloqueada:e.bloqueada, slug:e.slug, logo:e.logo, fotoUrl:e.fotoUrl };
    if(novoNome) e.nome = novoNome;
    if(novoTipo) e.tipo = novoTipo;
    e.whatsapp = _wd;
    if(novoStatus && novoStatus !== _empStatus(e)){
      e.status = novoStatus;
      e.bloqueada = novoStatus === 'bloqueada';
    }

    if(trocaSlug){
      const antigoSlug = editingSlug;
      e.slug = novoSlug;
      const errSlug = await atualizarEmpresa(e, ['slug']);
      if(errSlug){
        Object.assign(e, antes);
        toast(errSlug.code === '23505' ? 'Esse link já está em uso por outra empresa.' : 'Erro ao salvar o link. Tente novamente.','err');
        return;
      }

      for(const bucket of ['logos','backgrounds']){
        const file = bucket==='logos' ? 'logo.jpg' : 'background.jpg';
        try{
          const { data:blob } = await supabaseClient.storage.from(bucket).download(`${antigoSlug}/${file}`);
          if(blob){
            await supabaseClient.storage.from(bucket).upload(`${novoSlug}/${file}`, blob, { contentType:'image/jpeg', upsert:true });
            await supabaseClient.storage.from(bucket).remove([`${antigoSlug}/${file}`]);
            const { data:urlData } = supabaseClient.storage.from(bucket).getPublicUrl(`${novoSlug}/${file}`);
            if(bucket==='logos') e.logo = urlData.publicUrl;
            else e.fotoUrl = urlData.publicUrl;
          }
        }catch(imgErr){ console.error('Erro ao migrar imagem:', imgErr); toast('Imagem não pôde ser migrada. Reenvie a logo manualmente.','err'); }
      }
      agendamentos = agendamentos.map(a=> a.slug===antigoSlug ? {...a, slug:novoSlug} : a);
      editingSlug = novoSlug;
    }

    // Grava so o que mudou: evita sobrescrever alteracoes feitas pelo gestor enquanto o master estava com a tela aberta
    const _mapa = { nome:'nome', tipo:'tipo', whatsapp:'whatsapp', status:'status', bloqueada:'bloqueada', logo:'logo', fotoUrl:'foto_url' };
    const colunas = Object.keys(_mapa).filter(k => e[k] !== antes[k]).map(k => _mapa[k]);
    if(colunas.length){
      const errSalvar = await atualizarEmpresa(e, colunas);
      if(errSalvar){
        toast('Erro ao salvar as alterações. Tente novamente.','err');
        await loadData(); draw(); return;
      }
    }

    // Salvar email se mudou
    if(novoEmail && novoEmail !== e.gestorEmail && !e.gestorUserId){
      toast('Nao foi possivel atualizar o e-mail: dados do gestor nao carregados. Reabra a tela de edicao e tente novamente.','err',6000);
    }
    if(novoEmail && novoEmail !== e.gestorEmail && e.gestorUserId){
      const { data: { session } } = await supabaseClient.auth.getSession();
      const resp = await fetch('/api/update-email', {
        method:'POST',
        headers:{'Content-Type':'application/json', 'Authorization': 'Bearer ' + session?.access_token},
        body: JSON.stringify({ user_id: e.gestorUserId, email: novoEmail })
      });
      const json = await resp.json().catch(()=>({}));
      if(!resp.ok){ toast(json.error||'Dados salvos, mas erro ao atualizar e-mail.','err'); }
      else { e.gestorEmail = novoEmail; }
    }

    toast('Alteracoes salvas!','ok');
    editingSlug = null; masterDrawerMode = null; draw();
  };
  window.masterToggleEmpStatus = async (slug)=>{
    const e = empresas.find(x=>x.slug===slug);
    if(!e) return;
    const antes = { status:e.status, bloqueada:e.bloqueada };
    if(_empStatus(e)==='bloqueada'){ e.status='ativa'; e.bloqueada=false; }
    else { e.status='bloqueada'; e.bloqueada=true; }
    const err = await atualizarEmpresa(e, ['status','bloqueada']);
    if(err){ Object.assign(e, antes); toast('Erro ao alterar o status. Tente novamente.','err'); }
    draw();
  };
  window.masterExcluir = (slug)=>{
    const e = empresas.find(x=>x.slug===slug);
    if(!e){ toast('Empresa não encontrada.','err'); return; }
    confirmarAcao(`Excluir <strong>${escapeHtml(e.nome)}</strong> definitivamente? Isso também apaga os agendamentos dela. Essa ação não pode ser desfeita.`, async ()=>{
      if(e.id){
        // 1. Remove o login do gestor (service role). Se falhar, PARA aqui: continuar
        //    deixaria um usuario sem empresa. Tentar de novo e seguro (sem gestor, a API responde ok).
        try {
          const { data: { session } } = await supabaseClient.auth.getSession();
          const _delUserRes = await fetch('/api/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session?.access_token },
            body: JSON.stringify({ empresa_id: e.id })
          });
          if(!_delUserRes.ok){
            const _delErr = await _delUserRes.json().catch(()=>({}));
            console.warn('[masterExcluir] delete-user retornou erro:', _delErr);
            toast('Não foi possível remover o acesso do gestor. Nada foi excluído. Tente novamente.','err',6000);
            return;
          }
        } catch(_err){
          console.error('[masterExcluir] falha ao chamar delete-user:', _err);
          toast(mensagemErroRede(_err),'err'); return;
        }
        // 2. Remove os dados da empresa (agendamentos antes de clientes/servicos, que eles referenciam).
        //    Se algo falhar, para antes de apagar a empresa: tentar de novo continua de onde parou.
        const _tbRel = ['lancamentos_financeiros','agendamentos','clientes','servicos','bloqueios','horarios_disponiveis','botoes_empresa','notas','mensalidades','financeiro'];
        for(const tb of _tbRel){
          const { error: _tbErr } = await supabaseClient.from(tb).delete().eq('empresa_id', e.id);
          if(_tbErr){
            console.warn(`[masterExcluir] erro ao deletar ${tb}:`, _tbErr);
            toast('Erro ao excluir os dados da empresa. Tente novamente.','err'); return;
          }
        }
        // 3. Remove a empresa
        const { error } = await supabaseClient.from('empresas').delete().eq('id', e.id);
        if(error){ toast(friendlyError(error,'Erro ao excluir empresa. Tente novamente.'),'err'); return; }
      }
      empresas = empresas.filter(x=>x.slug!==slug);
      agendamentos = agendamentos.filter(a=>a.slug!==slug);
      await excluirImagensEmpresa(slug);
      editingSlug = null;
      draw();
    });
  };
  Promise.all([carregarFinanceiro(), carregarMensalidades()]).then(draw);
  pararPolling();
  iniciarPolling(()=>{ if(!editingSlug && masterDrawerMode === null) Promise.all([carregarFinanceiro(), carregarMensalidades()]).then(()=>{ if(!editingSlug && masterDrawerMode === null) draw(); }); });
}

function _limparEstado(){
  empresas = []; agendamentos = [];
  editingSlug = null; masterSearch = ''; masterAba = 'dashboard'; _filtroEmpStatus = 'todos';
  financeiroData = [];
  _masterDetalheSlug = null; mensalidades = [];
  _finPeriodo = (()=>{ const n=new Date(); return {mes:n.getMonth(),ano:n.getFullYear()}; })();
  _finDetalheEmpId = null;
  // o estado da gestao (js/gestao/estado.js) e reiniciado a cada renderGestao()
}
window.masterLogout = async ()=>{
  pararPolling();
  await supabaseClient.auth.signOut();
  currentUser = null; currentProfile = null;
  _limparEstado();
  renderLoginUnificado();
};
window.gestaoLogout = async (slug)=>{
  pararPolling();
  await supabaseClient.auth.signOut();
  currentUser = null; currentProfile = null;
  _limparEstado();
  try { await loadData(); } catch(_){}
  goto({empresa: slug});
};
window.masterRedefinirSenha = async ()=>{
  // Usa o e-mail ja carregado no formulario de edicao; se ausente, pede via campo de texto
  const inputEl = document.getElementById('masterEmailInput');
  const email = (inputEl?.value || '').trim();
  if(!email){
    toast('Carregue o e-mail do gestor antes de redefinir a senha.','err');
    return;
  }
  confirmarAcao(`Enviar link de redefinicao de senha para <strong>${escapeHtml(email)}</strong>?`, async ()=>{
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: urlPrincipal('/login') });
    if(error){ toast('Erro ao enviar. Tente novamente.','err'); return; }
    toast('Link de redefinicao enviado para ' + email,'ok',5000);
  });
};

