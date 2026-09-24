// Painel de gestao — nucleo: icones, navegacao, CSS, draw(), setCorner e renderGestao().


  const G_ICO = {
    dashboard:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    agendamentos: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    configurar:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    personalizar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    financeiro:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    sair:         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    voltar:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    clientes:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    relatorios:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%;height:100%;"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  };

  const GESTAO_NAV = [
    { id: 'dashboard',    label: 'Dashboard',  ico: G_ICO.dashboard },
    { id: null,           label: 'Agenda',     ico: G_ICO.agendamentos },
    { id: 'clientes',     label: 'Clientes',   ico: G_ICO.clientes },
    { id: 'financeiro',   label: 'Financeiro', ico: G_ICO.financeiro },
    { id: 'configurar',   label: 'Configurar', ico: G_ICO.configurar },
  ];

  const GESTAO_CSS = `<style>
    .g-layout { display:flex; flex-direction:column; min-height:calc(100vh - 52px); }
    .g-content { flex:1; min-width:0; padding-bottom:72px; }
    .g-dash-card { background:#fff; border:0.5px solid #ececee; border-radius:14px; padding:12px; display:flex; flex-direction:column; justify-content:center; box-shadow:0 1px 6px rgba(0,0,0,0.07); }
    .g-dash-ico { width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .g-dash-label { font-size:11px; color:#8e8e93; line-height:1.25; font-weight:600; }
    .g-dash-val { font-size:21px; font-weight:700; color:#1a1a1a; letter-spacing:-.02em; margin-top:8px; line-height:1.1; }
    .g-dash-panel { background:#fff; border:0.5px solid #ececee; border-radius:14px; padding:12px; box-shadow:0 1px 6px rgba(0,0,0,0.07); }
    .g-dash-ttl { font-size:14px; font-weight:700; color:#1a1a1a; }
    .g-ag-row { padding:7px 0; }
    .g-ag-row + .g-ag-row { border-top:0.5px solid #f4f4f5; }
    .g-ag-hora { font-size:12px; font-weight:700; color:#1a1a1a; flex-shrink:0; }
    .g-ag-nome { font-size:12px; color:#1a1a1a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .g-ag-serv { font-size:10px; color:#8e8e93; margin-top:1px; padding-left:41px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .g-nota { border-radius:10px; padding:10px 11px; font-size:12px; color:#3d3d3a; line-height:1.4; display:flex; align-items:flex-start; gap:8px; }
    .g-nota-txt { flex:1; min-width:0; word-break:break-word; white-space:pre-wrap; }
    .g-nota-x { background:none; border:none; color:#00000055; cursor:pointer; font-size:16px; line-height:1; padding:0; min-height:0; flex-shrink:0; font-family:inherit; }
    @media(max-width:400px){
      .g-dash-val { font-size:19px; }
    }

    /* ── Dashboard ocupa a tela inteira, sem rolagem da página ── */
    .g-dash-mode .g-content { padding-bottom:0; }
    .g-dash-mode .container.wide {
      padding:16px 16px 10px;
      height:calc(100dvh - 60px - env(safe-area-inset-bottom, 0px));
      display:flex; flex-direction:column;
    }
    .g-dash-mode .card { flex:1; min-height:0; display:flex; flex-direction:column; }
    .g-dash-root { flex:1; min-height:0; display:flex; flex-direction:column; gap:9px; }
    .g-dash-grid {
      flex:1; min-height:0; display:grid; gap:9px;
      grid-template-columns:repeat(2,minmax(0,1fr));
      grid-template-rows:auto auto auto auto 1fr;
      grid-template-areas:"prox agend" "agenda cli" "agenda fat" "agenda fatmes" "notas notas";
    }
    .g-dash-agenda { grid-area:agenda; min-height:0; display:flex; flex-direction:column; }
    .g-dash-agenda-list { flex:1; min-height:0; overflow-y:auto; }
    .g-dash-notas { grid-area:notas; min-height:0; display:flex; flex-direction:column; }
    .g-dash-notas-list { flex:1; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:8px; }
    @media(min-width:768px){
      .g-dash-mode .container.wide { height:100dvh; padding:24px 16px 16px; }
    }


    /* ── Botões de agendamento ── */
    .ag-btn {
      font-family:inherit;
      height:30px;
      border-radius:6px;
      font-size:11px;
      font-weight:600;
      cursor:pointer;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:4px;
      transition:background 160ms ease, border-color 160ms ease;
      letter-spacing:.01em;
      white-space:nowrap;
    }
    .ag-btn-wa  { background:#f0fdf4; border:1px solid #86efac; color:#16a34a; }
    .ag-btn-wa:hover { background:#dcfce7; }
    .ag-wa-dd-item {
      display:block; width:100%; padding:9px 14px; text-align:left;
      font-family:inherit; font-size:13px; font-weight:500; color:#1a1a1a;
      background:none; border:none; border-bottom:0.5px solid #e4e4e7; cursor:pointer;
    }
    .ag-wa-dd-item:last-child { border-bottom:none; }
    .ag-wa-dd-item:hover { background:#f9fafb; }

    /* ── Bottom nav bar ── */
    .g-bottom-nav {
      position:fixed; bottom:0; left:0; right:0; height:60px; z-index:300;
      background:#ffffff; box-shadow:0 -4px 16px rgba(0,0,0,0.10);
      display:flex; align-items:stretch;
    }
    .g-bn-item {
      flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:4px; border:none; background:none; cursor:pointer;
      color:#bbb; transition:color .15s;
      font-size:11px; font-weight:600; font-family:'Nunito',sans-serif;
      padding:0;
    }
    .g-bn-item:hover { color:#888; }
    .g-bn-item.active { color:#1a1a1a; }
    .g-bn-item.active .g-bn-ico { opacity:1; }
    .g-bn-ico { width:22px; height:22px; opacity:1; transition:opacity .15s; }

    /* ── Desktop: side nav instead of bottom nav ── */
    @media(min-width:768px){
      .g-layout { flex-direction:row; }
      .g-content { padding-bottom:0; }
      .g-bottom-nav {
        position:sticky; top:0; height:100vh;
        flex-direction:column; width:140px; box-shadow:none;
        border-right:1px solid var(--line);
      }
      .g-bn-item {
        flex:none; flex-direction:row; justify-content:flex-start;
        gap:10px; padding:14px 18px; font-size:13px;
      }
      .g-bn-item.active { background:#f5f5f5; }
      .g-bn-ico { width:18px; height:18px; }
    }
  </style>`;

  function draw(){
    // Cargas assincronas (clientes, notas, financeiro) terminam depois; se o usuario ja saiu
    // da gestao (ex.: master voltou ao painel), nao redesenha a gestao por cima da outra tela.
    if(currentRoute.page !== 'gestao') return;
    preservarCamposPersonalizar();
    const isMaster = currentProfile?.role === 'master';
    const navFiltrado = emp.tipo === 'pagina'
      ? GESTAO_NAV.filter(n => n.id === 'configurar')
      : GESTAO_NAV;
    const navItems = navFiltrado.map(n => `
      <button class="g-bn-item ${corner===n.id?'active':''}" onclick="setCorner(${n.id===null?'null':`'${n.id}'`})">
        <span class="g-bn-ico">${n.ico}</span>
        <span>${n.label === 'Configurar' && emp.tipo === 'pagina' ? 'Pagina' : n.label}</span>
      </button>`).join('');

    const body = corner==='dashboard'    ? dashboardBody()
               : corner==='configurar'   ? configurarBody()
               : corner==='financeiro'   ? financeiroBody()
               : corner==='clientes'     ? clientesBody()
               : corner==='relatorios'   ? relatoriosBody()
               : agendamentosBody();

    const cardStyle = (corner==='configurar' || corner==='financeiro' || corner==='dashboard' || corner==='clientes' || corner==='relatorios' || corner===null) ? 'background:none;box-shadow:none;padding:0;' : '';

    // Trial vencido: so avisa (a empresa continua funcionando; bloquear e decisao manual do master)
    const trialVencido = emp.status === 'trial' && emp.trialExpiraEm && new Date(emp.trialExpiraEm) < new Date();
    const avisoTrial = trialVencido
      ? `<div role="status" style="background:#fff8ec;border:1px solid #fcd34d;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#92400e;line-height:1.5;flex-shrink:0;"><strong>Seu período de teste terminou.</strong> Para continuar usando a Agen+, fale com o suporte: <a href="mailto:suporte@agenplus.com.br" style="color:#92400e;font-weight:700;">suporte@agenplus.com.br</a></div>`
      : '';


    render(`
      ${finalizarModalHtml()}
      ${novoAgModalHtml()}
      <div style="position:sticky;top:0;z-index:300;">
        ${barraVoltarMaster()}
      </div>
      <div class="g-layout ${corner==='dashboard'?'g-dash-mode':''}">
        <nav class="g-bottom-nav">
          ${navItems}
        </nav>
        <div class="g-content">
          <div class="container wide">
            ${avisoTrial}
            <div class="card" style="${cardStyle}">${body}</div>
          </div>
        </div>
      </div>
    `);
    if(configurarSub === 'personalizar') setTimeout(_initRodaCores, 0);
  }

// Handlers chamados pelos onclick do HTML. Registrados a cada renderGestao().
function _registrarHandlersNucleo(){

  window.setCorner = (c)=>{
    // Saindo de Personalizar sem salvar: desfaz o que foi digitado (ver _restaurarPersonalizar)
    if(configurarSub === 'personalizar' && _personalizarOriginal) Object.assign(emp, _personalizarOriginal);
    // Reset de estado comum
    corner=c; editandoId=null; novoAgState=null; configurarSub=null;
    _removendoServicoIdx=null; _waMenuId=null; _gFinModal=null; _notaModal=null; _finalizarAgId=null; _finalizarAcao=null; _novoAgModalOpen=false;
    _novoAgClienteId=null; _novoAgClienteBusca=''; _novoAgClienteResultados=[];
    _clientePerfilId=null; _clientePerfilEditando=false; _clienteModalNovo=false;
    // Executa ação específica da aba sem recarregar todos os dados
    if(c==='financeiro'){
      _gFinData = isoData(new Date()); _gFinPeriodo='dia'; _gFinLancamentos=[]; _gFinModal=null;
      draw(); gFinCarregar();
    } else if(c==='dashboard'){
      draw();
      if(!_gFinLancamentos.length) gFinCarregar();
      carregarNotas();
    } else if(c==='relatorios'){
      _relAba=null;
      draw();
      if(!_gFinLancamentos.length) gFinCarregar();
    } else if(c==='clientes'){
      draw(); carregarClientes();
    } else {
      draw();
    }
  };
  window.selecionarDiaGestao = (iso)=>{
    if(!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
    diaSelecionado=iso; editandoId=null; novoAgState=null; _waMenuId=null; draw();
  };
}

// ---------- GESTÃO (PAINEL) ----------
function renderGestao(empInicial){
  // Estado declarado em estado.js; aqui recebe os valores iniciais a cada abertura.
  // emp e reatribuido na atualizacao automatica (atualizarDadosDaTela, em core.js),
  // que recria os objetos de empresa; senão a tela congela nos dados antigos.
  emp = empInicial;
  setFavicon(false);
  applyAccent('#1c1917');
  document.title = `Gestão — ${emp.nome}`;
  corner = emp.tipo === 'pagina' ? 'configurar' : 'dashboard';
  diaSelecionado = null;
  editandoId = null;
  novoAgState = null;
  configurarSub = emp.tipo === 'pagina' ? 'personalizar' : null; // null | 'servicos' | 'horarios' | 'personalizar' | 'mensagens'
  _waMenuId = null; // id do agendamento com dropdown WA aberto
  _inativoWaMenuId = null; // id do cliente inativo com dropdown WA aberto

  _rodaH = 0, _rodaS = 0, _rodaV = 100; // estado da roda de cores (HSV)

  personalizarDirty = false;
  _personalizarOriginal = { nome:emp.nome, descricao:emp.descricao, textoDestaque:emp.textoDestaque, textoAgendar:emp.textoAgendar, corPrincipal:emp.corPrincipal };
  novoBotaoState = null;
  editandoBotaoId = null;
  _removendoServicoIdx = null;
  _editandoServicoIdx = null;
  _novoServicoForm = false;

  // Estado do financeiro (gestão)
  _gFinPeriodo = 'dia'; // 'dia' | 'mes'
  _gFinData = isoData(new Date()); // ISO date para dia, 'YYYY-MM' para mes
  _gFinLancamentos = []; // registros de lancamentos_financeiros
  _gFinModal = null; // { tipo, agId?, descricao, valor, editId? }
  _gFinFiltro = 'todos'; // 'todos' | 'entradas' | 'saidas'
  _gFinAgLancados = new Set(); // IDs de agendamentos já lançados — reconstruído do banco em cada chamada de gFinCarregar()
  _finalizarAgId  = null; // ID do agendamento com modal "Finalizar" aberto
  _finalizarAcao = null; // null = etapa 1 (escolha) | 'atendido' = etapa 2 (valor)
  _novoAgModalOpen = false; // modal de novo agendamento aberto

  // Estado de relatórios
  _relAba = null; // null = menu | 'financeiro' | 'agendamentos' | 'clientes' | 'servicos'
  _relMes = isoData(new Date()).slice(0,7); // YYYY-MM

  // Estado de clientes
  _clientes = [];
  _clientesBusca = '';
  _clientesCarregando = false;
  _clienteModalNovo = false;
  _novoAgClienteId = null; // cliente selecionado no formulário de novo agendamento
  _novoAgClienteBusca = '';
  _novoAgClienteResultados = [];
  // Perfil do cliente
  _clientePerfilId = null;
  _clientePerfilEditando = false;
  _excluirClienteModal = null; // id do cliente aguardando confirmação de exclusão
  // Inativos
  _clientesAba = 'todos'; // 'todos' | 'ausentes'
  _clientesInativosFiltro = 30; // faixa selecionada: 15 | 30 | 45 (compartilhada com o dashboard)
  _clientesBannerDismissed = false;

  // Estado do bloco de notas (dashboard)
  _notas = [];          // registros da tabela notas
  _notaModal = null;    // { texto, cor }

  _novoAgCriarCliente = false;
  _novoAgServicos = []; // ids dos servicos selecionados no modal manual

  // Guarda as funcoes de listener do window para poder remover antes de adicionar novos
  _rodaWinListeners = null;

  _dragFromId = null;

  if(!document.getElementById('gestao-css')){ const _gs=document.createElement('div'); _gs.innerHTML=GESTAO_CSS; const _el=_gs.firstElementChild; _el.id='gestao-css'; document.head.appendChild(_el); }

  // Handlers de cada aba (js/gestao/*.js)
  _registrarHandlersNucleo();
  _registrarHandlersDashboard();
  _registrarHandlersAgenda();
  _registrarHandlersClientes();
  _registrarHandlersFinanceiro();
  _registrarHandlersRelatorios();
  _registrarHandlersConfigurar();
  _registrarHandlersHorarios();
  _registrarHandlersPersonalizar();

  draw();
  gFinCarregar();
  carregarNotas();
  carregarClientes();
  pararPolling();
  iniciarPolling(()=>{
    // Reaponta para o objeto novo criado pelo loadData()
    const atual = empresas.find(e => e.slug === emp.slug);
    if(atual) emp = atual;
    // Não redesenha se houver formulário aberto (evita apagar campos em edição)
    const formAberto = editandoId !== null || novoAgState !== null || novoBotaoState !== null || editandoBotaoId !== null || _gFinModal !== null || _notaModal !== null || _clienteModalNovo || _clientePerfilEditando || _finalizarAgId !== null || _excluirClienteModal !== null;
    if(!formAberto && (corner===null || corner==='dashboard')) draw();
  });
}
