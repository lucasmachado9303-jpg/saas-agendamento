// ---------- GESTÃO (PAINEL) ----------
function renderGestao(empInicial){
  // 'let' porque o polling recria os objetos de empresa a cada 30s
  // e precisamos trocar a referência, senão a tela congela nos dados antigos.
  let emp = empInicial;
  setFavicon(false);
  applyAccent('#1c1917');
  document.title = `Gestão — ${emp.nome}`;
  let corner = emp.tipo === 'pagina' ? 'configurar' : 'dashboard';
  let diaSelecionado = null;
  let editandoId = null;
  let novoAgState = null;
  let configurarSub = emp.tipo === 'pagina' ? 'personalizar' : null; // null | 'servicos' | 'horarios' | 'personalizar' | 'mensagens'
  let _waMenuId = null; // id do agendamento com dropdown WA aberto
  let _horariosDiaSel = null; // dia selecionado na aba de config de horarios (0-6)
  let _inativoWaMenuId = null; // id do cliente inativo com dropdown WA aberto

  let _rodaH = 0, _rodaS = 0, _rodaV = 100; // estado da roda de cores (HSV)

  let personalizarDirty = false;
  let novoBotaoState = null;
  let editandoBotaoId = null;
  let _removendoServicoIdx = null;
  let _editandoServicoIdx = null;
  let _novoServicoForm = false;

  // Estado do financeiro (gestão)
  let _gFinPeriodo = 'dia'; // 'dia' | 'mes'
  let _gFinData = isoData(new Date()); // ISO date para dia, 'YYYY-MM' para mes
  let _gFinLancamentos = []; // registros de lancamentos_financeiros
  let _gFinModal = null; // { tipo, agId?, descricao, valor, editId? }
  let _gFinFiltro = 'todos'; // 'todos' | 'entradas' | 'saidas'
  let _gFinCarregando = false;
  let _gFinAgLancados = new Set(); // IDs de agendamentos já lançados — reconstruído do banco em cada chamada de gFinCarregar()
  let _finalizarAgId  = null; // ID do agendamento com modal "Finalizar" aberto
  let _finalizarAcao = null; // null = etapa 1 (escolha) | 'atendido' = etapa 2 (valor)
  let _novoAgModalOpen = false; // modal de novo agendamento aberto

  // Estado de relatórios
  let _relAba = null; // null = menu | 'financeiro' | 'agendamentos' | 'clientes' | 'servicos'
  let _relMes = isoData(new Date()).slice(0,7); // YYYY-MM

  // Estado de clientes
  let _clientes = [];
  let _clientesBusca = '';
  let _clientesCarregando = false;
  let _clienteModalNovo = false;
  let _novoAgClienteId = null; // cliente selecionado no formulário de novo agendamento
  let _novoAgClienteBusca = '';
  let _novoAgClienteResultados = [];
  // Perfil do cliente
  let _clientePerfilId = null;
  let _clientePerfilEditando = false;
  let _excluirClienteModal = null; // id do cliente aguardando confirmação de exclusão
  // Inativos
  let _clientesAba = 'todos'; // 'todos' | 'ausentes'
  let _clientesInativosFiltro = 30; // faixa selecionada: 15 | 30 | 45 (compartilhada com o dashboard)
  let _clientesBannerDismissed = false;

  // Estado do bloco de notas (dashboard)
  let _notas = [];          // registros da tabela notas
  let _notaModal = null;    // { texto, cor, editId? }
  let _notasCarregando = false;

  function agendamentosBody(){
    if(diaSelecionado===null){
      // começa no dia de hoje independente de ter horário ou não
      diaSelecionado = isoData(new Date());
    }
    const dataObj = new Date(diaSelecionado+"T00:00:00");
    const dataFmt = dataObj.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});

    function isoAddDias(iso, n){
      const d = new Date(iso+"T00:00:00");
      d.setDate(d.getDate()+n);
      return isoData(d);
    }

    const _diaAgSemana = new Date(diaSelecionado+'T00:00:00').getDay();
    const horariosConfig = horariosParaDia(emp, _diaAgSemana);
    const horariosAg = agendamentos
      .filter(a=>a.slug===emp.slug && a.data===diaSelecionado)
      .map(a=>a.hora);
    const horarios = [...new Set([...horariosConfig, ...horariosAg])].sort();
    const _hpm2 = emp.horariosPorMes || {};
    const diasTrabalho = ('_dias_' in _hpm2)
      ? (_hpm2['_dias_'] || []).map(Number)
      : [0,1,2,3,4,5,6];
    const diaDaSemana = new Date(diaSelecionado+"T00:00:00").getDay();
    const diaNaoTrabalha = !diasTrabalho.includes(diaDaSemana);
    const diaTodoBloqueado = diaNaoTrabalha || (horarios.length > 0 && horarios.every(h=>(emp.bloqueios||[]).some(b=>b.data===diaSelecionado && b.hora===h)));
    const agora = new Date();
    const hojeStr = isoData(agora);
    const horaAgora = agora.getHours().toString().padStart(2,'0')+':'+agora.getMinutes().toString().padStart(2,'0');
    const diaPassado = diaSelecionado < hojeStr;
    const linhas = horarios.length ? (()=>{
      const parts = [];
      for(const h of horarios){
        // Um horario pode ter um agendamento ativo e, alem dele, cancelados antigos.
        // O cancelado nao ocupa mais a vaga — fica so como registro riscado.
        const agsHora    = agendamentos.filter(a=>a.slug===emp.slug && a.data===diaSelecionado && a.hora===h);
        const ag         = agsHora.find(a=>a.status!=='cancelado') || null;
        const cancelados = agsHora.filter(a=>a.status==='cancelado');
        const bloqueado = (emp.bloqueios||[]).some(b=>b.data===diaSelecionado && b.hora===h);
        const passadoHora = diaPassado || (diaSelecionado === hojeStr && h < horaAgora);
        const cardAgendamento = (ag)=>{
          const pendenteFin = passadoHora && ag.status!=='cancelado' && !_gFinAgLancados.has(ag.id);
          const jaAtendido  = passadoHora && ag.status!=='cancelado' && _gFinAgLancados.has(ag.id);
          const cardStyle2 = ag.status==='cancelado'
            ? 'opacity:0.3;filter:grayscale(1);background:#f7f7f7;'
            : jaAtendido
              ? 'opacity:0.45;background:#f7f7f7;'
              : 'box-shadow:0 2px 12px rgba(0,0,0,0.15);';
          const statusCor = ag.status==='confirmado' ? '#16a34a' : ag.status==='cancelado' ? '#dc2626' : '#6b7280';
          const statusLabel = ag.status==='confirmado' ? 'Confirmado' : ag.status==='cancelado' ? 'Cancelado' : 'Não confirmado';
          const nomeStyle = '';
          const BTN = 'font-family:inherit;height:28px;width:72px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;border:0.5px solid #ccc;background:#fff;color:#555;';
          const BTN_FIN = 'font-family:inherit;height:28px;padding:0 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;border:1.5px solid #d97706;background:#fff;color:#d97706;';
          const botoesPendente = `<div style="display:flex;justify-content:flex-end;"><button style="${BTN_FIN}" onclick="abrirFinalizarModal('${ag.id}')">Finalizar</button></div>`;
          const botoesAtivo = `
            <div style="display:flex;gap:5px;justify-content:flex-end;">
              <button style="${BTN}" onclick="editarAgendamento('${ag.id}')">Editar</button>
              <button style="${BTN}border-color:#fed7aa;color:#c2410c;" onclick="cancelarAgendamento('${ag.id}')">Cancelar</button>
              <button style="${BTN}border-color:#fca5a5;color:#dc2626;" onclick="excluirAgendamento('${ag.id}')">Excluir</button>
              <div style="position:relative;">
                <button style="${BTN}border-color:#86efac;color:#16a34a;" onclick="toggleWaMenu('${ag.id}')">WhatsApp</button>
                ${_waMenuId === ag.id ? `<div style="position:absolute;top:calc(100% + 4px);right:0;min-width:130px;background:#fff;border:0.5px solid #d1d5db;border-radius:9px;overflow:hidden;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,.10);">
                  <button class="ag-wa-dd-item" onclick="waAcao('${ag.id}','conversar','${emp.id}')">Conversar</button>
                  <button class="ag-wa-dd-item" onclick="waAcao('${ag.id}','confirmacao','${emp.id}')">Confirmação ${ag.confirmacaoEnviada ? '<span style="color:#22c55e">&#10003;</span>' : ''}</button>
                  <button class="ag-wa-dd-item" onclick="waAcao('${ag.id}','lembrete','${emp.id}')">Lembrete ${ag.lembreteEnviado ? '<span style="color:#22c55e">&#10003;</span>' : ''}</button>
                </div>` : ''}
              </div>
            </div>`;
          const BTN_EXC = 'font-family:inherit;height:28px;padding:0 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;border:0.5px solid #fca5a5;background:#fff;color:#dc2626;';
          const botoesAtendido = `<div style="display:flex;justify-content:flex-end;"><button style="${BTN_EXC}" onclick="excluirAgendamento('${ag.id}')">Excluir</button></div>`;
          const botoes = ag.status==='cancelado' ? '' : pendenteFin ? botoesPendente : jaAtendido ? botoesAtendido : botoesAtivo;
          const showBadge = !passadoHora || ag.status==='cancelado' || jaAtendido;
          const badgeCor = jaAtendido ? '#16a34a' : statusCor;
          const badgeLabel = jaAtendido ? 'Atendido' : statusLabel;
          return `<div style="padding:10px 12px;margin-bottom:6px;border-radius:9px;border:0.5px solid #e4e4e7;background:var(--card);display:flex;flex-direction:column;gap:8px;${cardStyle2}">
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <div style="font-weight:700;font-size:15px;${nomeStyle}">${h} — ${escapeHtml(ag.nome)}</div>
                ${showBadge ? `<div style="font-size:11px;font-weight:600;white-space:nowrap;color:${badgeCor};">${badgeLabel}</div>` : ''}
              </div>
              <div class="muted" style="font-size:13px;margin-top:2px;">${escapeHtml(ag.servicoNome)}</div>
            </div>
            ${botoes}
          </div>`;
        };
        if(ag){
          parts.push(cardAgendamento(ag));
          continue;
        }
        if(bloqueado){
          parts.push(`<div style="padding:8px 12px;margin-bottom:6px;border-radius:9px;border:0.5px solid #e0e0e0;background:var(--card);display:flex;align-items:center;justify-content:space-between;opacity:${passadoHora?'0.4':'.45'};">
            <span style="font-weight:700;font-size:13px;color:#e53935;">${h} — Bloqueado</span>
            <button style="font-family:inherit;height:24px;border-radius:5px;border:0.5px solid #ccc;background:#fff;color:#555;font-size:10px;font-weight:600;cursor:pointer;" onclick="desbloquearHorario('${diaSelecionado}','${h}')">Desbloquear</button>
          </div>`);
          continue;
        }
        // Slot livre
        parts.push(`<div style="padding:10px 12px;margin-bottom:6px;border-radius:9px;border:0.5px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;${passadoHora?'opacity:0.3;filter:grayscale(1);background:#f7f7f7;':'background:var(--card);box-shadow:0 2px 12px rgba(0,0,0,0.15);'}">
          <span style="font-weight:700;font-size:15px;color:#1a1a1a;">${h} — <span style="color:#1a1a1a;font-weight:400;">Livre</span></span>
          <div style="display:flex;gap:4px;">
            <button style="font-family:inherit;height:28px;width:72px;border-radius:6px;border:0.5px solid #ccc;background:#fff;color:#555;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;" onclick="novoAgendamento('${diaSelecionado}','${h}')">Agendar</button>
            ${!passadoHora ? `<button style="font-family:inherit;height:28px;width:72px;border-radius:6px;border:0.5px solid #ccc;background:#fff;color:#555;font-size:11px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;" onclick="bloquearHorario('${diaSelecionado}','${h}')">Bloquear</button>` : ''}
          </div>
        </div>`);
        // Agendamentos cancelados nao sao exibidos na agenda (visíveis apenas em historico e relatorios)
      }
      return parts.join('');
    })()
    : `<p class="muted" style="text-align:center;padding:20px 0;">Nenhum horário configurado para este dia.</p>`;

    const diaNome = dataObj.toLocaleDateString('pt-BR',{weekday:'long'});
    const hoje = isoData(new Date());
    const isHoje = diaSelecionado === hoje;
    const editModalHtml = (()=>{
      if(!editandoId) return '';
      const agEd = agendamentos.find(a=>a.id===editandoId);
      if(!agEd) return '';
      const servicoOpts = emp.servicos.map(s=>`<option value="${s.id}" ${agEd.servicoId===s.id?'selected':''}>${escapeHtml(s.nome)}</option>`).join('');
      const horariosOpts = horarios.map(hh=>`<option value="${hh}" ${hh===agEd.hora?'selected':''}>${hh}</option>`).join('');
      return `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center;" onclick="if(event.target===this)cancelarEdicaoAgendamento()">
        <div style="background:#fff;border-radius:18px 18px 0 0;padding:28px 24px 40px;width:100%;max-width:520px;">
          <h3 style="font-family:Nunito,sans-serif;font-weight:700;font-size:18px;margin:0 0 20px;">Editar agendamento</h3>
          <div class="field"><label>Nome</label><input id="editNome" maxlength="100" value="${escapeAttr(agEd.nome)}"/></div>
          <div class="field"><label>Telefone</label><input id="editTel" type="tel" inputmode="numeric" maxlength="16" value="${escapeAttr(fmtTelStr(agEd.telefone))}" oninput="maskTel(this)"/></div>
          <div class="row">
            <div class="field"><label>Serviço</label><select id="editServico">${servicoOpts}</select></div>
            <div class="field"><label>Horário</label><select id="editHora">${horariosOpts}</select></div>
          </div>
          <div class="row" style="margin-top:8px;">
            <button class="btn ghost" onclick="cancelarEdicaoAgendamento()">Cancelar</button>
            <button class="btn" onclick="salvarEdicaoAgendamento('${agEd.id}')">Salvar</button>
          </div>
        </div>
      </div>`;
    })();

    return `
      ${editModalHtml}
      <div style="font-size:22px;font-weight:700;color:#1a1a1a;margin-bottom:16px;padding:0 4px;">Agenda</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <button style="background:none;border:none;font-size:22px;font-weight:300;color:#888;cursor:pointer;padding:4px 12px;line-height:1;" onclick="selecionarDiaGestao('${isoAddDias(diaSelecionado,-1)}')">&#8249;</button>
        <div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById('calGestao').showPicker?document.getElementById('calGestao').showPicker():document.getElementById('calGestao').click()}" style="position:relative;text-align:center;cursor:pointer;" onclick="document.getElementById('calGestao').showPicker ? document.getElementById('calGestao').showPicker() : document.getElementById('calGestao').click()">
          <div style="font-family:'Nunito',sans-serif;font-size:18px;font-weight:700;">${dataFmt}</div>
          <div style="font-size:13px;color:var(--ink-soft);text-transform:capitalize;">${diaNome}${isHoje?' · Hoje':''}</div>
          <input type="date" id="calGestao" value="${diaSelecionado}" style="position:absolute;opacity:0;width:1px;height:1px;top:0;left:50%;" onchange="selecionarDiaGestao(this.value)"/>
        </div>
        <button style="background:none;border:none;font-size:22px;font-weight:300;color:#888;cursor:pointer;padding:4px 12px;line-height:1;" onclick="selecionarDiaGestao('${isoAddDias(diaSelecionado,1)}')">&#8250;</button>
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        ${diaNaoTrabalha
          ? ``
          : diaTodoBloqueado
            ? `<button class="icon-btn" style="font-size:12px;color:var(--ok);" onclick="desbloquearDiaTodo()">Desbloquear dia todo</button>`
            : `<button class="icon-btn" style="font-size:12px;color:var(--danger);" onclick="bloquearDiaTodo()">Bloquear dia todo</button>`
        }
      </div>
      ${diaNaoTrabalha
        ? `<div style="text-align:center;padding:32px 16px;color:var(--ink-soft);">
            <div style="font-weight:600;margin-bottom:4px;">Dia não configurado</div>
            <div style="font-size:13px;margin-bottom:16px;">Este dia da semana não está marcado como dia de atendimento.</div>
            <button class="btn ghost" style="font-size:13px;" onclick="irParaHorarios()">Ajustar dias de atendimento</button>
          </div>`
        : diaTodoBloqueado
          ? `<div style="text-align:center;padding:32px 16px;color:var(--ink-soft);">
              <div style="font-weight:600;margin-bottom:4px;">Dia bloqueado</div>
              <div style="font-size:13px;">Todos os horários estão bloqueados.</div>
            </div>`
          : horarios.length === 0
            ? `<div style="text-align:center;padding:32px 16px;">
                <div style="font-weight:600;margin-bottom:8px;">Nenhum horário configurado</div>
                <div style="font-size:13px;color:var(--ink-soft);margin-bottom:16px;line-height:1.5;">Acesse <strong style="font-weight:500;">Configurar</strong> para adicionar seus serviços e horários de atendimento.</div>
                <button class="btn ghost" style="font-size:13px;" onclick="setCorner('configurar')">Ir para Configurar</button>
              </div>`
            : linhas
      }
      ${(()=>{
        const canceladosDia = agendamentos.filter(a => a.slug===emp.slug && a.data===diaSelecionado && a.status==='cancelado').sort((a,b)=>a.hora.localeCompare(b.hora));
        if(!canceladosDia.length) return '';
        const rows = canceladosDia.map(a=>`
          <div style="padding:10px 12px;margin-bottom:6px;border-radius:9px;border:0.5px solid #e4e4e7;background:#f7f7f7;display:flex;flex-direction:column;gap:4px;opacity:0.5;filter:grayscale(1);">
            <div style="font-weight:700;font-size:15px;color:#1a1a1a;">${a.hora.slice(0,5)} — ${escapeHtml(a.nome)}</div>
            <div style="font-size:13px;color:#8e8e93;">${escapeHtml(a.servicoNome||'')}</div>
          </div>`).join('');
        return `
          <div style="margin-top:18px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:1px;background:#e4e4e7;"></div>
            <span style="font-size:11px;font-weight:600;color:#b0b0b8;text-transform:uppercase;letter-spacing:.06em;">Cancelados</span>
            <div style="flex:1;height:1px;background:#e4e4e7;"></div>
          </div>
          ${rows}`;
      })()}
    `;
  }

  function clientesBody(){
    const ICO_PLUS = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    const ICO_BACK = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
    const ICO_WA = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.532 5.853L.057 23.5l5.83-1.53A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.96 0-3.786-.516-5.363-1.416l-.384-.227-3.98 1.047 1.064-3.878-.25-.399C2.014 15.54 1.5 13.837 1.5 12 1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12 17.799 22.5 12 22.5z"/></svg>`;

    const telWaLink = t => {
      const d = (t||'').replace(/\D/g,'').replace(/^0/,'');
      return `https://wa.me/55${d}`;
    };
    const fmtData = d => { const [y,m,dd]=d.split('-'); return `${dd}/${m}/${y}`; };

    function _diasSemVoltar(c) {
      // #17: usa clienteId quando disponivel; cai para telefone (sem nome) para compatibilidade
      const hojeIso = isoData(new Date());
      const _matchCliente = a => a.slug===emp.slug
        && (a.clienteId ? a.clienteId===c.id : a.telefone===c.telefone)
        && a.status !== 'cancelado';
      const temFuturoAtivo = agendamentos.some(a => _matchCliente(a) && a.data > hojeIso);
      if(temFuturoAtivo) return null;
      const ags = agendamentos.filter(a => _matchCliente(a) && a.data <= hojeIso);
      if(!ags.length) return null;
      const ultima = ags.map(a=>a.data).sort().pop();
      return Math.floor((new Date() - new Date(ultima+'T00:00:00')) / 86400000);
    }

    // VIEW: PERFIL
    if(_clientePerfilId) {
      const c = _clientes.find(x=>x.id===_clientePerfilId);
      if(!c){ _clientePerfilId=null; return clientesBody(); }

      const hist = agendamentos
        .filter(a => a.slug===emp.slug && a.telefone===c.telefone)
        .sort((a,b)=>b.data.localeCompare(a.data)||b.hora.localeCompare(a.hora));

      const histRows = hist.length
        ? hist.map(a=>{
          const cancelado = a.status==='cancelado';
          const atendido  = !cancelado && _gFinAgLancados.has(a.id);
          const statusCor = cancelado ? '#dc2626' : atendido ? '#16a34a' : '#8e8e93';
          const statusLabel = cancelado ? 'Cancelado' : atendido ? 'Atendido' : 'Agendado';
          return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:0.5px solid #f2f2f7;${cancelado?'opacity:0.6;':''}">
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;font-weight:600;color:#1a1a1a;">${escapeHtml(a.servicoNome||'Agendamento')}</div>
              <div style="font-size:13px;color:#8e8e93;margin-top:2px;">${fmtData(a.data)} ${a.hora}</div>
            </div>
            <div style="font-size:11px;font-weight:600;color:${statusCor};flex-shrink:0;margin-left:8px;">${statusLabel}</div>
          </div>`;
        }).join('')
        : `<p class="muted" style="text-align:center;padding:24px 0;">Nenhum agendamento encontrado.</p>`;

      const histSection = `
        <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:10px;padding:0 4px;">Histórico</div>
        <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">${histRows}</div>`;

      const modalExcluir = _excluirClienteModal === c.id ? `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:flex-end;justify-content:center;">
          <div style="background:#fff;border-radius:22px 22px 0 0;padding:24px 20px 32px;width:100%;max-width:480px;box-shadow:0 -4px 32px rgba(0,0,0,0.15);">
            <div style="font-size:17px;font-weight:700;color:#1a1a1a;margin-bottom:6px;">Excluir cliente</div>
            <div style="font-size:14px;color:#8e8e93;margin-bottom:20px;">O que deseja fazer com os agendamentos deste cliente?</div>
            <button onclick="confirmarExcluirCliente('${c.id}', false)" style="width:100%;padding:14px;border-radius:12px;border:1.5px solid #e5e5ea;background:#fff;font-size:15px;font-weight:600;color:#1a1a1a;cursor:pointer;font-family:inherit;margin-bottom:10px;">Manter os agendamentos</button>
            <button onclick="confirmarExcluirCliente('${c.id}', true)" style="width:100%;padding:14px;border-radius:12px;border:none;background:#ff3b30;font-size:15px;font-weight:600;color:#fff;cursor:pointer;font-family:inherit;margin-bottom:14px;">Excluir cliente e agendamentos</button>
            <button onclick="cancelarExcluirCliente()" style="width:100%;padding:12px;border-radius:12px;border:none;background:none;font-size:15px;font-weight:600;color:#8e8e93;cursor:pointer;font-family:inherit;">Cancelar</button>
          </div>
        </div>` : '';

      if(_clientePerfilEditando) {
        return modalExcluir + `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:0 4px;">
            <button onclick="toggleEditarPerfil()" style="background:none;border:none;color:#1a1a1a;cursor:pointer;padding:4px;display:flex;align-items:center;">${ICO_BACK}</button>
            <div style="font-size:18px;font-weight:700;color:#1a1a1a;">Editar cliente</div>
          </div>
          <div style="background:#fff;border-radius:16px;padding:18px;box-shadow:0 2px 12px rgba(0,0,0,0.06);margin-bottom:16px;">
            <div class="field"><label>Nome completo</label><input id="cliNome" type="text" maxlength="100" value="${escapeAttr(c.nome)}" placeholder="Nome do cliente" style="text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()"/></div>
            <div class="field"><label>Telefone (WhatsApp)</label><input id="cliTel" type="tel" inputmode="numeric" maxlength="16" value="${escapeAttr(fmtTelStr(c.telefone))}" placeholder="(xx) xxxxx-xxxx" oninput="maskTel(this)"/></div>
            <div style="display:flex;gap:10px;margin-top:4px;">
              <button class="btn ghost" style="flex:1;" onclick="toggleEditarPerfil()">Cancelar</button>
              <button class="btn" style="flex:1;" onclick="salvarPerfilCliente('${c.id}')">Salvar</button>
            </div>
            <button onclick="excluirClienteDoPerfil('${c.id}')" style="width:100%;margin-top:10px;background:none;border:1.5px solid var(--danger);color:var(--danger);border-radius:12px;padding:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Excluir cliente</button>
          </div>
          ${histSection}`;
      }

      return `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:0 4px;">
          <button onclick="voltarDePerfilCliente()" style="background:none;border:none;color:#1a1a1a;cursor:pointer;padding:4px;display:flex;align-items:center;">${ICO_BACK}</button>
        </div>
        <div style="background:linear-gradient(160deg,#3a3a3a 0%,#5a3560 100%);border-radius:18px;padding:24px 20px 20px;margin-bottom:16px;">
          <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;">${escapeHtml(c.nome)}</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:18px;">${fmtTelStr(c.telefone)}</div>
          <div style="display:flex;gap:10px;">
            <a href="${telWaLink(c.telefone)}" target="_blank" style="flex:1;display:flex;align-items:center;justify-content:center;gap:7px;background:#25d366;color:#fff;border-radius:12px;padding:10px 0;font-size:14px;font-weight:600;text-decoration:none;">${ICO_WA} WhatsApp</a>
            <button onclick="toggleEditarPerfil()" style="flex:1;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:12px;padding:10px 0;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Editar</button>
          </div>
        </div>
        ${histSection}`;
    }

    // VIEW: NOVO CLIENTE
    if(_clienteModalNovo) {
      return `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:0 4px;">
          <button onclick="fecharModalCliente()" style="background:none;border:none;color:#1a1a1a;cursor:pointer;padding:4px;display:flex;align-items:center;">${ICO_BACK}</button>
          <div style="font-size:18px;font-weight:700;color:#1a1a1a;">Novo cliente</div>
        </div>
        <div style="background:#fff;border-radius:16px;padding:18px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
          <div class="field"><label>Nome completo</label><input id="cliNome" type="text" maxlength="100" placeholder="Nome do cliente" style="text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()"/></div>
          <div class="field"><label>Telefone (WhatsApp)</label><input id="cliTel" type="tel" inputmode="numeric" maxlength="16" placeholder="(xx) xxxxx-xxxx" oninput="maskTel(this)"/></div>
          <div style="display:flex;gap:10px;margin-top:4px;">
            <button class="btn ghost" style="flex:1;" onclick="fecharModalCliente()">Cancelar</button>
            <button class="btn" style="flex:1;" onclick="salvarNovoCliente()">Salvar</button>
          </div>
        </div>`;
    }

    // Calcular ausentes (faixas exclusivas)
    // #18/#34: faixas exclusivas e alinhadas com os labels dos botoes
    const inativos30 = _clientes.filter(c => { const d=_diasSemVoltar(c); return d!==null && d>=30; });
    const inativos15total = _clientes.filter(c => { const d=_diasSemVoltar(c); return d!==null && d>=15; });
    const ausentesFaixa15 = _clientes.filter(c => { const d=_diasSemVoltar(c); return d!==null && d>=15 && d<30; });
    const ausentesFaixa30 = _clientes.filter(c => { const d=_diasSemVoltar(c); return d!==null && d>=30 && d<45; });
    const ausentesFaixa45 = _clientes.filter(c => { const d=_diasSemVoltar(c); return d!==null && d>=45; });
    const clientesAusentes = _clientesInativosFiltro===15 ? ausentesFaixa15 : _clientesInativosFiltro===30 ? ausentesFaixa30 : ausentesFaixa45;

    // Banner
    const banner = (!_clientesBannerDismissed && inativos15total.length && _clientesAba==='todos') ? `
      <div style="background:#fffbea;border:1px solid #fcd34d;border-radius:14px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="font-size:14px;color:#92400e;font-weight:500;">${inativos15total.length} cliente${inativos15total.length!==1?'s':''} sem voltar há 15 dias ou mais.</div>
        <button onclick="dispensarBannerClientes()" style="background:none;border:none;color:#92400e;cursor:pointer;font-size:20px;line-height:1;padding:0 4px;">&times;</button>
      </div>` : '';

    // Tabs
    const tabs = `
      <div style="display:flex;gap:0;background:#f2f2f7;border-radius:12px;padding:3px;margin-bottom:14px;">
        <button onclick="setClientesAba('todos')" style="flex:1;padding:7px 0;border-radius:9px;border:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;${_clientesAba==='todos'?'background:#fff;color:#1a1a1a;box-shadow:0 1px 4px rgba(0,0,0,0.1);':'background:transparent;color:#8e8e93;'}">Todos</button>
        <button onclick="setClientesAba('ausentes')" style="flex:1;padding:7px 0;border-radius:9px;border:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;${_clientesAba==='ausentes'?'background:#fff;color:#1a1a1a;box-shadow:0 1px 4px rgba(0,0,0,0.1);':'background:transparent;color:#8e8e93;'}">Ausentes${inativos15total.length?` <span style="background:#ef4444;color:#fff;border-radius:99px;font-size:11px;padding:1px 6px;margin-left:4px;vertical-align:middle;">${inativos15total.length}</span>`:''}</button>
      </div>`;

    // VIEW: AUSENTES
    if(_clientesAba === 'ausentes') {
      const diaColor = d => d>=46?'#dc2626':d>=31?'#f97316':'#d97706';
      const faixaBtns = `
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <button onclick="setInativosFiltro(15)" style="flex:1;padding:7px 0;border-radius:9px;border:1.5px solid ${_clientesInativosFiltro===15?'#1a1a1a':'#e4e4e7'};font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;background:${_clientesInativosFiltro===15?'#1a1a1a':'#fff'};color:${_clientesInativosFiltro===15?'#fff':'#8e8e93'};">+15 dias<br><span style="font-size:11px;font-weight:400;">${ausentesFaixa15.length}</span></button>
          <button onclick="setInativosFiltro(30)" style="flex:1;padding:7px 0;border-radius:9px;border:1.5px solid ${_clientesInativosFiltro===30?'#1a1a1a':'#e4e4e7'};font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;background:${_clientesInativosFiltro===30?'#1a1a1a':'#fff'};color:${_clientesInativosFiltro===30?'#fff':'#8e8e93'};">+30 dias<br><span style="font-size:11px;font-weight:400;">${ausentesFaixa30.length}</span></button>
          <button onclick="setInativosFiltro(45)" style="flex:1;padding:7px 0;border-radius:9px;border:1.5px solid ${_clientesInativosFiltro===45?'#1a1a1a':'#e4e4e7'};font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;background:${_clientesInativosFiltro===45?'#1a1a1a':'#fff'};color:${_clientesInativosFiltro===45?'#fff':'#8e8e93'};">+45 dias<br><span style="font-size:11px;font-weight:400;">${ausentesFaixa45.length}</span></button>
        </div>`;
      const ausenteRows = clientesAusentes.length
        ? clientesAusentes.map(c=>{
            const dias=_diasSemVoltar(c);
            return `
              <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:0.5px solid #f2f2f7;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                <div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();abrirPerfilCliente('${c.id}')}" onclick="abrirPerfilCliente('${c.id}')" style="flex:1;min-width:0;cursor:pointer;">
                  <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.nome)}</div>
                  <div style="font-size:13px;color:#8e8e93;margin-top:2px;">${fmtTelStr(c.telefone)}</div>
                </div>
                <div style="text-align:center;min-width:42px;">
                  <div style="font-size:18px;font-weight:700;color:${diaColor(dias)};">${dias}</div>
                  <div style="font-size:11px;color:#8e8e93;">dias</div>
                </div>
                <div style="position:relative;">
                  <button onclick="event.stopPropagation();toggleWaMenuInativo('${c.id}')" class="ag-btn ag-btn-wa" style="padding:6px 10px;">${ICO_WA}</button>
                  ${_inativoWaMenuId === c.id ? `<div style="position:absolute;top:calc(100% + 4px);right:0;min-width:130px;background:#fff;border:0.5px solid #d1d5db;border-radius:9px;overflow:hidden;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,.10);" onclick="event.stopPropagation()">
                    <button class="ag-wa-dd-item" onclick="waAcaoInativo('${c.id}','conversar','${emp.id}')">Conversar</button>
                    <button class="ag-wa-dd-item" style="border-bottom:none;" onclick="waAcaoInativo('${c.id}','inativo','${emp.id}')">Ausente ${c.ausenteEnviadoEm ? '<span style="color:#22c55e">&#10003;</span>' : ''}</button>
                  </div>` : ''}
                </div>
              </div>`;
          }).join('')
        : `<p class="muted" style="text-align:center;padding:24px 0;">Nenhum cliente nesta faixa.</p>`;
      const wrapI = clientesAusentes.length
        ? `<div style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">${ausenteRows}</div>`
        : ausenteRows;
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 4px;">
          <div style="font-size:22px;font-weight:700;color:#1a1a1a;">Clientes</div>
          <button onclick="abrirNovoCliente()" style="display:flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:10px;border:none;background:#1a1a1a;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">${ICO_PLUS} Novo</button>
        </div>
        ${tabs}
        ${faixaBtns}
        ${wrapI}`;
    }

    // VIEW: LISTA TODOS
    const listados = _clientes.filter(c => {
      if(!_clientesBusca) return true;
      const q = _clientesBusca.toLowerCase();
      const digits = _clientesBusca.replace(/\D/g,'');
      return c.nome.toLowerCase().includes(q) || (digits && (c.telefone||'').includes(digits));
    });

    const rows = listados.map(c => `
      <div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();abrirPerfilCliente('${c.id}')}" onclick="abrirPerfilCliente('${c.id}')" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:0.5px solid #f2f2f7;cursor:pointer;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.nome)}</div>
          <div style="font-size:13px;color:#8e8e93;margin-top:2px;">${fmtTelStr(c.telefone)}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`).join('');

    const listaHtml = _clientesCarregando
      ? `<p class="muted" style="text-align:center;padding:24px 0;">Carregando...</p>`
      : listados.length
        ? `<div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">${rows}</div>`
        : `<p class="muted" style="text-align:center;padding:24px 0;">${_clientesBusca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>`;

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 4px;">
        <div style="font-size:22px;font-weight:700;color:#1a1a1a;">Clientes</div>
        <button onclick="abrirNovoCliente()" style="display:flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:10px;border:none;background:#1a1a1a;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">${ICO_PLUS} Novo</button>
      </div>
      ${banner}
      ${tabs}
      <div style="margin-bottom:14px;">
        <input id="clientesBuscaInput" type="search" value="${escapeAttr(_clientesBusca)}" placeholder="Buscar por nome ou telefone..." oninput="filtrarClientesLive(this.value)"
          style="width:100%;border:0.5px solid #e4e4e7;border-radius:12px;padding:10px 14px;font-size:15px;font-family:inherit;color:#1a1a1a;background:#fff;box-sizing:border-box;"/>
      </div>
      <div id="clientesListaWrap">${listaHtml}</div>
      <div style="text-align:center;margin-top:12px;color:#8e8e93;font-size:13px;">${_clientes.length} cliente${_clientes.length!==1?'s':''} cadastrado${_clientes.length!==1?'s':''}</div>
    `;
  }

  function configurarBody(){
    if(configurarSub === null){
      const isMaster = currentProfile?.role === 'master';
      const ICO_CHV = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
      const mkItem = (onclick, iconBg, iconSvg, title, desc, divider=true) => `
        <button onclick="${onclick}" style="display:flex;align-items:center;gap:14px;padding:0 20px;min-height:72px;background:#fff;border:none;text-align:left;cursor:pointer;width:100%;transition:background 150ms ease;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background='#fff'">
          <div style="width:34px;height:34px;border-radius:10px;background:${iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${iconSvg}</div>
          <div style="flex:1;min-width:0;padding:16px 0;">
            <div style="font-size:16px;font-weight:600;color:#1a1a1a;line-height:1.2;">${title}</div>
            <div style="font-size:13px;color:#8e8e93;margin-top:3px;line-height:1.3;">${desc}</div>
          </div>
          ${ICO_CHV}
        </button>
        ${divider ? `<div style="height:1px;background:#f2f2f7;margin-left:68px;"></div>` : ''}`;
      const ICO_BRIEF = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>`;
      const ICO_CAL  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
      const ICO_LINK = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
      const ICO_MSG  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      const sairAction = isMaster ? `goto({empresa:'${emp.slug}'})` : `gestaoLogout('${emp.slug}')`;
      const ICO_HELP = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      const itensPagina = `
          ${mkItem("configurarIr('personalizar')","#fdf4ff", ICO_LINK,  'Personalize sua pagina',   'Nome, textos, logo, cor e botões')}
          ${mkItem("configurarIr('link')", '#f0f9ff', `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`, 'Link publico', 'Compartilhar, copiar ou abrir seu link')}
          ${mkItem("configurarIr('ajuda')", '#eef2ff', ICO_HELP, 'Central de ajuda', 'Tutoriais e duvidas frequentes', false)}`;
      const itensAgendamento = `
          ${mkItem("configurarIr('servicos')",   '#eff6ff', ICO_BRIEF, 'Serviços oferecidos',      'Configure os serviços disponíveis')}
          ${mkItem("configurarIr('horarios')",   '#f0fdf4', ICO_CAL,   'Horários de agendamento',  'Defina dias e horários de agendamento')}
          ${mkItem("configurarIr('personalizar')","#fdf4ff", ICO_LINK,  'Personalize seu link',     'Nome, textos, logo, cor e botões')}
          ${mkItem("configurarIr('mensagens')",    '#fff7ed', ICO_MSG,   'Configurar mensagens',     'Personalize mensagens automáticas')}
          ${mkItem("configurarIr('cancelamento')","#fff1f2", `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`, 'Cancelamento', 'Prazo mínimo para cancelar agendamento')}
          ${mkItem("configurarIr('relatorios')", '#f0fdf4', G_ICO.relatorios, 'Relatórios', 'Financeiro e agendamentos por mês')}
          ${mkItem("configurarIr('link')", '#f0f9ff', `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`, 'Link público', 'Compartilhar, copiar ou abrir seu link')}
          ${mkItem("configurarIr('ajuda')", '#eef2ff', ICO_HELP, 'Central de ajuda', 'Tutoriais e duvidas frequentes', false)}`;
      return `
        <div style="font-size:22px;font-weight:700;color:#1a1a1a;margin-bottom:20px;padding:0 4px;">${emp.tipo === 'pagina' ? 'Minha Pagina' : 'Configurações'}</div>
        <div style="background:#fff;border-radius:22px;box-shadow:0 2px 16px rgba(0,0,0,0.06);overflow:hidden;">
          ${emp.tipo === 'pagina' ? itensPagina : itensAgendamento}
        </div>
        <div style="text-align:center;margin-top:40px;">
          <button onclick="${sairAction}" style="background:none;border:none;font-size:13px;font-weight:500;color:#8e8e93;cursor:pointer;padding:8px 16px;font-family:inherit;">Sair da conta</button>
        </div>
      `;
    }
    if(configurarSub === 'mensagens'){
      const msgConfirm   = emp.msgConfirmacao || 'Olá, {nome}!\nConfirme seu agendamento de {servico} para {data} às {hora}.\nAcesse o link abaixo, e confirme ou cancele:\n{link}';
      const msgLembrete  = emp.msgLembrete   || 'Olá, {nome}! \nPassando pra lembrar do seu agendamento! \n{servico}\n{data} - {hora}.\nAté lá!';
      const msgInativoTx = emp.msgInativo    || 'Olá, {nome}! \nFaz um tempinho desde o seu último atendimento.\nQue tal agendar um novo horário? Estamos à disposição.\nAgende pelo link:\n{link}';
      return `
        <div style="position:relative;display:flex;align-items:center;margin-bottom:16px;min-height:36px;">
          <button onclick="configurarIr(null)" style="background:none;border:none;font-size:14px;font-weight:600;color:#555;cursor:pointer;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;">&#8249; Voltar</button>
          <div style="position:absolute;left:0;right:0;text-align:center;font-weight:700;font-size:16px;pointer-events:none;">Configurar mensagens</div>
          <div></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div style="background:#fff;border:0.5px solid #e4e4e7;border-radius:12px;padding:14px;box-shadow:0 1px 6px rgba(0,0,0,0.07);">
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">Mensagem de confirmacao</div>
            <div style="font-size:12px;color:#8e8e93;margin-bottom:10px;">Enviada ao clicar em "Confirmação" no agendamento.</div>
            <textarea id="msgConfirmacao" rows="5" style="width:100%;font-family:inherit;font-size:13px;border:0.5px solid #d1d5db;border-radius:8px;padding:10px 12px;resize:none;line-height:1.5;color:#1a1a1a;background:#f9f9f7;">${escapeHtml(msgConfirm)}</textarea>
            <div style="font-size:11px;color:#8e8e93;margin-top:6px;">Variaveis: {nome} {hora} {servico} {data} {link}</div>
          </div>
          <div style="background:#fff;border:0.5px solid #e4e4e7;border-radius:12px;padding:14px;box-shadow:0 1px 6px rgba(0,0,0,0.07);">
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">Mensagem de lembrete</div>
            <div style="font-size:12px;color:#8e8e93;margin-bottom:10px;">Enviada ao clicar em "Lembrete" no agendamento.</div>
            <textarea id="msgLembrete" rows="5" style="width:100%;font-family:inherit;font-size:13px;border:0.5px solid #d1d5db;border-radius:8px;padding:10px 12px;resize:none;line-height:1.5;color:#1a1a1a;background:#f9f9f7;">${escapeHtml(msgLembrete)}</textarea>
            <div style="font-size:11px;color:#8e8e93;margin-top:6px;">Variaveis: {nome} {hora} {servico} {data}</div>
          </div>
          <div style="background:#fff;border:0.5px solid #e4e4e7;border-radius:12px;padding:14px;box-shadow:0 1px 6px rgba(0,0,0,0.07);">
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:3px;">Mensagem de cliente ausente</div>
            <div style="font-size:12px;color:#8e8e93;margin-bottom:10px;">Enviada ao clicar em "Ausente" na aba Clientes ausentes.</div>
            <textarea id="msgInativo" rows="6" style="width:100%;font-family:inherit;font-size:13px;border:0.5px solid #d1d5db;border-radius:8px;padding:10px 12px;resize:none;line-height:1.5;color:#1a1a1a;background:#f9f9f7;">${escapeHtml(msgInativoTx)}</textarea>
            <div style="font-size:11px;color:#8e8e93;margin-top:6px;">Variaveis: {nome} {link}</div>
          </div>
          <button class="btn" onclick="salvarMensagens('${emp.id}')">Salvar mensagens</button>
        </div>
      `;
    }

    if(configurarSub === 'link'){
      const url = `https://${emp.slug}.agenplus.com.br`;
      const mkLinkItem = (onclick, bg, stroke, icoPath, label, divider=true) => `
        <button onclick="${onclick}" style="display:flex;align-items:center;gap:14px;padding:0 20px;min-height:64px;background:#fff;border:none;text-align:left;cursor:pointer;width:100%;font-family:inherit;transition:background 150ms ease;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background='#fff'">
          <div style="width:34px;height:34px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${icoPath}</div>
          <div style="flex:1;font-size:16px;font-weight:600;color:#1a1a1a;">${label}</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        ${divider ? `<div style="height:1px;background:#f2f2f7;margin-left:68px;"></div>` : ''}`;
      return `
        <div style="position:relative;display:flex;align-items:center;margin-bottom:16px;min-height:36px;">
          <button onclick="configurarIr(null)" style="background:none;border:none;font-size:14px;font-weight:600;color:#555;cursor:pointer;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;">&#8249; Voltar</button>
          <div style="position:absolute;left:0;right:0;text-align:center;font-weight:700;font-size:16px;pointer-events:none;">Link público</div>
          <div></div>
        </div>
        <div style="background:#f7f7f7;border-radius:12px;padding:10px 16px;margin-bottom:14px;word-break:break-all;font-size:13px;color:#8e8e93;font-weight:500;">${url}</div>
        <div style="background:#fff;border-radius:22px;box-shadow:0 2px 16px rgba(0,0,0,0.06);overflow:hidden;">
          ${mkLinkItem(`linkAcao('abrir')`,         '#f0fdf4', '#16a34a', `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`, 'Abrir')}
          ${mkLinkItem(`linkAcao('copiar')`,        '#eff6ff', '#3b82f6', `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`, 'Copiar link')}
          ${mkLinkItem(`linkAcao('compartilhar')`,  '#f5f3ff', '#8b5cf6', `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`, 'Compartilhar', false)}
        </div>`;
    }
    if(configurarSub === 'relatorios'){
      return relatoriosBody();
    }
    if(configurarSub === 'cancelamento'){
      const horas = emp.cancelamentoHoras != null && emp.cancelamentoHoras !== '' ? emp.cancelamentoHoras : 2;
      return `
        <div style="position:relative;display:flex;align-items:center;margin-bottom:16px;min-height:36px;">
          <button onclick="configurarIr(null)" style="background:none;border:none;font-size:14px;font-weight:600;color:#555;cursor:pointer;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;">&#8249; Voltar</button>
          <div style="position:absolute;left:0;right:0;text-align:center;font-weight:700;font-size:16px;pointer-events:none;">Cancelamento</div>
          <div></div>
        </div>
        <div style="background:#fff;border:0.5px solid #e4e4e7;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,0.07);">
          <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:6px;">Prazo mínimo para cancelar</div>
          <div style="font-size:13px;color:#8e8e93;margin-bottom:14px;line-height:1.5;">Quantas horas antes do horário o cliente pode cancelar pelo link público. Use 0 para desativar o cancelamento pelo cliente.</div>
          <div class="field" style="margin:0;">
            <label>Horas de antecedência</label>
            <input id="cancelamentoHoras" type="number" min="0" max="168" step="1" value="${horas}" placeholder="0"
              style="width:100%;border:0.5px solid #d1d5db;border-radius:10px;padding:10px 12px;font-size:16px;font-family:inherit;color:#1a1a1a;"/>
          </div>
          <div style="font-size:12px;color:#8e8e93;margin-top:8px;line-height:1.6;">Exemplo: 0 = Você não aceita cancelamentos<br>Exemplo: 2 = O cliente pode cancelar até 2 horas antes</div>
        </div>
        <button class="btn" onclick="salvarCancelamentoHoras('${emp.id}')">Salvar</button>
      `;
    }

    if(configurarSub === 'servicos'){
      const ICO_EDIT = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
      const ICO_TRASH = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
      const bordBase = '0.5px solid #c8c8c8';
      const renderServico = (s, i) => {
        if(_editandoServicoIdx === i) return `
          <div style="background:#f8faff;border-bottom:${bordBase};padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
            <div class="field" style="margin:0;"><label>Nome do serviço</label><input id="svcNome_${i}" type="text" value="${escapeAttr(s.nome)}"/></div>
            <div class="field" style="margin:0;"><label>Preço (R$)</label><input id="svcPreco_${i}" type="number" min="0" step="1" value="${s.preco||0}"/></div>
            <div style="display:flex;gap:8px;">
              <button class="btn" style="flex:1;height:36px;" onclick="salvarEdicaoServico(${i})">Salvar</button>
              <button class="btn ghost" style="flex:1;height:36px;" onclick="cancelarEdicaoServico()">Cancelar</button>
            </div>
          </div>`;
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:${bordBase};">
            <div style="flex:1;min-width:0;">
              <div style="font-size:15px;font-weight:600;color:#1a1a1a;">${escapeHtml(s.nome)}</div>
              <div style="font-size:12px;color:#8e8e93;margin-top:2px;">R$ ${Number(s.preco||0).toLocaleString('pt-BR',{minimumFractionDigits:0})}</div>
            </div>
            ${_removendoServicoIdx===i
              ? `<button onclick="cancelarRemocaoServico()" style="background:none;border:none;color:#8e8e93;cursor:pointer;font-size:12px;font-weight:600;padding:0;min-height:0;font-family:inherit;">Cancelar</button>
                 <button onclick="removeServico(${i})" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:12px;font-weight:700;padding:0;min-height:0;font-family:inherit;">Remover</button>`
              : `<button onclick="editarServico(${i})" style="background:none;border:none;color:#8e8e93;cursor:pointer;padding:4px;min-height:0;" title="Editar">${ICO_EDIT}</button>
                 <button onclick="removeServico(${i})" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:4px;min-height:0;" title="Excluir">${ICO_TRASH}</button>`
            }
          </div>`;
      };
      const novoForm = _novoServicoForm ? `
        <div style="background:#f8faff;border:1.5px solid #c8c8c8;border-radius:12px;padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:8px;">
          <div class="field" style="margin:0;"><label>Nome do serviço</label><input id="novoServicoNome" type="text" placeholder="Ex: Corte feminino"/></div>
          <div class="field" style="margin:0;"><label>Preço (R$)</label><input id="novoServicoPreco" type="number" min="0" step="1" placeholder="0"/></div>
          <div style="display:flex;gap:8px;">
            <button class="btn" style="flex:1;height:36px;" onclick="adicionarServico()">Salvar</button>
            <button class="btn ghost" style="flex:1;height:36px;" onclick="cancelarNovoServico()">Cancelar</button>
          </div>
        </div>` : '';
      const lista = emp.servicos.length ? `
        <div style="background:#fff;border:1.5px solid #c8c8c8;border-radius:12px;overflow:hidden;margin-bottom:12px;">
          ${emp.servicos.map((s,i) => renderServico(s,i)).join('')}
          <div style="height:0;border-bottom:none;"></div>
        </div>` : `<p class="muted" style="margin-bottom:14px;">Nenhum serviço cadastrado ainda.</p>`;
      return `
        <div style="position:relative;display:flex;align-items:center;margin-bottom:16px;min-height:36px;">
          <button onclick="configurarIr(null)" style="background:none;border:none;font-size:14px;font-weight:600;color:#555;cursor:pointer;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;">&#8249; Voltar</button>
          <div style="position:absolute;left:0;right:0;text-align:center;font-weight:700;font-size:16px;pointer-events:none;">Serviços</div>
          <div></div>
        </div>
        ${!_novoServicoForm ? `<button onclick="abrirNovoServico()" style="display:flex;align-items:center;gap:8px;width:100%;background:#fff;border:1.5px solid #c8c8c8;border-radius:12px;padding:12px 14px;font-size:14px;font-weight:700;color:#1a1a1a;cursor:pointer;font-family:inherit;margin-bottom:12px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo serviço
        </button>` : ''}
        ${novoForm}
        ${lista}
      `;
    }

    if(configurarSub === 'horarios'){
      const DIAS_LONG = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
      const _hpm3 = emp.horariosPorMes || {};
      const diasTrabalho = ('_dias_' in _hpm3)
        ? (_hpm3['_dias_'] || []).map(Number)
        : [0,1,2,3,4,5,6];
      const cardDia = (i)=>{
        const ativo = diasTrabalho.includes(i);
        const slots = horariosParaDia(emp, i);
        const trackBg = ativo ? '#1c1917' : '#d1d5db';
        const knobLeft = ativo ? '20px' : '2px';
        return `
          <div style="background:var(--card);border:0.5px solid #e4e4e7;border-radius:14px;padding:16px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:15px;font-weight:700;color:#1a1a1a;">${DIAS_LONG[i]}</span>
              <div onclick="toggleDiaSemana(${i})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleDiaSemana(${i})}" style="position:relative;width:44px;height:26px;border-radius:13px;background:${trackBg};cursor:pointer;flex-shrink:0;transition:background .2s;">
                <div style="position:absolute;top:3px;left:${knobLeft};width:20px;height:20px;border-radius:50%;background:#fff;transition:left .2s;"></div>
              </div>
            </div>
            ${ativo ? `
              <div style="display:flex;flex-wrap:wrap;gap:7px;margin-top:14px;align-items:center;" id="slots-row-${i}">
                ${slots.map(h=>`
                  <div style="display:inline-flex;align-items:center;gap:6px;background:#f7f7f7;border:0.5px solid #e4e4e7;border-radius:8px;padding:7px 11px;">
                    <span style="font-size:14px;font-weight:600;color:#1a1a1a;">${h}</span>
                    <button onclick="removerHorario('${h}',${i})" style="background:none;border:none;color:#9ca3af;cursor:pointer;font-size:16px;line-height:1;padding:0;min-height:0;">&#215;</button>
                  </div>
                `).join('')}
                <button onclick="abrirInputHorario(${i})" id="btn-add-${i}" style="font-family:inherit;display:inline-flex;align-items:center;height:36px;padding:0 13px;border-radius:8px;border:0.5px dashed #c0c0c0;background:#fafafa;color:#888;font-size:13px;font-weight:600;cursor:pointer;">+ Adicionar</button>
                <div id="hi-row-${i}" style="display:none;align-items:center;gap:6px;">
                  <input type="text" id="hi-${i}" inputmode="numeric" placeholder="08:00" maxlength="5" oninput="mascaraHorario(this)" onkeydown="if(event.key==='Enter'){adicionarHorario(${i});}" style="width:80px;height:36px;border:0.5px solid #1c1917;border-radius:8px;padding:0 10px;font-size:14px;font-family:inherit;background:#fff;color:#1a1a1a;"/>
                  <button onclick="adicionarHorario(${i})" style="font-family:inherit;height:36px;padding:0 12px;border-radius:8px;border:0.5px solid #1c1917;background:#1c1917;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Salvar</button>
                  <button onclick="fecharInputHorario(${i})" style="font-family:inherit;height:36px;padding:0 10px;border-radius:8px;border:0.5px solid #e4e4e7;background:#fff;color:#9ca3af;font-size:13px;cursor:pointer;">&#215;</button>
                </div>
              </div>` : ''}
          </div>`;
      };
      return `
        <div style="position:relative;display:flex;align-items:center;margin-bottom:20px;min-height:36px;">
          <button onclick="configurarIr(null)" style="background:none;border:none;font-size:14px;font-weight:600;color:#555;cursor:pointer;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;">&#8249; Voltar</button>
          <div style="position:absolute;left:0;right:0;text-align:center;font-weight:700;font-size:16px;pointer-events:none;">Horários</div>
          <div></div>
        </div>
        <p class="muted" style="font-size:12px;margin-bottom:16px;">Ative os dias e adicione os horários disponíveis para cada um.</p>
        ${[0,1,2,3,4,5,6].map(cardDia).join('')}
      `;
    }

    if(configurarSub === 'personalizar'){
      return `
        <div style="position:relative;display:flex;align-items:center;margin-bottom:16px;min-height:36px;">
          <button onclick="voltarDePersonalizar()" style="background:none;border:none;font-size:14px;font-weight:600;color:#555;cursor:pointer;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;">&#8249; Voltar</button>
          <div style="position:absolute;left:0;right:0;text-align:center;font-weight:700;font-size:16px;pointer-events:none;">Personalize seu link</div>
          <div></div>
        </div>
        ${personalizarBody()}
      `;
    }

    if(configurarSub === 'ajuda'){
      const ajudaItem = (q, a, last=false) => `
        <details style="border-bottom:${last?'none':'1px solid #f2f2f7'};">
          <summary style="display:flex;align-items:center;justify-content:space-between;padding:15px 20px;font-size:15px;font-weight:600;color:#1a1a1a;cursor:pointer;list-style:none;-webkit-appearance:none;gap:12px;">
            <span>${q}</span>
            <svg style="flex-shrink:0;transition:transform 0.2s;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </summary>
          <div style="padding:0 20px 16px;font-size:14px;color:#4a4a4a;line-height:1.65;border-top:1px solid #f2f2f7;">${a}</div>
        </details>`;
      const ajudaCat = (titulo, itens) => `
        <div style="margin-bottom:20px;">
          <div style="font-size:12px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px;padding:0 4px;">${titulo}</div>
          <div style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);overflow:hidden;">${itens}</div>
        </div>`;
      return `
        <style>details[open] summary svg{transform:rotate(180deg);}</style>
        <div style="position:relative;display:flex;align-items:center;margin-bottom:20px;min-height:36px;">
          <button onclick="configurarIr(null)" style="background:none;border:none;font-size:14px;font-weight:600;color:#555;cursor:pointer;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;">&#8249; Voltar</button>
          <div style="position:absolute;left:0;right:0;text-align:center;font-weight:700;font-size:16px;pointer-events:none;">Central de Ajuda</div>
          <div></div>
        </div>
        ${ajudaCat('Primeiros passos',
          ajudaItem('Como funciona a agen+?',
            'A agen+ cria uma página de agendamento com o seu nome e link exclusivo. Seus clientes acessam esse link, escolhem o serviço, o dia e o horário — e o agendamento aparece automaticamente no seu painel. Sem precisar de app ou mensagem no WhatsApp.')
          + ajudaItem('Como configurar minha página pela primeira vez?',
            'Vá em <b>Configurar → Serviços oferecidos</b> e adicione os serviços com nome e duração. Depois vá em <b>Horários de agendamento</b> e marque os dias e horários que você atende. Por último, vá em <b>Personalize sua página</b> para colocar seu nome, logo e cor.')
          + ajudaItem('Como meu cliente agenda?',
            'Compartilhe seu link (ex: seuNome.agenplus.com.br). O cliente abre o link, escolhe o serviço, escolhe o dia e horário disponível, informa o nome e telefone, e confirma. O agendamento aparece no seu painel automaticamente.', true)
        )}
        ${ajudaCat('Meu link',
          ajudaItem('Como encontrar meu link de agendamento?',
            'Vá em <b>Configurar → Link público</b>. Lá aparece seu link completo. Você pode copiar ou abrir diretamente.')
          + ajudaItem('Como compartilhar o link?',
            'Vá em <b>Configurar → Link público</b> e toque em <b>Compartilhar link</b>. Você pode mandar pelo WhatsApp, Instagram ou qualquer outro app. Também dá para colocar na bio do Instagram.')
          + ajudaItem('Como personalizar a aparência da minha página?',
            'Vá em <b>Configurar → Personalize sua página</b>. Lá você pode alterar: nome exibido, descrição, logo, foto de capa, cor de destaque e os textos dos botões da sua página.', true)
        )}
        ${ajudaCat('Agenda',
          ajudaItem('Como ver os agendamentos do dia?',
            'Abra a aba <b>Agenda</b> na barra inferior. Ela mostra todos os agendamentos do dia atual. Deslize para os lados para navegar entre os dias.')
          + ajudaItem('Como bloquear um horário?',
            'Na aba <b>Agenda</b>, toque no horário que deseja bloquear e selecione <b>Bloquear horário</b>. O horário ficará indisponível para novos agendamentos.')
          + ajudaItem('Como cancelar um agendamento?',
            'Na aba <b>Agenda</b>, toque no agendamento e selecione <b>Cancelar</b>. O horário volta a ficar disponível.')
          + ajudaItem('Como marcar um agendamento como atendido?',
            'Na aba <b>Agenda</b>, toque no agendamento e selecione <b>Marcar como atendido</b>. Isso registra o atendimento e, se você quiser, já lança o valor no financeiro.', true)
        )}
        ${ajudaCat('Clientes',
          ajudaItem('Como cadastrar um cliente manualmente?',
            'Vá na aba <b>Clientes</b> e toque no botão <b>+ Novo</b> no canto superior direito. Preencha o nome e telefone e salve.')
          + ajudaItem('O que é a aba Ausentes?',
            'A aba <b>Ausentes</b> mostra clientes que não agendam há mais de 30 dias. Você pode tocar em um cliente e enviar uma mensagem personalizada pelo WhatsApp para trazê-los de volta.')
          + ajudaItem('Como enviar lembrete de agendamento pelo WhatsApp?',
            'Na aba <b>Agenda</b>, abra um agendamento e toque em <b>Lembrete</b>. O app vai abrir o WhatsApp já com a mensagem preenchida para você enviar ao cliente.', true)
        )}
        ${ajudaCat('Financeiro',
          ajudaItem('Como registrar uma entrada ou saída?',
            'Vá na aba <b>Financeiro</b> e toque em <b>+ Lançamento</b>. Informe se é uma entrada ou saída, o valor, a descrição e a data. O lançamento aparece no resumo do mês.')
          + ajudaItem('Como ver o faturamento do mês?',
            'Na aba <b>Financeiro</b>, o resumo do mês aparece no topo com o total de entradas, saídas e saldo. Deslize para ver meses anteriores.', true)
        )}
        ${ajudaCat('Configurações',
          ajudaItem('Como adicionar ou editar um serviço?',
            'Vá em <b>Configurar → Serviços oferecidos</b>. Toque em <b>+ Adicionar serviço</b> para criar um novo, ou toque em um serviço existente para editar o nome, duração e descrição.')
          + ajudaItem('Como configurar os dias e horários de atendimento?',
            'Vá em <b>Configurar → Horários de agendamento</b>. Ative os dias da semana que você trabalha e defina os horários de início e fim para cada dia.')
          + ajudaItem('Como trocar o nome do meu link (endereço)?',
            'Vá em <b>Configurar → Personalize sua página</b> e altere o campo <b>Nome do link</b>. O link novo será seuNovoNome.agenplus.com.br.')
          + ajudaItem('Como trocar a logo e a cor da página?',
            'Vá em <b>Configurar → Personalize sua página</b>. Toque na logo para substituir a imagem e use o seletor de cor para escolher a cor de destaque da sua página.', true)
        )}
        <div style="text-align:center;padding:8px 0 4px;">
          <p style="font-size:13px;color:#8e8e93;">Não encontrou o que procurava?</p>
          <a href="mailto:suporte@agenplus.com.br" style="display:inline-block;margin-top:8px;font-size:14px;font-weight:600;color:#6366f1;text-decoration:none;">Falar com o suporte</a>
        </div>
      `;
    }

    return '';
  }

  function hexToHsl(hex){
    let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    let h=0,s=0,l=(max+min)/2;
    if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}
    return [Math.round(h*360),Math.round(s*100),Math.round(l*100)];
  }
  function hslToHex(h,s,l){
    s/=100;l/=100;const a=s*Math.min(l,1-l);
    const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,'0');};
    return '#'+f(0)+f(8)+f(4);
  }

  function hexToHsv(hex){
    let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=0,s=max===0?0:d/max,v=max;
    if(d!==0){switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}
    return [Math.round(h*360),Math.round(s*100),Math.round(v*100)];
  }
  function hsvToHex(h,s,v){
    s/=100;v/=100;const i=Math.floor(h/60)%6,f=(h/60)-Math.floor(h/60),p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
    let r,g,b;
    switch(i){case 0:r=v;g=t;b=p;break;case 1:r=q;g=v;b=p;break;case 2:r=p;g=v;b=t;break;case 3:r=p;g=q;b=v;break;case 4:r=t;g=p;b=v;break;default:r=v;g=p;b=q;}
    return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
  }

  function personalizarBody(){
    const cor = emp.corPrincipal || '#3d1f3a';
    const botoesSorted = [...(emp.botoes || [])].sort((a,b) => a.ordem - b.ordem);

    const botoesHtml = botoesSorted.length ? `<div id="botoes-drag-list">${botoesSorted.map((b) => `
      <div data-id="${b.id}" draggable="true"
        style="display:flex;flex-direction:column;gap:10px;padding:14px 16px;margin-bottom:8px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);cursor:default;transition:opacity .15s;overflow:hidden;"
        ondragstart="dragBotaoStart(event,'${b.id}')"
        ondragover="dragBotaoOver(event)"
        ondrop="dragBotaoDrop(event,'${b.id}')"
        ondragend="dragBotaoEnd(event)">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          <div style="color:#bbb;font-size:14px;cursor:grab;padding:0 4px;line-height:1;touch-action:none;flex-shrink:0;letter-spacing:1px;" title="Arraste para reordenar">::</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:14px;">${escapeHtml(b.nome)}</div>
            <div class="muted" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(b.link)}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button class="btn ghost" style="font-size:13px;" onclick="editarBotao('${b.id}')">Editar</button>
          <button class="btn ghost" style="font-size:13px;color:var(--danger);border-color:var(--danger);" onclick="removerBotao('${b.id}')">Excluir</button>
        </div>
      </div>
    `).join('')}</div>` : `<p class="muted" style="text-align:center;padding:16px 0;">Nenhum botão cadastrado ainda.</p>`;

    const BINFO = {
      whatsapp:     { label:'Número',  desc:'Digite o número com DDD', ph:'(xx) xxxxx-xxxx' },
      instagram:    { label:'Link',    desc:'Cole aqui o link do seu Instagram', ph:'https://instagram.com/seuusuario' },
      maps:         { label:'Link',    desc:'Pesquise seu endereço no Google Maps e cole o link aqui', ph:'https://maps.app.goo.gl/...' },
      site:         { label:'Link',    desc:'Cole o link do seu site, caso tenha', ph:'https://seusite.com.br' },
      personalizado:{ label:'Link',    desc:'Cole o link do botão', ph:'https://...' },
    };
    const mkBotaoModal = (titulo, tipoSel, valorLink, tipoIdEl, linkIdEl, hintIdEl, onCancelar, onSalvar, salvarLabel, valorNome='', valorCor='') => {
      const bi = BINFO[tipoSel] || BINFO.whatsapp;
      const isWa = tipoSel === 'whatsapp';
      const isCustom = tipoSel === 'personalizado';
      const isPagina = emp.tipo === 'pagina';
      return `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center;" onclick="if(event.target===this){${onCancelar}}">
        <div style="background:#fff;border-radius:18px 18px 0 0;padding:28px 24px 40px;width:100%;max-width:520px;">
          <h3 style="font-family:inherit;font-weight:700;font-size:18px;margin:0 0 20px;">${titulo}</h3>
          <div class="field"><label>Tipo</label>
            <select id="${tipoIdEl}" onchange="atualizarCampoBotao('${tipoIdEl}','${linkIdEl}','${hintIdEl}','${tipoIdEl}LabelEl','${tipoIdEl}DescEl')">
              <option value="whatsapp" ${tipoSel==='whatsapp'?'selected':''}>WhatsApp</option>
              <option value="instagram" ${tipoSel==='instagram'?'selected':''}>Instagram</option>
              <option value="maps" ${tipoSel==='maps'?'selected':''}>Google Maps</option>
              <option value="site" ${tipoSel==='site'?'selected':''}>Site</option>
              <option value="personalizado" ${isCustom?'selected':''}>Personalizado</option>
            </select>
          </div>
          <div class="field" id="${tipoIdEl}NomeWrap" style="display:${isCustom?'block':'none'};">
            <label>Nome do botao</label>
            <input id="${tipoIdEl}NomeEl" value="${escapeAttr(valorNome)}" placeholder="Ex: Cardapio, TikTok, Portfólio..." maxlength="50"/>
          </div>
          <div class="field">
            <label id="${tipoIdEl}LabelEl">${bi.label}</label>
            <div id="${tipoIdEl}DescEl" style="font-size:12px;color:#8e8e93;margin-bottom:8px;">${bi.desc}</div>
            <input id="${linkIdEl}" value="${escapeAttr(valorLink)}" placeholder="${bi.ph}" ${isWa?'type="tel" inputmode="numeric" maxlength="16" oninput="maskTel(this)"':'type="text" maxlength="500"'}/>
            <div id="${hintIdEl}" style="font-size:12px;color:var(--danger);margin-top:6px;display:none;">Número inválido. Ex: (11) 98765-4321</div>
          </div>
          ${isPagina ? `<div class="field" style="margin-top:4px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <label style="margin-bottom:0;">Cor do botão</label>
              <button type="button" onclick="document.getElementById('${tipoIdEl}CorEl').value='';document.getElementById('${tipoIdEl}CorEl').dataset.sem='1';this.style.display='none';" style="font-family:inherit;font-size:11px;color:#8e8e93;background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;">Remover cor</button>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="color" id="${tipoIdEl}CorEl" value="${valorCor||'#3d1f3a'}" oninput="this.dataset.sem=''" style="width:44px;height:44px;border:0.5px solid #e4e4e7;border-radius:10px;padding:2px;cursor:pointer;background:none;"/>
              <span style="font-size:13px;color:#8e8e93;">Escolha a cor do fundo do botão</span>
            </div>
          </div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
            <button class="btn ghost" onclick="${onCancelar}">Cancelar</button>
            <button class="btn" onclick="${onSalvar}">${salvarLabel}</button>
          </div>
        </div>
      </div>`;
    };
    const formNovoBotao = novoBotaoState !== null
      ? mkBotaoModal('Novo botão', 'whatsapp', '', 'bTipo', 'bLink', 'bLinkHint', 'cancelarNovoBotao()', 'salvarNovoBotao()', 'Adicionar')
      : editandoBotaoId !== null ? (()=>{ const eb = emp.botoes.find(x=>x.id===editandoBotaoId)||{tipo:'whatsapp'};
          return mkBotaoModal('Editar botão', eb.tipo||'whatsapp', eb.tipo==='whatsapp'?fmtTelStr(eb.link):eb.link||'', 'ebTipo', 'ebLink', 'ebLinkHint', 'cancelarEdicaoBotao()', `salvarEdicaoBotao('${editandoBotaoId}')`, 'Salvar', eb.tipo==='personalizado'?eb.nome:'', eb.cor||'');
        })()
      : `<button onclick="iniciarNovoBotao()" style="width:100%;margin-top:14px;padding:14px;border:2px dashed #bbb;border-radius:12px;background:none;font-size:14px;font-weight:600;color:#888;cursor:pointer;letter-spacing:.01em;">+ Adicionar botão</button>`;

    const hsv = hexToHsv(cor);
    _rodaH = hsv[0]; _rodaS = hsv[1]; _rodaV = hsv[2];
    const brilhoGrad = 'linear-gradient(to right,#000,'+hsvToHex(_rodaH,_rodaS,100)+')';
    const corSliderHtml = '<div style="background:#fff;border:0.5px solid #e4e4e7;border-radius:14px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,0.07);">'
      + '<div role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();toggleCorPicker()}" style="display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="toggleCorPicker()">'
      + '<div id="pCorPreview" style="width:44px;height:44px;border-radius:12px;background:'+cor+';flex-shrink:0;border:0.5px solid rgba(0,0,0,0.1);"></div>'
      + '<div style="flex:1;"><div style="font-size:15px;font-weight:600;color:#1a1a1a;" id="pCorHex">'+cor+'</div>'
      + '<div style="font-size:12px;color:#8e8e93;margin-top:2px;">Toque para alterar a cor</div></div>'
      + '<div id="pCorChevron" style="font-size:18px;color:#8e8e93;transition:transform .2s;">&#8964;</div>'
      + '</div>'
      + '<div id="pCorSliders" style="display:none;margin-top:16px;">'
      + '<div style="display:flex;justify-content:center;"><canvas id="rodaCores" width="220" height="220" style="border-radius:50%;cursor:crosshair;touch-action:none;display:block;"></canvas></div>'
      + '<div style="margin-top:16px;"><div style="font-size:12px;font-weight:600;color:#8e8e93;margin-bottom:8px;">Brilho</div>'
      + '<input type="range" class="cor-slider" id="pCorBrilho" min="0" max="100" value="'+_rodaV+'" style="background:'+brilhoGrad+';" oninput="rodaBrilhoChange()"/></div>'
      + '</div>'
      + '<input type="hidden" id="pCor" value="'+escapeAttr(cor)+'"/>'
      + '</div>';

    const slugHtml = '<div class="field">'
      + '<label>Link público</label>'
      + '<div style="display:flex;align-items:center;gap:6px;">'
      + '<span style="font-size:13px;color:#8e8e93;white-space:nowrap;flex-shrink:0;">https://</span>'
      + '<input id="pSlug" value="'+escapeAttr(emp.slug)+'" placeholder="seu-link" style="flex:1;min-width:0;" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9-]/g,\'\')"/>'
      + '<span style="font-size:13px;color:#8e8e93;white-space:nowrap;flex-shrink:0;">.agenplus.com.br</span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">'
      + '<div style="font-size:12px;color:#8e8e93;">Alterar quebra o endereço antigo.</div>'
      + '<button onclick="salvarSlugEmpresa()" style="font-family:inherit;font-size:12px;font-weight:700;color:#1a1a1a;background:#f4f4f5;border:none;border-radius:7px;padding:4px 10px;cursor:pointer;">Salvar link</button>'
      + '</div></div>';

    return `
      <div class="field"><label>Nome da empresa</label><input id="pNome" value="${escapeAttr(emp.nome)}" oninput="marcarPersonalizarDirty()"/></div>
      ${slugHtml}
      <div class="field"><label>Descrição curta</label><textarea id="pDescricao" maxlength="300" rows="2" style="resize:vertical;min-height:80px;" oninput="marcarPersonalizarDirty()">${escapeHtml(emp.descricao||'')}</textarea></div>
      <div class="field"><label>Texto de destaque</label><input id="pTextoDestaque" value="${escapeAttr(emp.textoDestaque||'')}" placeholder="Ex: Agende seu horário" oninput="marcarPersonalizarDirty()"/></div>
      ${emp.tipo !== 'pagina' ? `<div class="field"><label>Texto do botao de agendamento</label><input id="pTextoAgendar" value="${escapeAttr(emp.textoAgendar||'')}" placeholder="Agendar horário" oninput="marcarPersonalizarDirty()"/></div>` : '<input type="hidden" id="pTextoAgendar" value=""/>'}
      <div class="field">
        <label>Logo</label>
        ${emp.logo ? `<img src="${escapeAttr(emp.logo)}" alt="Logo de ${escapeAttr(emp.nome)}" style="width:90px;height:90px;object-fit:cover;border-radius:50%;display:block;margin-bottom:10px;border:2px solid var(--line);"/>` : `<div style="width:90px;height:90px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;margin-bottom:10px;color:#999999;font-size:13px;text-align:center;">Sem logo</div>`}
        <button class="btn ghost" style="width:100%;" onclick="selecionarImagem('logo')">Enviar logo</button>
      </div>
      <div class="field">
        <label>Imagem de fundo</label>
        ${emp.fotoUrl ? `<img src="${escapeAttr(emp.fotoUrl)}" alt="Imagem de fundo" style="width:100%;height:110px;object-fit:cover;border-radius:10px;display:block;margin-bottom:10px;border:1.5px solid var(--line);"/>` : `<div style="width:100%;height:110px;border-radius:10px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;margin-bottom:10px;color:#999999;font-size:13px;">Sem imagem de fundo</div>`}
        <button class="btn ghost" style="width:100%;" onclick="selecionarImagem('background')">Enviar imagem de fundo</button>
      </div>
      <div class="field">
        <label>Cor principal</label>
        ${corSliderHtml}
      </div>

      <div class="eyebrow" style="margin-top:36px;margin-bottom:4px;color:#1a1a1a;">Botões da página</div>
      <p class="muted" style="font-size:13px;margin:0 0 16px;">Aparecem na página pública abaixo do botão de agendamento.</p>
      ${botoesHtml}
      ${formNovoBotao}

      <div id="pers-save-wrap" style="margin-top:32px;border-top:1px solid var(--line);padding-top:24px;${personalizarDirty?'display:none':''}">
        <button class="btn" style="width:100%;" onclick="salvarInfoEmpresa()">Salvar</button>
      </div>
      <div id="pers-dirty-banner" style="background:#fef9e7;border:1.5px solid #f5c518;border-radius:12px;padding:14px 16px;margin-top:24px;${personalizarDirty?'':'display:none'}">
        <div style="font-size:14px;font-weight:600;color:#7a6400;margin-bottom:10px;">Você tem alterações não salvas</div>
        <div style="display:flex;gap:8px;">
          <button class="btn ghost" style="flex:1;font-size:13px;color:#7a6400;border-color:#f5c518;" onclick="descartarPersonalizar()">Descartar</button>
          <button class="btn" style="flex:1;font-size:13px;" onclick="salvarInfoEmpresa()">Salvar agora</button>
        </div>
      </div>
    `;
  }

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

    .g-topbar { height:52px; display:flex; align-items:center; justify-content:space-between; padding:0 20px; background:#fff; box-shadow:0 4px 16px rgba(0,0,0,0.10); color:#1a1a1a; }
    .g-topbar .brand { font-family:'Nunito',sans-serif; font-weight:800; font-size:18px; }

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
    .ag-btn-edit  { background:#fff; border:1px solid #d1d5db; color:#374151; }
    .ag-btn-edit:hover { background:#f9fafb; }
    .ag-btn-cancel { background:#fff; border:1px solid #fca5a5; color:#dc2626; }
    .ag-btn-cancel:hover { background:#fef2f2; }
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

  if(!document.getElementById('gestao-css')){ const _gs=document.createElement('div'); _gs.innerHTML=GESTAO_CSS; const _el=_gs.firstElementChild; _el.id='gestao-css'; document.head.appendChild(_el); }

  const NOTA_CORES = { amarelo:'#fef9c3', azul:'#dbeafe', rosa:'#fce7f3', verde:'#dcfce7' };

  function diasSemVoltarDash(c) {
    const cAgs = agendamentos.filter(a => a.slug===emp.slug
      && (a.clienteId ? a.clienteId===c.id : a.telefone===c.telefone)
      && a.status !== 'cancelado');
    if(!cAgs.length) return null;
    const ultima = cAgs.map(a=>a.data).sort().pop();
    return Math.floor((new Date() - new Date(ultima+'T00:00:00')) / 86400000);
  }

  function dashboardBody(){
    const agora    = new Date();
    const hoje     = isoData(agora);
    const mesStr   = hoje.slice(0,7);
    const horaAgora= agora.getHours().toString().padStart(2,'0')+':'+agora.getMinutes().toString().padStart(2,'0');
    const ags     = agendamentos.filter(a => a.slug === emp.slug);
    const agsHoje = ags.filter(a => a.data === hoje).sort((a,b)=>a.hora.localeCompare(b.hora));

    // Próximo atendimento (qualquer dia futuro)
    const agsFuturos = ags.filter(a => a.status !== 'cancelado' && (a.data > hoje || (a.data === hoje && a.hora >= horaAgora)))
                         .sort((a,b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));
    const prox = agsFuturos[0] || null;
    let proxVal = '--:--';
    if (prox) {
      const proxDt = new Date(prox.data + 'T' + prox.hora + ':00');
      const diffMs = proxDt - agora;
      if (diffMs > 0) {
        const diffMin = Math.floor(diffMs / 60000);
        const dias = Math.floor(diffMin / 1440);
        const horas = Math.floor((diffMin % 1440) / 60);
        const mins = diffMin % 60;
        if (dias > 0) proxVal = 'em ' + dias + 'd e ' + horas + 'h';
        else if (horas > 0) proxVal = 'em ' + horas + 'h ' + mins + 'min';
        else proxVal = 'em ' + mins + 'min';
      }
    }

    // Clientes inativos — usa a tabela de clientes cadastrados, igual à aba Clientes
    const inativosAtual = _clientes.filter(c => { const d=diasSemVoltarDash(c); return d!==null && d>=15; }).length;

    // Faturamento de hoje
    const fatHoje = _gFinLancamentos.filter(l=>l.tipo==='receita' && l.data===hoje)
                                    .reduce((s,l)=>s+parseFloat(l.valor||0),0);

    const fatMes = _gFinLancamentos.filter(l=>l.tipo==='receita' && l.data.startsWith(mesStr))
                                   .reduce((s,l)=>s+parseFloat(l.valor||0),0);

    // Clientes já atendidos no mês
    const atendidosMes = ags.filter(a => a.status !== 'cancelado' && a.data.startsWith(mesStr)
      && (a.data < hoje || (a.data === hoje && a.hora < horaAgora))).length;

    const saudacao = agora.getHours() < 12 ? 'Bom dia' : agora.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
    const dataFmt  = agora.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})
                          .replace(/^./, c=>c.toUpperCase());

    const ICO_CAL2 = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    const ICO_CLK  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`;
    const ICO_CASH = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/></svg>`;
    const ICO_USRS = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;

    const card = (area, icoBg, ico, label, val) => `
      <div class="g-dash-card" style="grid-area:${area};">
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="g-dash-ico" style="background:${icoBg};">${ico}</div>
          <div class="g-dash-label">${label}</div>
        </div>
        <div class="g-dash-val">${val}</div>
      </div>`;

    // Agenda de hoje (metade da largura) — sem cancelados
    const agsHojeAtivos = agsHoje.filter(a => a.status !== 'cancelado');
    const agendaRows = agsHojeAtivos.length
      ? agsHojeAtivos.map(a=>{
          const passou = a.hora < horaAgora;
          return `<div class="g-ag-row" style="${passou?'opacity:0.3;':''}">
            <div style="display:flex;align-items:baseline;gap:7px;">
              <span class="g-ag-hora">${a.hora.slice(0,5)}</span>
              <span class="g-ag-nome">${escapeHtml(a.nome)}</span>
            </div>
            <div class="g-ag-serv">${escapeHtml(a.servicoNome||'')}</div>
          </div>`;
        }).join('')
      : `<div style="font-size:12px;color:#8e8e93;padding:10px 0;">Nenhum agendamento hoje.</div>`;

    // Bloco de notas
    const notasHtml = _notas.length
      ? _notas.map(n=>`
          <div class="g-nota" style="background:${NOTA_CORES[n.cor]||NOTA_CORES.amarelo};">
            <span class="g-nota-txt">${escapeHtml(n.texto)}</span>
            <button class="g-nota-x" onclick="removerNota('${n.id}')" title="Excluir">&times;</button>
          </div>`).join('')
      : `<div style="font-size:12px;color:#8e8e93;padding:6px 0;">Nenhuma anotação ainda.</div>`;

    // Modal de nova nota
    const notaModalHtml = (()=>{
      if(!_notaModal) return '';
      const m = _notaModal;
      const swatches = Object.entries(NOTA_CORES).map(([k,hex])=>`
        <div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setNotaCor('${k}')}" onclick="setNotaCor('${k}')" style="width:30px;height:30px;border-radius:8px;background:${hex};cursor:pointer;border:2px solid ${m.cor===k?'#1a1a1a':'transparent'};"></div>`).join('');
      return `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;" onclick="if(event.target===this) fecharNota()">
          <div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:400px;box-shadow:0 8px 32px rgba(0,0,0,0.18);">
            <div style="font-weight:700;font-size:16px;margin-bottom:14px;">${m.editId?'Editar anotação':'Nova anotação'}</div>
            <div class="field">
              <label>Anotação</label>
              <textarea id="notaTexto" maxlength="500" rows="4" style="resize:vertical;min-height:90px;" placeholder="Escreva sua anotação">${escapeHtml(m.texto||'')}</textarea>
            </div>
            <div class="field">
              <label>Cor</label>
              <div style="display:flex;gap:8px;margin-top:4px;">${swatches}</div>
            </div>
            <div class="row" style="margin-top:16px;">
              <button class="btn ghost" onclick="fecharNota()">Cancelar</button>
              <button class="btn" onclick="salvarNota()">Salvar</button>
            </div>
          </div>
        </div>`;
    })();

    return `
      <div class="g-dash-root">
        <div>
          <div style="font-size:19px;font-weight:800;color:#1a1a1a;letter-spacing:-.02em;">${saudacao}, ${escapeHtml(emp.nome)}</div>
          <div style="font-size:12px;color:#8e8e93;margin-top:2px;">${dataFmt}</div>
        </div>

        <div class="g-dash-grid">
          ${card('prox',  '#fff7ed', ICO_CLK,  'Próximo<br>atendimento', proxVal)}
          <div class="g-dash-card" style="grid-area:agend;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <div class="g-dash-ico" style="background:#fef3c7;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="11"/></svg></div>
              <div class="g-dash-label">Clientes inativos</div>
            </div>
            <div class="g-dash-val">${inativosAtual}</div>
          </div>

          <div class="g-dash-panel g-dash-agenda">
            <div class="g-dash-ttl" style="margin-bottom:5px;">Agenda de hoje</div>
            <div class="g-dash-agenda-list">${agendaRows}</div>
            <button onclick="setCorner(null)" style="margin-top:7px;padding:7px 0 0;border:none;border-top:0.5px solid #f4f4f5;background:none;font-family:inherit;font-size:11px;color:#8e8e93;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:3px;width:100%;flex-shrink:0;">Ver completa &#8250;</button>
          </div>

          ${card('fat', '#f0fdf4', ICO_CASH, 'Faturamento<br>hoje', gFinFmtMoeda(fatHoje))}
          ${card('cli', '#faf5ff', ICO_USRS, 'Clientes atendidos<br>este mês', atendidosMes)}
          ${card('fatmes', '#ecfdf5', ICO_CASH, 'Faturamento<br>este mês', gFinFmtMoeda(fatMes))}

          <div class="g-dash-panel g-dash-notas">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;flex-shrink:0;">
              <div class="g-dash-ttl">Bloco de notas</div>
              <button onclick="novaNota()" style="background:none;border:none;font-family:inherit;font-size:11px;color:#3b82f6;font-weight:700;cursor:pointer;padding:0;">+ Nova</button>
            </div>
            <div class="g-dash-notas-list">${notasHtml}</div>
          </div>
        </div>
      </div>

      ${notaModalHtml}
    `;
  }

  // ── Financeiro (gestão) ──

  async function gFinCarregar(){
    if(_gFinCarregando) return;
    _gFinCarregando = true;
    const { data, error } = await supabaseClient
      .from('lancamentos_financeiros')
      .select('*')
      .eq('empresa_id', emp.id)
      .order('data', { ascending: false })
      .order('criado_em', { ascending: false });
    _gFinCarregando = false;
    if(!error && data){
      _gFinLancamentos = data;
      _gFinAgLancados = new Set(data.filter(l=>l.agendamento_id).map(l=>l.agendamento_id));
    }
    if(corner === 'financeiro' || corner === 'dashboard') draw();
  }

  // ── Bloco de notas (dashboard) ──

  async function carregarNotas(){
    if(_notasCarregando) return;
    _notasCarregando = true;
    const { data, error } = await supabaseClient
      .from('notas')
      .select('*')
      .eq('empresa_id', emp.id)
      .order('criado_em', { ascending: false });
    _notasCarregando = false;
    if(!error && data) _notas = data;
    if(corner === 'dashboard') draw();
  }

  window.novaNota   = ()=>{ _notaModal = { texto:'', cor:'amarelo' }; draw(); };
  window.fecharNota = ()=>{ _notaModal = null; draw(); };
  window.setNotaCor = (cor)=>{
    if(!_notaModal) return;
    const el = document.getElementById('notaTexto');
    if(el) _notaModal.texto = el.value;
    _notaModal.cor = cor;
    draw();
  };

  window.salvarNota = async ()=>{
    if(!_notaModal) return;
    const texto = (document.getElementById('notaTexto')?.value || '').trim();
    if(!texto){ toast('Escreva alguma coisa na anotação.','err'); return; }
    const cor = _notaModal.cor || 'amarelo';
    _notaModal = null; draw();
    const { error } = await supabaseClient.from('notas')
      .insert({ empresa_id: emp.id, texto, cor });
    if(error){ toast(friendlyError(error,'Erro ao salvar anotação.'),'err'); return; }
    toast('Anotação salva!','ok');
    await carregarNotas();
  };

  window.removerNota = async (id)=>{
    const { error } = await supabaseClient.from('notas').delete().eq('id', id);
    if(error){ toast(friendlyError(error,'Erro ao excluir anotação.'),'err'); return; }
    _notas = _notas.filter(n=>n.id !== id);
    draw();
  };

  function gFinFmtMoeda(v){ return 'R$ ' + parseFloat(v||0).toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }

  function gFinDataLabel(){
    if(_gFinPeriodo==='dia'){
      const d = new Date(_gFinData+'T00:00:00');
      const hoje = isoData(new Date());
      if(_gFinData===hoje) return 'Hoje, '+d.toLocaleDateString('pt-BR',{day:'numeric',month:'short'}).replace('.','');
      const s = d.toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'');
      return s.charAt(0).toUpperCase()+s.slice(1);
    } else {
      const [y,m] = _gFinData.split('-');
      return new Date(parseInt(y),parseInt(m)-1,1).toLocaleString('pt-BR',{month:'long',year:'numeric'}).replace(' de ',' / ');
    }
  }

  function gFinNavegar(dir){
    if(_gFinPeriodo==='dia'){
      const d = new Date(_gFinData+'T00:00:00');
      d.setDate(d.getDate()+dir);
      _gFinData = isoData(d);
    } else {
      const [y,m] = _gFinData.split('-').map(Number);
      const d = new Date(y, m-1+dir, 1);
      _gFinData = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    }
    gFinCarregar();
  }
  window.gFinNavegar = gFinNavegar;

  window.gFinSetPeriodo = (p)=>{
    _gFinPeriodo = p;
    if(p==='dia') _gFinData = isoData(new Date());
    else _gFinData = isoData(new Date()).slice(0,7);
    gFinCarregar();
  };

  function gFinLancamentosFiltrados(){
    return _gFinLancamentos.filter(l=>{
      if(_gFinPeriodo==='dia') return l.data === _gFinData;
      return l.data.startsWith(_gFinData);
    });
  }

  function gFinPendentes(){
    const agora = new Date();
    const hoje = isoData(agora);
    const horaAgora = agora.getHours().toString().padStart(2,'0')+':'+agora.getMinutes().toString().padStart(2,'0');
    return agendamentos.filter(a=>{
      if(a.slug !== emp.slug) return false;
      if(a.status === 'cancelado') return false;
      if(_gFinAgLancados.has(a.id)) return false;
      if(a.data > hoje) return false;
      if(a.data === hoje) return a.hora.slice(0,5) <= horaAgora;
      return true;
    }).sort((a,b)=> (b.data+b.hora).localeCompare(a.data+a.hora));
  }

  function financeiroBody(){
    const todosPeriodo = gFinLancamentosFiltrados();
    const receita = todosPeriodo.filter(l=>l.tipo==='receita').reduce((s,l)=>s+parseFloat(l.valor||0),0);
    const despesa = todosPeriodo.filter(l=>l.tipo==='despesa').reduce((s,l)=>s+parseFloat(l.valor||0),0);
    const saldo   = receita - despesa;
    const pendentes = gFinPendentes();

    const lancamentos = todosPeriodo.filter(l=>{
      if(_gFinFiltro==='entradas') return l.tipo==='receita';
      if(_gFinFiltro==='saidas')   return l.tipo==='despesa';
      return true;
    });

    const ICO_DOWN =`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`;
    const ICO_LEFT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><polyline points="15 18 9 12 15 6"/></svg>`;
    const ICO_RIGHT= `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><polyline points="9 18 15 12 9 6"/></svg>`;
    const ICO_EDIT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const ICO_TRASH= `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

    const CS = 'font-family:Nunito,sans-serif;cursor:pointer;';

    const modalHtml = _gFinModal ? (()=>{
      const m = _gFinModal;
      const isEdit = !!m.editId;
      const titulo = isEdit ? 'Editar lançamento' : (m.tipo==='receita' ? 'Nova Receita' : 'Nova Despesa');
      const corBtn = m.tipo==='receita' ? '#2d6a47' : '#a3423a';
      const agModal = m.agId ? agendamentos.find(a=>a.id===m.agId) : null;
      const svcModal = agModal?.servicoNome || '';
      const svcHtml = svcModal ? `<div class="field"><label>Serviço</label><div style="padding:12px 14px;border-radius:10px;border:1.5px solid #e0e0e0;background:#f7f7f7;font-size:15px;color:#555;">${escapeHtml(svcModal)}</div></div>` : '';
      return `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center;" onclick="if(event.target===this)gFinFecharModal()">
        <div style="background:#fff;border-radius:18px 18px 0 0;padding:28px 24px 40px;width:100%;max-width:520px;">
          <h3 style="${CS}font-weight:700;font-size:18px;margin:0 0 20px;">${titulo}</h3>
          <div class="field"><label>Descrição</label><input id="gfin-desc" type="text" maxlength="200" value="${escapeHtml(m.descricao||'')}" placeholder="${m.tipo==='receita'?'Ex: Dinheiro em aberto':'Ex: Conta de energia'}"></div>
          ${svcHtml}
          <div class="field"><label>Valor (R$)</label><input id="gfin-val" type="number" min="0" step="0.01" value="${escapeHtml(m.valor||'')}" placeholder="0,00"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
            <button class="btn ghost" onclick="gFinFecharModal()">Cancelar</button>
            <button class="btn" style="background:${corBtn};" onclick="gFinSalvar()">Salvar</button>
          </div>
        </div>
      </div>`;
    })() : '';

    const pendentesHtml = pendentes.length===0 ? '' : `
      <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin:16px 0 8px;">Pendentes</div>
      ${pendentes.map(a=>{
        const svcNome = a.servicoNome || '';
        const horario = a.hora ? a.hora.slice(0,5) : '';
        const dataFmt = new Date(a.data+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
        return `<div style="background:#fff;border:0.5px solid #eee;border-left:4px solid #FFA500;border-radius:10px;padding:11px 12px;margin-bottom:6px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 6px rgba(0,0,0,0.07);">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(a.nome||'')}</div>
            <div style="font-size:11px;color:#aaa;margin-top:2px;">${escapeHtml(svcNome)}${horario?' · '+dataFmt+' '+horario:''}</div>
          </div>
          <button onclick="abrirFinalizarModal('${a.id}')" style="${CS}background:#fff;color:#FFA500;border:1px solid #FFA500;border-radius:7px;padding:7px 12px;font-size:11px;font-weight:700;flex-shrink:0;">Finalizar</button>
        </div>`;
      }).join('')}`;

    const lancamentosHtml = lancamentos.length===0
      ? `<div style="text-align:center;padding:28px 20px;color:#aaa;font-size:13px;">Nenhum lançamento neste período</div>`
      : lancamentos.map(l=>{
          const isIn   = l.tipo==='receita';
          const bordClr= isIn ? '#008000' : '#FF0000';
          const valClr = isIn ? '#008000' : '#FF0000';
          const ag     = l.agendamento_id ? agendamentos.find(a=>a.id===l.agendamento_id) : null;
          const dataFmt= new Date(l.data+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
          const horario = ag?.hora ? ' · '+ag.hora.slice(0,5) : '';
          const svcMeta = ag?.servicoNome ? ag.servicoNome+' · ' : '';
          const meta   = ag ? `${svcMeta}${dataFmt}${horario}` : dataFmt;
          const lid    = escapeHtml(l.id);
          return `<div style="background:#fff;border:0.5px solid #eee;border-left:4px solid ${bordClr};border-radius:10px;padding:11px 12px;margin-bottom:6px;display:flex;align-items:center;gap:10px;box-shadow:0 1px 6px rgba(0,0,0,0.07);">
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(l.descricao)}</div>
              <div style="font-size:11px;color:#aaa;margin-top:2px;">${escapeHtml(meta)}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
              <div style="font-size:13px;font-weight:400;color:${valClr};font-variant-numeric:tabular-nums;">${isIn?'+':'-'}${gFinFmtMoeda(l.valor)}</div>
              <div style="display:flex;gap:3px;">
                <button onclick="gFinEditarLanc('${lid}')" style="${CS}width:26px;height:26px;border-radius:6px;border:none;background:none;color:#1a1a1a;display:flex;align-items:center;justify-content:center;">${ICO_EDIT}</button>
                <button onclick="gFinExcluir('${lid}')" style="${CS}width:26px;height:26px;border-radius:6px;border:none;background:none;color:#1a1a1a;display:flex;align-items:center;justify-content:center;">${ICO_TRASH}</button>
              </div>
            </div>
          </div>`;
        }).join('');

    const filtroLabel = {todos:'Todos',entradas:'Entradas',saidas:'Saídas'};
    const filtros = ['todos','entradas','saidas'].map(f=>`
      <div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();gFinSetFiltro('${f}')}" onclick="gFinSetFiltro('${f}')" style="${CS}padding:5px 14px;border-radius:999px;font-size:12px;font-weight:600;
        color:${_gFinFiltro===f?'#1a1a1a':'#888'};
        background:${_gFinFiltro===f?'#fff':'transparent'};
        box-shadow:${_gFinFiltro===f?'0 1px 4px rgba(0,0,0,0.10)':'none'};">
        ${filtroLabel[f]}
      </div>`).join('');

    return `
      ${modalHtml}
      <div style="font-size:22px;font-weight:700;color:#1a1a1a;margin-bottom:16px;padding:0 4px;">Financeiro</div>
      <div style="background:#e8e8e8;border-radius:8px;padding:3px;display:flex;margin-bottom:14px;">
        ${['dia','mes'].map(p=>`<button onclick="gFinSetPeriodo('${p}')" style="${CS}flex:1;padding:6px;border-radius:6px;border:none;font-size:13px;font-weight:700;
          background:${_gFinPeriodo===p?'#fff':'transparent'};color:${_gFinPeriodo===p?'#1a1a1a':'#888'};
          box-shadow:${_gFinPeriodo===p?'0 1px 4px rgba(0,0,0,0.12)':'none'};">${p==='dia'?'Dia':'Mês'}</button>`).join('')}
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span style="font-size:12px;font-weight:600;color:#555;">${gFinDataLabel()}</span>
        <div style="display:flex;gap:4px;">
          <button onclick="gFinNavegar(-1)" style="${CS}background:#fff;border:0.5px solid #e0e0e0;border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">${ICO_LEFT}</button>
          <button onclick="gFinNavegar(1)"  style="${CS}background:#fff;border:0.5px solid #e0e0e0;border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">${ICO_RIGHT}</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;grid-auto-rows:44px;">
        <div style="background:#fff;border:0.5px solid #eee;border-radius:9px;padding:6px 10px;display:flex;flex-direction:column;justify-content:center;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#008000;margin-bottom:1px;">Receitas</div>
          <div style="font-size:15px;font-weight:700;color:#008000;font-variant-numeric:tabular-nums;">${gFinFmtMoeda(receita)}</div>
        </div>
        <div style="background:#fff;border:0.5px solid #eee;border-radius:9px;padding:6px 10px;display:flex;flex-direction:column;justify-content:center;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#FF0000;margin-bottom:1px;">Despesas</div>
          <div style="font-size:15px;font-weight:700;color:#FF0000;font-variant-numeric:tabular-nums;">${gFinFmtMoeda(despesa)}</div>
        </div>
        <div style="background:#fff;border:0.5px solid #eee;border-radius:9px;padding:6px 10px;display:flex;flex-direction:column;justify-content:center;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#1a1a1a;margin-bottom:1px;">Saldo ${_gFinPeriodo==='dia'?'do dia':'do mês'}</div>
          <div style="font-size:15px;font-weight:700;color:#1a1a1a;font-variant-numeric:tabular-nums;">${gFinFmtMoeda(saldo)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <button onclick="gFinAbrirModal('receita')" style="${CS}flex:1;border:1px solid #86efac;border-radius:7px;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:3px;min-height:0;transition:background 160ms ease;">+ Receita</button>
          <button onclick="gFinAbrirModal('despesa')" style="${CS}flex:1;border:1px solid #fca5a5;border-radius:7px;background:#fff;color:#dc2626;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:3px;min-height:0;transition:background 160ms ease;">+ Despesa</button>
        </div>
      </div>

      ${pendentesHtml}

      <div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.06em;margin:16px 0 8px;">Lançamentos</div>
      <div style="display:inline-flex;background:#f0f0f0;border-radius:999px;padding:3px;gap:2px;margin-bottom:12px;">${filtros}</div>
      ${lancamentosHtml}
    `;
  }

  window.gFinSetFiltro = (f)=>{ _gFinFiltro=f; draw(); };

  function relatoriosBody(){
    const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const fmtData = d => { const [y,m,dd]=d.split('-'); return `${dd}/${m}/${y}`; };
    const ICO_DOWN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    const ICO_CHEV = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    // MENU
    if(!_relAba){
      // #49: aria-label para leitores de tela; svg decorativo aria-hidden
      const mkCard = (onclick, bg, ico, titulo, desc) => `
        <button onclick="${onclick}" aria-label="${titulo}: ${desc}" style="width:100%;display:flex;align-items:center;gap:14px;padding:14px 16px;background:none;border:none;border-bottom:0.5px solid #f2f2f7;cursor:pointer;font-family:inherit;text-align:left;">
          <div aria-hidden="true" style="width:36px;height:36px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${ico}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:15px;font-weight:600;color:#1a1a1a;">${titulo}</div>
            <div style="font-size:12px;color:#8e8e93;margin-top:2px;">${desc}</div>
          </div>
          <span aria-hidden="true">${ICO_CHEV}</span>
        </button>`;
      const ICO_FIN   = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
      const ICO_CAL2  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
      const ICO_PESS  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
      const ICO_SERV  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`;
      return `
        <div style="position:relative;display:flex;align-items:center;margin-bottom:16px;min-height:36px;">
          <div style="font-weight:700;font-size:16px;">Relatórios</div>
        </div>
        <div style="background:#fff;border-radius:22px;box-shadow:0 2px 16px rgba(0,0,0,0.06);overflow:hidden;">
          ${mkCard("setRelAba('financeiro')",   '#f0fdf4', ICO_FIN,   'Financeiro',    'Receitas, despesas e saldo por mês')}
          ${mkCard("setRelAba('agendamentos')", '#eff6ff', ICO_CAL2,  'Agendamentos',  'Todos os agendamentos do mês')}
          ${mkCard("setRelAba('clientes')",     '#f5f3ff', ICO_PESS,  'Clientes',      'Clientes ativos e frequência no mês')}
          ${mkCard("setRelAba('servicos')",     '#fff7ed', ICO_SERV,  'Serviços',      'Serviços mais agendados no mês')}
        </div>`;
    }

    // RELATÓRIO (financeiro ou agendamentos)
    const [ano, mes] = _relMes.split('-').map(Number);
    const mesLabel = MESES_PT[mes-1] + ' ' + ano;
    const prevMes = (()=>{ const d=new Date(ano,mes-2,1); return isoData(d).slice(0,7); })();
    const nextMes = (()=>{ const d=new Date(ano,mes,1);   return isoData(d).slice(0,7); })();
    const titulo = _relAba==='financeiro' ? 'Financeiro' : _relAba==='agendamentos' ? 'Agendamentos' : _relAba==='clientes' ? 'Clientes' : 'Serviços';

    const cabecalho = `
      <div style="position:relative;display:flex;align-items:center;margin-bottom:16px;min-height:36px;">
        <button onclick="setRelAba(null)" style="background:none;border:none;font-size:14px;font-weight:600;color:#555;cursor:pointer;padding:0;font-family:inherit;display:flex;align-items:center;gap:4px;">&#8249; Voltar</button>
        <div style="position:absolute;left:0;right:0;text-align:center;font-weight:700;font-size:16px;pointer-events:none;">${titulo}</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:20px;">
        <button onclick="setRelMes('${prevMes}')" style="background:none;border:none;font-size:22px;cursor:pointer;color:#1a1a1a;padding:4px 10px;line-height:1;">&#8249;</button>
        <div style="font-size:15px;font-weight:700;color:#1a1a1a;min-width:140px;text-align:center;">${mesLabel}</div>
        <button onclick="setRelMes('${nextMes}')" style="background:none;border:none;font-size:22px;cursor:pointer;color:#1a1a1a;padding:4px 10px;line-height:1;">&#8250;</button>
      </div>`;

    let conteudo = '';

    if(_relAba === 'financeiro'){
      const lancs = _gFinLancamentos.filter(l=>l.data.startsWith(_relMes)).sort((a,b)=>a.data.localeCompare(b.data));
      const receita = lancs.filter(l=>l.tipo==='receita').reduce((s,l)=>s+parseFloat(l.valor||0),0);
      const despesa = lancs.filter(l=>l.tipo==='despesa').reduce((s,l)=>s+parseFloat(l.valor||0),0);
      const saldo   = receita - despesa;
      const resumo = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#fff;border:0.5px solid #eee;border-radius:10px;padding:10px;text-align:center;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#008000;margin-bottom:4px;">Receitas</div>
            <div style="font-size:12px;font-weight:700;color:#008000;font-variant-numeric:tabular-nums;">${gFinFmtMoeda(receita)}</div>
          </div>
          <div style="background:#fff;border:0.5px solid #eee;border-radius:10px;padding:10px;text-align:center;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#FF0000;margin-bottom:4px;">Despesas</div>
            <div style="font-size:12px;font-weight:700;color:#FF0000;font-variant-numeric:tabular-nums;">${gFinFmtMoeda(despesa)}</div>
          </div>
          <div style="background:#fff;border:0.5px solid #eee;border-radius:10px;padding:10px;text-align:center;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#1a1a1a;margin-bottom:4px;">Saldo</div>
            <div style="font-size:12px;font-weight:700;color:${saldo>=0?'#008000':'#FF0000'};font-variant-numeric:tabular-nums;">${gFinFmtMoeda(saldo)}</div>
          </div>
        </div>`;
      const linhas = lancs.length === 0
        ? `<div style="text-align:center;padding:28px;color:#aaa;font-size:13px;">Nenhum lançamento neste mês</div>`
        : lancs.map(l=>{ const isIn=l.tipo==='receita'; return `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:0.5px solid #f2f2f7;">
              <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(l.descricao||'-')}</div>
                <div style="font-size:12px;color:#8e8e93;margin-top:2px;">${fmtData(l.data)}</div>
              </div>
              <div style="font-size:14px;font-weight:700;color:${isIn?'#008000':'#FF0000'};font-variant-numeric:tabular-nums;flex-shrink:0;">${isIn?'+':'-'}${gFinFmtMoeda(l.valor)}</div>
            </div>`; }).join('');
      const lista = lancs.length
        ? `<div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:16px;">${linhas}</div>`
        : `<div style="margin-bottom:16px;">${linhas}</div>`;
      conteudo = resumo + lista + `<button onclick="exportarRelCSV('financeiro')" style="width:100%;height:44px;border-radius:12px;border:1.5px solid #d1d5db;background:#fff;color:#1a1a1a;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;">${ICO_DOWN} Exportar CSV</button>`;
    }

    if(_relAba === 'agendamentos'){
      const agsMes = agendamentos.filter(a=>a.slug===emp.slug && a.data.startsWith(_relMes));
      const ags = agsMes.filter(a=>a.status!=='cancelado').sort((a,b)=>a.data.localeCompare(b.data)||a.hora.localeCompare(b.hora));
      const agsCancelados = agsMes.filter(a=>a.status==='cancelado').sort((a,b)=>a.data.localeCompare(b.data)||a.hora.localeCompare(b.hora));
      const nCancelados = agsCancelados.length;
      const resumo = `
        <div style="background:#fff;border:0.5px solid #eee;border-radius:10px;padding:12px;text-align:center;margin-bottom:16px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#8e8e93;margin-bottom:4px;">Total de agendamentos</div>
          <div style="font-size:28px;font-weight:700;color:#1a1a1a;line-height:1;">${ags.length}</div>
          ${nCancelados ? `<div style="font-size:12px;color:#dc2626;margin-top:6px;font-weight:600;">${nCancelados} cancelado${nCancelados!==1?'s':''} no mês</div>` : ''}
        </div>`;
      const renderLinhaAg = (a, cancelado=false) => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:0.5px solid #f2f2f7;${cancelado?'opacity:0.55;':''}">
              <div style="flex-shrink:0;min-width:50px;text-align:center;">
                <div style="font-size:12px;font-weight:700;color:${cancelado?'#dc2626':'#1a1a1a'};">${fmtData(a.data)}</div>
                <div style="font-size:11px;color:#8e8e93;">${a.hora}</div>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(a.nome||'-')}</div>
                <div style="font-size:12px;color:#8e8e93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(a.servicoNome||'-')}</div>
              </div>
              ${cancelado ? `<div style="font-size:11px;font-weight:600;color:#dc2626;flex-shrink:0;">Cancelado</div>` : ''}
            </div>`;
      const todasLinhas = [
        ...ags.map(a=>renderLinhaAg(a, false)),
        ...(agsCancelados.length ? [
          `<div style="padding:8px 14px 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#dc2626;background:#fff9f9;border-top:0.5px solid #fecaca;border-bottom:0.5px solid #f2f2f7;">Cancelados</div>`,
          ...agsCancelados.map(a=>renderLinhaAg(a, true))
        ] : [])
      ];
      const linhas = todasLinhas.length === 0
        ? `<div style="text-align:center;padding:28px;color:#aaa;font-size:13px;">Nenhum agendamento neste mês</div>`
        : todasLinhas.join('');
      const lista = todasLinhas.length
        ? `<div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:16px;">${linhas}</div>`
        : `<div style="margin-bottom:16px;">${linhas}</div>`;
      conteudo = resumo + lista + `<button onclick="exportarRelCSV('agendamentos')" style="width:100%;height:44px;border-radius:12px;border:1.5px solid #d1d5db;background:#fff;color:#1a1a1a;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;">${ICO_DOWN} Exportar CSV</button>`;
    }

    if(_relAba === 'clientes'){
      const ags = agendamentos.filter(a=>a.slug===emp.slug && a.data.startsWith(_relMes) && a.status!=='cancelado');
      // agrupa por cliente (nome+telefone)
      const mapa = {};
      ags.forEach(a=>{
        const key = (a.telefone||a.nome||'').trim() || a.nome;
        if(!mapa[key]) mapa[key] = { nome: a.nome||'-', telefone: a.telefone||'', count: 0 };
        mapa[key].count++;
      });
      const lista_cli = Object.values(mapa).sort((a,b)=>b.count-a.count);
      const totalAgs  = ags.length;
      const totalCli  = lista_cli.length;
      const resumo = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div style="background:#fff;border:0.5px solid #eee;border-radius:10px;padding:12px;text-align:center;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#8e8e93;margin-bottom:4px;">Clientes ativos</div>
            <div style="font-size:28px;font-weight:700;color:#7c3aed;line-height:1;">${totalCli}</div>
          </div>
          <div style="background:#fff;border:0.5px solid #eee;border-radius:10px;padding:12px;text-align:center;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#8e8e93;margin-bottom:4px;">Agendamentos</div>
            <div style="font-size:28px;font-weight:700;color:#1a1a1a;line-height:1;">${totalAgs}</div>
          </div>
        </div>`;
      const linhas_cli = lista_cli.length === 0
        ? `<div style="text-align:center;padding:28px;color:#aaa;font-size:13px;">Nenhum cliente neste mês</div>`
        : lista_cli.map(c=>`
            <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:0.5px solid #f2f2f7;">
              <div style="width:34px;height:34px;border-radius:50%;background:#f5f3ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:700;color:#7c3aed;">${(c.nome||'?')[0].toUpperCase()}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.nome)}</div>
                <div style="font-size:12px;color:#8e8e93;">${c.telefone||'sem telefone'}</div>
              </div>
              <div style="font-size:13px;font-weight:700;color:#7c3aed;flex-shrink:0;">${c.count} ${c.count===1?'vez':'vezes'}</div>
            </div>`).join('');
      const bloco_cli = lista_cli.length
        ? `<div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:16px;">${linhas_cli}</div>`
        : `<div style="margin-bottom:16px;">${linhas_cli}</div>`;
      conteudo = resumo + bloco_cli;
    }

    if(_relAba === 'servicos'){
      const ags = agendamentos.filter(a=>a.slug===emp.slug && a.data.startsWith(_relMes) && a.status!=='cancelado');
      const total = ags.length;
      // agrupa por serviço
      const mapa_svc = {};
      ags.forEach(a=>{
        const key = a.servicoNome||'Sem serviço';
        if(!mapa_svc[key]) mapa_svc[key] = { nome: key, count: 0 };
        mapa_svc[key].count++;
      });
      const lista_svc = Object.values(mapa_svc).sort((a,b)=>b.count-a.count);
      const maxCount  = lista_svc.length ? lista_svc[0].count : 1;
      const resumo_svc = `
        <div style="background:#fff;border:0.5px solid #eee;border-radius:10px;padding:12px;text-align:center;margin-bottom:16px;">
          <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#8e8e93;margin-bottom:4px;">Total de agendamentos</div>
          <div style="font-size:28px;font-weight:700;color:#1a1a1a;line-height:1;">${total}</div>
        </div>`;
      const linhas_svc = lista_svc.length === 0
        ? `<div style="text-align:center;padding:28px;color:#aaa;font-size:13px;">Nenhum agendamento neste mês</div>`
        : lista_svc.map((s,i)=>{
            const pct = total>0 ? Math.round(s.count/total*100) : 0;
            const barW = Math.round(s.count/maxCount*100);
            return `
            <div style="padding:12px 14px;border-bottom:0.5px solid #f2f2f7;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                <div style="font-size:14px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;">${escapeHtml(s.nome)}</div>
                <div style="flex-shrink:0;margin-left:10px;font-size:13px;font-weight:700;color:#ea580c;">${s.count} <span style="font-weight:400;color:#8e8e93;font-size:12px;">(${pct}%)</span></div>
              </div>
              <div style="height:5px;border-radius:99px;background:#f2f2f7;overflow:hidden;">
                <div style="height:100%;border-radius:99px;background:#ea580c;width:${barW}%;transition:width .3s;"></div>
              </div>
            </div>`;}).join('');
      const bloco_svc = lista_svc.length
        ? `<div style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);margin-bottom:16px;">${linhas_svc}</div>`
        : `<div style="margin-bottom:16px;">${linhas_svc}</div>`;
      conteudo = resumo_svc + bloco_svc;
    }

    return `${cabecalho}${conteudo}`;
  }

  window.gFinAbrirModal = (tipo)=>{
    _gFinModal = { tipo, agId: null, descricao: '', valor: '', editId: null };
    draw();
  };

  window.gFinEditarLanc = (id)=>{
    const l = _gFinLancamentos.find(x=>x.id===id);
    if(!l) return;
    _gFinModal = { tipo: l.tipo, agId: l.agendamento_id||null, descricao: l.descricao, valor: String(l.valor), editId: id };
    draw();
  };

  window.gFinExcluir = async (id)=>{
    if(!confirm('Excluir este lançamento?')) return;
    const { error, count } = await supabaseClient.from('lancamentos_financeiros').delete({ count: 'exact' }).eq('id', id);
    if(error){ toast('Erro ao excluir: ' + error.message,'err'); return; }
    if(count === 0){ toast('Sem permissão para excluir este lançamento.','err'); return; }
    toast('Lançamento removido.','ok');
    await gFinCarregar();
  };

  window.abrirFinalizarModal = (agId)=>{ _finalizarAgId=agId; _finalizarAcao=null; draw(); };
  window.fecharFinalizarModal = ()=>{ _finalizarAgId=null; _finalizarAcao=null; draw(); };
  window.setFinalizarAcao = (v)=>{ _finalizarAcao=v; draw(); };

  window.finalizarAtendido = async (agId)=>{
    const valEl = document.getElementById('fin-val');
    const val = parseFloat(valEl?.value);
    if(isNaN(val)||val<=0){ toast('Informe um valor válido.','err'); return; }
    const ag = agendamentos.find(a=>a.id===agId);
    if(!ag) return;
    _finalizarAgId = null;
    const dataLanc = ag.data || isoData(new Date());
    const descLanc = ag.nome || ag.servicoNome || '';
    const payload = { empresa_id:emp.id, tipo:'receita', descricao:descLanc, valor:val, data:dataLanc, agendamento_id:agId };
    const { error } = await supabaseClient.from('lancamentos_financeiros').insert(payload);
    if(error){ toast(friendlyError(error,'Erro ao salvar.'),'err'); _finalizarAgId=agId; draw(); return; }
    _gFinAgLancados.add(agId);
    toast('Lançamento salvo!','ok');
    await gFinCarregar();
    draw();
  };

  window.finalizarCancelado = async (agId)=>{
    confirmarAcao('Marcar como cancelado? O horário será liberado para novos agendamentos.', async ()=>{
      _finalizarAgId = null;
      const { error } = await supabaseClient.from('agendamentos').update({ status:'cancelado' }).eq('id', agId);
      if(error){ toast(friendlyError(error,'Erro ao cancelar.'),'err'); _finalizarAgId=agId; draw(); return; }
      const ag = agendamentos.find(a=>a.id===agId);
      if(ag) ag.status = 'cancelado';
      toast('Agendamento cancelado.','ok');
      draw();
    });
  };

  window.finalizarExcluir = (agId)=>{
    confirmarAcao('Excluir este agendamento? Essa ação não pode ser desfeita.', async ()=>{
      _finalizarAgId = null;
      const { error } = await supabaseClient.from('agendamentos').delete().eq('id', agId);
      if(error){ toast(friendlyError(error,'Erro ao excluir.'),'err'); _finalizarAgId=agId; draw(); return; }
      agendamentos = agendamentos.filter(a=>a.id!==agId);
      toast('Agendamento excluído.','ok');
      draw();
    });
  };

  window.gFinFecharModal = ()=>{ _gFinModal=null; draw(); };

  window.gFinSalvar = async ()=>{
    const descEl = document.getElementById('gfin-desc');
    const valEl  = document.getElementById('gfin-val');
    const desc = descEl?.value?.trim();
    const val  = parseFloat(valEl?.value);
    if(!desc){ toast('Informe uma descrição.','err'); return; }
    if(isNaN(val)||val<=0){ toast('Informe um valor válido.','err'); return; }
    const m = _gFinModal;
    _gFinModal = null;
    let error;
    if(m.editId){
      ({ error } = await supabaseClient.from('lancamentos_financeiros').update({ descricao: desc, valor: val }).eq('id', m.editId));
    } else {
      const agObj = m.agId ? agendamentos.find(a=>a.id===m.agId) : null;
      const dataLanc = agObj?.data || (_gFinPeriodo==='dia' ? _gFinData : isoData(new Date()));
      const payload = { empresa_id: emp.id, tipo: m.tipo, descricao: desc, valor: val, data: dataLanc };
      if(m.agId) payload.agendamento_id = m.agId;
      ({ error } = await supabaseClient.from('lancamentos_financeiros').insert(payload));
      if(!error && m.agId){
        _gFinAgLancados.add(m.agId);
      }
    }
    if(error){ toast(friendlyError(error,'Erro ao salvar.'),'err'); _gFinModal=m; draw(); return; }
    toast('Lançamento salvo!','ok');
    await gFinCarregar();
  };

  function preservarCamposPersonalizar(){
    // Garante que valores digitados no formulário de personalizar
    // não sejam perdidos quando draw() é chamado por outra razão
    if(configurarSub !== 'personalizar') return;
    const _nome = document.getElementById('pNome')?.value;          if(_nome != null) emp.nome = _nome || emp.nome;
    const _desc = document.getElementById('pDescricao')?.value;     if(_desc != null) emp.descricao = _desc;
    const _dest = document.getElementById('pTextoDestaque')?.value; if(_dest != null) emp.textoDestaque = _dest;
    const _cor  = document.getElementById('pCor')?.value;           if(_cor)          emp.corPrincipal = _cor;
  }

  function novoAgModalHtml(){
    if(!novoAgState || !_novoAgModalOpen) return '';
    const {data, hora} = novoAgState;
    const servicoOpts = emp.servicos.map(s=>`<option value="${s.id}">${escapeHtml(s.nome)}</option>`).join('');
    const _cliSel = _novoAgClienteId ? _clientes.find(x=>x.id===_novoAgClienteId) : null;
    const _nomePreench = _novoAgClienteBusca.toUpperCase();
    const dataFmt = new Date(data+'T00:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
    const clienteHtml = _novoAgCriarCliente
      ? `<div style="background:#f8faff;border:1.5px solid #c8c8c8;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:2px;">Novo cliente</div>
          <div class="field" style="margin:0;"><label>Nome</label><input id="novoAgCliNome" type="text" value="${escapeAttr(_nomePreench)}" placeholder="NOME COMPLETO" style="text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()"/></div>
          <div class="field" style="margin:0;"><label>Telefone</label><input id="novoAgCliTel" type="tel" inputmode="numeric" maxlength="16" placeholder="(xx) xxxxx-xxxx" oninput="maskTel(this)"/></div>
          <div style="display:flex;gap:8px;">
            <button class="btn ghost" style="flex:1;height:34px;font-size:13px;" onclick="cancelarCriarClienteRapido()">Cancelar</button>
            <button class="btn" style="flex:1;height:34px;font-size:13px;" onclick="salvarClienteRapido()">Salvar</button>
          </div>
        </div>`
      : _cliSel
        ? `<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border:1.5px solid #22c55e;border-radius:10px;background:#f0fdf4;"><div style="flex:1;font-size:14px;font-weight:600;color:#1a1a1a;">${escapeHtml(_cliSel.nome)}</div><button onclick="limparClienteAg()" style="background:none;border:none;color:#8e8e93;cursor:pointer;font-size:18px;line-height:1;padding:0;min-height:0;">&times;</button></div>`
        : `<div style="position:relative;">
            <input id="novoAgBusca" type="text" value="${escapeAttr(_novoAgClienteBusca)}" placeholder="Buscar cliente por nome..." oninput="buscarClienteAg(this.value)" autocomplete="off" style="width:100%;border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit;color:#1a1a1a;box-sizing:border-box;"/>
            <div id="novoAgDrop" style="position:absolute;left:0;right:0;top:calc(100% - 2px);background:#fff;border:0.5px solid #d1d5db;border-radius:0 0 10px 10px;overflow:hidden;z-index:50;box-shadow:0 4px 12px rgba(0,0,0,.10);display:none;"></div>
            <div id="novoAgNoResult" style="display:${_novoAgClienteBusca && !_novoAgClienteResultados.length && !_novoAgClienteId ? 'flex' : 'none'};align-items:center;justify-content:space-between;margin-top:6px;"><span style="font-size:12px;color:#8e8e93;">Nenhum cliente encontrado.</span><button onclick="criarClienteRapido()" style="font-family:inherit;font-size:12px;font-weight:700;color:#1a1a1a;background:#f4f4f5;border:none;border-radius:7px;padding:4px 10px;cursor:pointer;">+ Criar cliente</button></div>
          </div>`;
    return `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center;" onclick="if(event.target===this)cancelarNovoAg()">
      <div style="background:#fff;border-radius:18px 18px 0 0;padding:24px 24px 40px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;">
        <div style="font-weight:700;font-size:18px;color:#1a1a1a;margin:0 0 4px;">Novo agendamento</div>
        <div style="font-size:14px;color:#888;margin:0 0 20px;">${dataFmt} · ${hora}</div>
        <div class="field" style="position:relative;">
          <label>Cliente</label>
          ${clienteHtml}
        </div>
        <div class="field">
          <label>Serviço</label>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${emp.servicos.map(s=>{
              const sel = _novoAgServicos.includes(s.id);
              return `<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;border:1.5px solid ${sel?'#1a1a1a':'#e5e7eb'};background:${sel?'#f4f4f5':'#fff'};cursor:pointer;font-size:14px;color:#1a1a1a;font-weight:${sel?'600':'400'};" onclick="toggleNovoAgServico('${s.id}')">
                <div style="width:18px;height:18px;border-radius:5px;border:2px solid ${sel?'#1a1a1a':'#d1d5db'};background:${sel?'#1a1a1a':'#fff'};flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                  ${sel?'<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
                </div>
                ${escapeHtml(s.nome)}
              </label>`;
            }).join('')}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
          <button class="btn ghost" onclick="cancelarNovoAg()">Cancelar</button>
          <button class="btn" onclick="salvarNovoAg('${data}')">Agendar</button>
        </div>
      </div>
    </div>`;
  }

  function finalizarModalHtml(){
    if(!_finalizarAgId) return '';
    const ag = agendamentos.find(a=>a.id===_finalizarAgId);
    if(!ag) return '';
    const svc = emp.servicos.find(s=>s.id===ag.servicoId);
    const precoSugerido = svc?.preco ? String(svc.preco) : '';
    const CS2 = 'font-family:Nunito,sans-serif;cursor:pointer;width:100%;height:44px;border-radius:12px;font-size:14px;font-weight:600;margin-bottom:8px;';
    const cabecalho = `
      <div style="font-weight:700;font-size:18px;color:#1a1a1a;margin:0 0 4px;">Finalizar atendimento</div>
      <div style="font-size:14px;color:#888;margin:0 0 20px;">${escapeHtml(ag.nome)}${ag.servicoNome?' · '+escapeHtml(ag.servicoNome):''}</div>`;
    const corpo = _finalizarAcao==='atendido'
      ? `
        <div style="font-weight:600;font-size:14px;color:#1a1a1a;margin-bottom:12px;">Informe o valor recebido</div>
        <div class="field" style="margin:0 0 14px;"><label>Valor (R$)</label><input id="fin-val" type="number" min="0" step="0.01" value="${escapeHtml(precoSugerido)}" placeholder="0,00"></div>
        <button onclick="finalizarAtendido('${ag.id}')" style="${CS2}border:none;background:#16a34a;color:#fff;">Confirmar como atendido</button>
        <button onclick="setFinalizarAcao(null)" style="${CS2}border:1.5px solid #e5e7eb;background:#fff;color:#555;margin-bottom:0;">Voltar</button>`
      : `
        <button onclick="setFinalizarAcao('atendido')" style="${CS2}border:none;background:#16a34a;color:#fff;">Atendido</button>
        <button onclick="finalizarCancelado('${ag.id}')" style="${CS2}border:1.5px solid #fed7aa;background:#fff;color:#c2410c;">Cancelado</button>
        <button onclick="finalizarExcluir('${ag.id}')" style="${CS2}border:1.5px solid #fca5a5;background:#fff;color:#dc2626;">Excluir</button>
        <button onclick="fecharFinalizarModal()" style="${CS2}border:1.5px solid #e5e7eb;background:#fff;color:#555;margin-bottom:0;">Voltar</button>`;
    return `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center;" onclick="if(event.target===this)fecharFinalizarModal()">
      <div style="background:#fff;border-radius:18px 18px 0 0;padding:28px 24px 40px;width:100%;max-width:520px;">
        ${cabecalho}${corpo}
      </div>
    </div>`;
  }

  function draw(){
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
            <div class="card" style="${cardStyle}">${body}</div>
          </div>
        </div>
      </div>
    `);
    if(configurarSub === 'personalizar') setTimeout(_initRodaCores, 0);
  }

  window.setCorner = (c)=>{
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
  window.selecionarImagem = (tipo)=>{
    abrirCrop(tipo, emp.slug, async (url)=>{
      if(tipo==='logo'){ emp.logo = url; } else { emp.fotoUrl = url; }
      // preserva campos digitados antes de re-renderizar
      const _nome = document.getElementById('pNome')?.value; if(_nome!=null) emp.nome = _nome;
      const _desc = document.getElementById('pDescricao')?.value; if(_desc!=null) emp.descricao = _desc;
      const _dest = document.getElementById('pTextoDestaque')?.value; if(_dest!=null) emp.textoDestaque = _dest;
      draw();
    });
  };

  window.bloquearDiaTodo = async ()=>{
    const _diaS = new Date(diaSelecionado+'T00:00:00').getDay();
    const horarios = horariosParaDia(emp, _diaS);
    if(!horarios.length){ toast('Nenhum horário configurado para este dia.','err'); return; }
    const naoBloquados = horarios.filter(h=>!((emp.bloqueios||[]).some(b=>b.data===diaSelecionado && b.hora===h)));
    const dataFmtConf = new Date(diaSelecionado+"T00:00:00").toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
    if(!confirm(`Bloquear o dia ${dataFmtConf} inteiro?`)) return;
    if(naoBloquados.length){
      const rows = naoBloquados.map(h=>({ empresa_id: emp.id, data: diaSelecionado, hora: h }));
      const { data, error } = await supabaseClient.from('bloqueios').insert(rows).select();
      if(error){ toast('Erro ao bloquear. Tente novamente.','err'); return; }
      if(data) data.forEach(r=>{ (emp.bloqueios=emp.bloqueios||[]).push({id:r.id, data:r.data, hora:r.hora}); });
    }
    draw();
  };
  window.desbloquearDiaTodo = async ()=>{
    const dataFmtConf = new Date(diaSelecionado+"T00:00:00").toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
    if(!confirm(`Desbloquear o dia ${dataFmtConf} inteiro?`)) return;
    const ids = (emp.bloqueios||[]).filter(b=>b.data===diaSelecionado).map(b=>b.id);
    if(!ids.length){ draw(); return; }
    const { error } = await supabaseClient.from('bloqueios').delete().in('id', ids);
    if(error){ toast('Erro ao desbloquear. Tente novamente.','err'); return; }
    emp.bloqueios = (emp.bloqueios||[]).filter(b=>b.data!==diaSelecionado);
    draw();
  };

  window.novoAgendamento = (data, hora)=>{ novoAgState={data,hora}; editandoId=null; _novoAgModalOpen=true; draw(); };
  window.cancelarNovoAg = ()=>{ novoAgState=null; _novoAgClienteId=null; _novoAgClienteBusca=''; _novoAgClienteResultados=[]; _novoAgModalOpen=false; _novoAgCriarCliente=false; _novoAgServicos=[]; draw(); };
  window.salvarNovoAg = async (data)=>{
    const hora = novoAgState?.hora;
    if(!_novoAgClienteId){ toast('Selecione um cliente.','err'); return; }
    if(!_novoAgServicos.length||!hora){ toast('Selecione ao menos um serviço.','err'); return; }
    const cliente = _clientes.find(c=>c.id===_novoAgClienteId);
    if(!cliente){ toast('Cliente não encontrado.','err'); return; }
    const servicoId = _novoAgServicos[0];
    const servico = emp.servicos.find(s=>s.id===servicoId);
    const servicosNomes = _novoAgServicos.map(id=>{ const s=emp.servicos.find(x=>x.id===id); return s?.nome||''; }).filter(Boolean);
    const servicoNomeDisplay = servicosNomes.join(', ');
    const {data:row, error} = await supabaseClient.from('agendamentos').insert({
      empresa_id: emp.id,
      cliente_id: cliente.id,
      nome_cliente: cliente.nome, telefone: cliente.telefone,
      servico_id: servicoId, servico_nome: servico?.nome||'',
      servicos_json: JSON.stringify(_novoAgServicos),
      data, hora, token_curto: gerarTokenCurto()
    }).select().single();
    if(error){ toast(friendlyError(error,'Erro ao agendar.'),'err'); return; }
    // Resetar ausente ao reagendar
    const clienteAusente = _clientes.find(x=>x.id===cliente.id);
    if(clienteAusente && clienteAusente.ausenteEnviadoEm){
      clienteAusente.ausenteEnviadoEm = null;
      agMarkFetch({ cliente_id: cliente.id, campo: 'ausente_enviado_em', reset: true });
    }
    agendamentos.push({
      id:row.id, slug:emp.slug, clienteId:cliente.id,
      nome:row.nome_cliente, telefone:row.telefone,
      servicoId:row.servico_id, servicoNome:servicoNomeDisplay,
      servicosNomes,
      data:row.data, hora:row.hora,
      status: row.status || 'nao_confirmado',
      confirmacaoEnviada: false, lembreteEnviado: false,
      tokenCurto: row.token_curto || null
    });
    novoAgState=null; _novoAgClienteId=null; _novoAgClienteBusca=''; _novoAgClienteResultados=[]; _novoAgModalOpen=false; _novoAgCriarCliente=false; _novoAgServicos=[]; draw();
  };
  window.editarAgendamento = (id)=>{ editandoId=id; novoAgState=null; draw(); };
  window.cancelarEdicaoAgendamento = ()=>{ editandoId=null; draw(); };
  window.salvarEdicaoAgendamento = async (id)=>{
    const ag = agendamentos.find(a=>a.id===id);
    const nome = document.getElementById('editNome').value.trim();
    const tel = document.getElementById('editTel').value.trim();
    const servicoId = document.getElementById('editServico').value;
    const hora = document.getElementById('editHora').value;
    if(!nome || !tel){ toast('Preencha nome e telefone.','err'); return; }
    const telDigitos = tel.replace(/\D/g,'').replace(/^(55|0)/,'');
    if(telDigitos.length !== 11 || telDigitos[2] !== '9'){ toast('Telefone inválido. Ex: (11) 98765-4321','err'); return; }
    const telNorm = '0' + telDigitos;
    if(hora !== ag.hora){
      const ocupado = agendamentos.some(a=>a.id!==ag.id && a.slug===emp.slug && a.data===ag.data && a.hora===hora && a.status!=='cancelado');
      if(ocupado){ toast('Esse horário já está ocupado.','err'); return; }
      const bloq = (emp.bloqueios||[]).some(b=>b.data===ag.data && b.hora===hora);
      if(bloq){ toast('Esse horário está bloqueado.','err'); return; }
    }
    const servico = emp.servicos.find(s=>s.id===servicoId);
    const { error } = await supabaseClient.from('agendamentos').update({
      nome_cliente: nome,
      telefone:     telNorm,
      servico_id:   servicoId,
      servico_nome: servico ? servico.nome : ag.servicoNome,
      hora:         hora
    }).eq('id', id);
    if(error){ toast(friendlyError(error,'Erro ao salvar agendamento. Tente novamente.'),'err'); return; }
    ag.nome = nome; ag.telefone = telNorm; ag.servicoId = servicoId; ag.servicoNome = servico?servico.nome:ag.servicoNome; ag.hora = hora;
    editandoId = null; draw();
  };
  window.cancelarAgendamento = async (id)=>{
    if(!confirm('Cancelar este agendamento? O horário será liberado para novos agendamentos.')) return;
    const { error } = await supabaseClient.from('agendamentos').update({ status: 'cancelado' }).eq('id', id);
    if(error){ toast(friendlyError(error,'Erro ao cancelar agendamento. Tente novamente.'),'err'); return; }
    const ag = agendamentos.find(a=>a.id===id);
    if(ag) ag.status = 'cancelado';
    draw();
  };
  window.excluirAgendamento = async (id)=>{
    if(!confirm('Excluir este agendamento? Essa ação não pode ser desfeita.')) return;
    const { error } = await supabaseClient.from('agendamentos').delete().eq('id', id);
    if(error){ toast(friendlyError(error,'Erro ao excluir agendamento. Tente novamente.'),'err'); return; }
    agendamentos = agendamentos.filter(a=>a.id!==id);
    draw();
  };
  window.bloquearHorario = async (data,hora)=>{
    const { data: row, error } = await supabaseClient.from('bloqueios').insert({
      empresa_id: emp.id, data, hora
    }).select().single();
    if(error){ toast(friendlyError(error,'Erro ao bloquear horário. Tente novamente.'),'err'); return; }
    emp.bloqueios = emp.bloqueios || [];
    emp.bloqueios.push({ id: row.id, data, hora });
    draw();
  };
  window.desbloquearHorario = async (data,hora)=>{
    const { error } = await supabaseClient.from('bloqueios')
      .delete().eq('empresa_id', emp.id).eq('data', data).eq('hora', hora);
    if(error){ toast(friendlyError(error,'Erro ao desbloquear horário. Tente novamente.'),'err'); return; }
    emp.bloqueios = (emp.bloqueios||[]).filter(b=>!(b.data===data && b.hora===hora));
    draw();
  };

  window.adicionarServico = async ()=>{
    const nomeInp = document.getElementById('novoServicoNome');
    const precoInp = document.getElementById('novoServicoPreco');
    const nome = nomeInp ? nomeInp.value.trim() : '';
    const preco = precoInp ? Number(precoInp.value)||0 : 0;
    if(!nome){ toast('Digite o nome do serviço.','err'); return; }
    if(emp.servicos.some(s=>s.nome.toLowerCase()===nome.toLowerCase())){ toast('Já existe um serviço com esse nome.','err'); return; }
    const { data: row, error } = await supabaseClient.from('servicos').insert({
      empresa_id: emp.id, nome, duracao: 60, preco
    }).select().single();
    if(error){ toast(friendlyError(error,'Erro ao adicionar serviço. Tente novamente.'),'err'); return; }
    emp.servicos.push({ id: row.id, nome: row.nome, duracao: row.duracao, preco: Number(row.preco) });
    _novoServicoForm = false;
    draw();
  };
  window.salvarEdicaoServico = async (i)=>{
    const nomeInp = document.getElementById('svcNome_'+i);
    const precoInp = document.getElementById('svcPreco_'+i);
    const nome = nomeInp ? nomeInp.value.trim() : '';
    const preco = precoInp ? Number(precoInp.value)||0 : 0;
    if(!nome){ toast('Digite o nome do serviço.','err'); return; }
    if(emp.servicos.some((s,idx)=>idx!==i && s.nome.toLowerCase()===nome.toLowerCase())){ toast('Já existe um serviço com esse nome.','err'); return; }
    const s = emp.servicos[i];
    const { error } = await supabaseClient.from('servicos').update({ nome, preco }).eq('id', s.id);
    if(error){ toast('Erro ao salvar. Tente novamente.','err'); return; }
    emp.servicos[i] = { ...s, nome, preco };
    _editandoServicoIdx = null;
    draw();
  };
  window.cancelarEdicaoServico = ()=>{ _editandoServicoIdx = null; draw(); };
  window.editarServico = (i)=>{ _editandoServicoIdx = i; _removendoServicoIdx = null; draw(); };
  window.abrirNovoServico = ()=>{ _novoServicoForm = true; _editandoServicoIdx = null; draw(); };
  window.cancelarNovoServico = ()=>{ _novoServicoForm = false; draw(); };
  window.cancelarRemocaoServico = ()=>{ _removendoServicoIdx = null; draw(); };
  window.removeServico = async (i)=>{
    if(_removendoServicoIdx !== i){ _removendoServicoIdx = i; draw(); return; }
    _removendoServicoIdx = null;
    const s = emp.servicos[i];
    const { error } = await supabaseClient.from('servicos').delete().eq('id', s.id);
    if(error){ toast('Erro ao remover serviço. Tente novamente.','err'); return; }
    emp.servicos.splice(i,1);
    draw();
  };

  window.toggleWaMenu = (agId)=>{
    _waMenuId = _waMenuId === agId ? null : agId;
    draw();
  };
  window.setRelAba = (aba)=>{ _relAba=aba; draw(); };
  window.setRelMes = (mes)=>{ _relMes=mes; draw(); };
  window.exportarRelCSV = (tipo)=>{
    const MESES_PT = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const [ano, mes] = _relMes.split('-').map(Number);
    const mesLabel = MESES_PT[mes-1]+'_'+ano;
    const fmtData = d => { const [y,m,dd]=d.split('-'); return `${dd}/${m}/${y}`; };
    const csvField = v => { const s=(v||'').replace(/;/g,''); return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; };
    let csv, nome;
    if(tipo==='financeiro'){
      const lancs = _gFinLancamentos.filter(l=>l.data.startsWith(_relMes)).sort((a,b)=>a.data.localeCompare(b.data));
      csv = 'Data;Descricao;Tipo;Valor\n';
      csv += lancs.map(l=>`${fmtData(l.data)};${csvField(l.descricao)};${l.tipo==='receita'?'Receita':'Despesa'};${parseFloat(l.valor||0).toFixed(2).replace('.',',')}`).join('\n');
      nome = `financeiro_${mesLabel}.csv`;
    } else {
      const ags = agendamentos.filter(a=>a.slug===emp.slug && a.data.startsWith(_relMes)).sort((a,b)=>a.data.localeCompare(b.data)||a.hora.localeCompare(b.hora));
      const stLabel = s => s==='confirmado' ? 'Confirmado' : s==='cancelado' ? 'Cancelado' : 'Nao confirmado';
      csv = 'Data;Hora;Cliente;Servico;Status\n';
      csv += ags.map(a=>`${fmtData(a.data)};${a.hora};${csvField(a.nome)};${csvField(a.servicoNome)};${stLabel(a.status)}`).join('\n');
      nome = `agendamentos_${mesLabel}.csv`;
    }
    const blob = new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=nome; a.click();
    URL.revokeObjectURL(url);
  };

  window.toggleWaMenuInativo = (clienteId)=>{
    _inativoWaMenuId = _inativoWaMenuId === clienteId ? null : clienteId;
    draw();
  };
  window.waAcaoInativo = async (clienteId, tipo, empId)=>{
    const c = _clientes.find(x=>x.id===clienteId);
    if(!c || !c.telefone){ _inativoWaMenuId=null; draw(); return; }
    const waNum = '55' + c.telefone.replace(/\D/g,'').replace(/^0/,'');
    let link;
    if(tipo === 'conversar'){
      link = `https://wa.me/${waNum}`;
    } else {
      const empObj = empresas.find(e=>e.id===empId);
      const defaultMsg = 'Olá, {nome}! \nFaz um tempinho desde o seu último atendimento.\nQue tal agendar um novo horário? Estamos à disposição.\nAgende pelo link:\n{link}';
      const tmpl = empObj?.msgInativo || defaultMsg;
      const linkPublico = 'https://' + (empObj?.slug||'') + '.agenplus.com.br';
      const msg = tmpl
        .replace(/{nome}/g, c.nome||'')
        .replace(/{link}/g, linkPublico);
      link = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
    }
    _inativoWaMenuId = null;
    if(tipo === 'inativo'){
      const agora = new Date().toISOString();
      if(c) c.ausenteEnviadoEm = agora;
      draw();
      await agMarkFetch({ cliente_id: clienteId, campo: 'ausente_enviado_em' });
    } else {
      draw();
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  };
  window.waAcao = async (agId, tipo, empId)=>{
    const ag = agendamentos.find(a=>a.id===agId);
    if(!ag) return;
    const waNum = '55' + ag.telefone.replace(/\D/g,'').replace(/^0/,'');
    let link;
    if(tipo === 'conversar'){
      link = `https://wa.me/${waNum}`;
      _waMenuId = null;
      draw();
    } else {
      const empObj = empresas.find(e=>e.id===empId);
      const defaultMsg = tipo === 'confirmacao'
        ? 'Olá, {nome}!\nConfirme seu agendamento de {servico} para {data} às {hora}.\nAcesse o link abaixo para confirmar ou cancelar:\n{link}'
        : 'Olá, {nome}! \nPassando pra lembrar do seu agendamento! \n{servico}\n{data} - {hora}.\nAté lá!';
      const tmpl = (tipo === 'confirmacao' ? empObj?.msgConfirmacao : empObj?.msgLembrete) || defaultMsg;
      const dataFmt = ag.data ? new Date(ag.data+'T00:00:00').toLocaleDateString('pt-BR') : '';
      const token = ag.tokenCurto || agId;
      const linkConfirmar = 'https://' + (empObj?.slug||'') + '.agenplus.com.br/?ag=' + token;
      const msg = tmpl
        .replace(/{nome}/g, ag.nome||'')
        .replace(/{hora}/g, ag.hora||'')
        .replace(/{servico}/g, ag.servicoNome||'')
        .replace(/{data}/g, dataFmt)
        .replace(/{link}/g, linkConfirmar);
      link = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
      const campo = tipo === 'confirmacao' ? 'confirmacao_enviada' : 'lembrete_enviado';
      if(tipo === 'confirmacao') ag.confirmacaoEnviada = true;
      else ag.lembreteEnviado = true;
      _waMenuId = null;
      draw();
      await agMarkFetch({ ag_id: agId, campo });
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  };
  window.salvarMensagens = async (empId)=>{
    const c = document.getElementById('msgConfirmacao');
    const l = document.getElementById('msgLembrete');
    const i = document.getElementById('msgInativo');
    if(!c || !l) return;
    const { error } = await supabaseClient.from('empresas').update({
      msg_confirmacao: c.value,
      msg_lembrete:    l.value,
      msg_inativo:     i ? i.value : null
    }).eq('id', empId);
    if(error){ toast('Erro ao salvar. Tente novamente.','err'); return; }
    const empObj = empresas.find(e=>e.id===empId);
    if(empObj){ empObj.msgConfirmacao = c.value; empObj.msgLembrete = l.value; if(i) empObj.msgInativo = i.value; }
    toast('Mensagens salvas!','ok');
  };
  window.linkAcao = (acao)=>{
    const url = `https://${emp.slug}.agenplus.com.br`;
    if(acao==='abrir'){ window.open(url, '_blank'); }
    else if(acao==='copiar'){ navigator.clipboard.writeText(url).then(()=>toast('Link copiado!','ok')).catch(()=>toast('Nao foi possivel copiar o link.','err')); }
    else if(acao==='compartilhar'){ if(navigator.share) navigator.share({ title: emp.nome, url }); else navigator.clipboard.writeText(url).then(()=>toast('Link copiado!','ok')).catch(()=>toast('Nao foi possivel copiar o link.','err')); }
    draw();
  };
  // Expoe para o visibilitychange recarregar clientes quando a aba estiver ativa
  window._recarregarClientes = ()=>{ if(corner === 'clientes') carregarClientes(); };

  async function carregarClientes(){
    _clientesCarregando = true; draw();
    const { data, error } = await supabaseClient.from('clientes').select('*').eq('empresa_id', emp.id).order('nome');
    _clientesCarregando = false;
    if(error){ toast('Erro ao carregar clientes.','err'); _clientes=[]; draw(); return; }
    _clientes = (data||[]).map(c=>({ id:c.id, nome:c.nome, telefone:c.telefone, ausenteEnviadoEm:c.ausente_enviado_em||null }));
    draw();
  }
  window.filtrarClientesLive = (v)=>{
    _clientesBusca = v;
    const wrap = document.getElementById('clientesListaWrap');
    if(!wrap){ draw(); return; }
    const q = v.toLowerCase();
    const digits = v.replace(/\D/g,'');
    const listados = _clientes.filter(c=>{
      if(!v) return true;
      return c.nome.toLowerCase().includes(q) || (digits && (c.telefone||'').includes(digits));
    });
    const rows = listados.map(c=>`
      <div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();abrirPerfilCliente('${c.id}')}" onclick="abrirPerfilCliente('${c.id}')" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:0.5px solid #f2f2f7;cursor:pointer;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.nome)}</div>
          <div style="font-size:13px;color:#8e8e93;margin-top:2px;">${fmtTelStr(c.telefone)}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`).join('');
    wrap.innerHTML = listados.length
      ? `<div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">${rows}</div>`
      : `<p class="muted" style="text-align:center;padding:24px 0;">${v ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>`;
  };
  window.abrirNovoCliente = ()=>{ _clienteModalNovo=true; draw(); };
  window.fecharModalCliente = ()=>{ _clienteModalNovo=false; draw(); };
  window.abrirPerfilCliente = (id)=>{ _clientePerfilId=id; _clientePerfilEditando=false; draw(); };
  window.voltarDePerfilCliente = ()=>{ _clientePerfilId=null; _clientePerfilEditando=false; draw(); };
  window.toggleEditarPerfil = ()=>{ _clientePerfilEditando=!_clientePerfilEditando; draw(); };
  window.setClientesAba = (aba)=>{ _clientesAba=aba; draw(); };
  window.setInativosFiltro = (d)=>{ _clientesInativosFiltro=d; draw(); };
  window.dispensarBannerClientes = ()=>{ _clientesBannerDismissed=true; draw(); };
  window.salvarNovoCliente = async ()=>{
    const nome = (document.getElementById('cliNome')?.value||'').trim().toUpperCase();
    const telRaw = (document.getElementById('cliTel')?.value||'').replace(/\D/g,'').replace(/^(55|0)/,'');
    if(!nome){ toast('Preencha o nome.','err'); return; }
    if(telRaw.length!==11 || telRaw[2]!=='9'){ toast('Telefone inválido. Ex: (11) 98765-4321','err'); return; }
    const telefone = '0'+telRaw;
    const existeMem = _clientes.find(c=>c.telefone===telefone);
    if(existeMem){ toast(`Já existe um cliente com este número: ${existeMem.nome}.`,'err'); return; }
    // Verifica no banco diretamente para garantir mesmo se _clientes ainda nao carregou
    const { data: existeDB } = await supabaseClient.from('clientes').select('id,nome').eq('empresa_id', emp.id).eq('telefone', telefone).limit(1);
    if(existeDB && existeDB[0]){ toast(`Já existe um cliente com este número: ${existeDB[0].nome}.`,'err'); return; }
    const { data, error } = await supabaseClient.from('clientes').insert({ empresa_id:emp.id, nome, telefone }).select().single();
    if(error){ toast('Erro ao cadastrar cliente.','err'); return; }
    _clientes.push({ id:data.id, nome:data.nome, telefone:data.telefone, ausenteEnviadoEm:null });
    _clientes.sort((a,b)=>a.nome.localeCompare(b.nome));
    _clienteModalNovo=false; _clientesBusca=''; draw(); toast('Cliente cadastrado.','ok');
  };
  window.salvarPerfilCliente = async (id)=>{
    const nome = (document.getElementById('cliNome')?.value||'').trim().toUpperCase();
    const telRaw = (document.getElementById('cliTel')?.value||'').replace(/\D/g,'').replace(/^(55|0)/,'');
    if(!nome){ toast('Preencha o nome.','err'); return; }
    if(telRaw.length!==11 || telRaw[2]!=='9'){ toast('Telefone inválido. Ex: (11) 98765-4321','err'); return; }
    const telefone = '0'+telRaw;
    const existeMem = _clientes.find(c=>c.telefone===telefone && c.id!==id);
    if(existeMem){ toast(`Já existe um cliente com este número: ${existeMem.nome}.`,'err'); return; }
    // Verifica no banco diretamente para garantir mesmo se _clientes ainda nao carregou
    const { data: existeDB2 } = await supabaseClient.from('clientes').select('id,nome').eq('empresa_id', emp.id).eq('telefone', telefone).neq('id', id).limit(1);
    if(existeDB2 && existeDB2[0]){ toast(`Já existe um cliente com este número: ${existeDB2[0].nome}.`,'err'); return; }
    const { error } = await supabaseClient.from('clientes').update({ nome, telefone }).eq('id', id);
    if(error){ toast('Erro ao salvar.','err'); return; }
    const c = _clientes.find(x=>x.id===id);
    if(c){ c.nome=nome; c.telefone=telefone; }
    _clientes.sort((a,b)=>a.nome.localeCompare(b.nome));
    _clientePerfilEditando=false; draw(); toast('Cliente atualizado.','ok');
  };
  window.excluirClienteDoPerfil = (id)=>{
    _excluirClienteModal = id; draw();
  };
  window.cancelarExcluirCliente = ()=>{
    _excluirClienteModal = null; draw();
  };
  window.confirmarExcluirCliente = async (id, excluirAgs)=>{
    _excluirClienteModal = null;
    if(excluirAgs){
      const cli = _clientes.find(c=>c.id===id);
      const idsAg = agendamentos.filter(a=>a.slug===emp.slug
        && (a.clienteId ? a.clienteId===id : (cli && a.telefone===cli.telefone))).map(a=>a.id);
      if(idsAg.length){
        const { error: eAg } = await supabaseClient.from('agendamentos').delete().in('id', idsAg);
        if(eAg){ toast('Erro ao excluir agendamentos.','err'); return; }
        agendamentos = agendamentos.filter(a=>!idsAg.includes(a.id));
      }
    }
    const { error } = await supabaseClient.from('clientes').delete().eq('id', id);
    if(error){ toast('Erro ao excluir cliente.','err'); return; }
    _clientes = _clientes.filter(c=>c.id!==id);
    _clientePerfilId=null; _clientePerfilEditando=false;
    draw(); toast('Cliente removido.','ok');
  };

  // Busca de clientes no formulário de novo agendamento
  // Atualiza só o dropdown no DOM, sem chamar draw() (evita perder o foco a cada letra)
  function _atualizarDropdownAg(){
    const drop    = document.getElementById('novoAgDrop');
    const noRes   = document.getElementById('novoAgNoResult');
    if(drop){
      if(_novoAgClienteResultados.length && !_novoAgClienteId){
        drop.style.display='block';
        drop.innerHTML = _novoAgClienteResultados.map(c=>`
          <div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selecionarClienteAg('${c.id}')}" onclick="selecionarClienteAg('${c.id}')" style="padding:10px 12px;cursor:pointer;font-size:14px;font-weight:600;border-bottom:0.5px solid #f2f2f7;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background=''">
            ${escapeHtml(c.nome)}<span style="font-weight:400;color:#8e8e93;margin-left:8px;">${escapeHtml(fmtTelStr(c.telefone))}</span>
          </div>`).join('');
      } else {
        drop.style.display='none';
        drop.innerHTML='';
      }
    }
    if(noRes){
      const mostrar = _novoAgClienteBusca.trim() && !_novoAgClienteResultados.length && !_novoAgClienteId;
      noRes.style.display = mostrar ? 'flex' : 'none';
    }
  }
  window.buscarClienteAg = (v)=>{
    _novoAgClienteBusca = v;
    if(!v.trim()){ _novoAgClienteResultados=[]; _atualizarDropdownAg(); return; }
    const q = v.toLowerCase();
    const digits = v.replace(/\D/g,'');
    _novoAgClienteResultados = _clientes.filter(c=>
      c.nome.toLowerCase().includes(q) || (digits && (c.telefone||'').includes(digits))
    ).slice(0,5);
    _atualizarDropdownAg();
  };
  window.selecionarClienteAg = (id)=>{
    const c = _clientes.find(x=>x.id===id);
    if(!c) return;
    _novoAgClienteId = c.id;
    _novoAgClienteBusca = c.nome;
    _novoAgClienteResultados = [];
    draw();
  };
  window.limparClienteAg = ()=>{ _novoAgClienteId=null; _novoAgClienteBusca=''; _novoAgClienteResultados=[]; _novoAgCriarCliente=false; draw(); };

  let _novoAgCriarCliente = false;
  let _novoAgServicos = []; // ids dos servicos selecionados no modal manual
  window.toggleNovoAgServico = (id)=>{
    const i = _novoAgServicos.indexOf(id);
    if(i===-1) _novoAgServicos.push(id); else _novoAgServicos.splice(i,1);
    draw();
  };
  window.criarClienteRapido = ()=>{ _novoAgCriarCliente=true; draw(); };
  window.cancelarCriarClienteRapido = ()=>{ _novoAgCriarCliente=false; draw(); };
  window.salvarClienteRapido = async ()=>{
    const nome = (document.getElementById('novoAgCliNome')?.value||'').trim().toUpperCase();
    const telRaw = (document.getElementById('novoAgCliTel')?.value||'').replace(/\D/g,'').replace(/^(55|0)/,'');
    if(!nome){ toast('Preencha o nome.','err'); return; }
    if(telRaw.length!==11||telRaw[2]!=='9'){ toast('Telefone inválido. Ex: (11) 98765-4321','err'); return; }
    const telefone = '0'+telRaw;
    // Verifica no banco diretamente (evita falso negativo se _clientes ainda nao carregou)
    const { data: existDB } = await supabaseClient.from('clientes').select('id,nome,telefone').eq('empresa_id', emp.id).eq('telefone', telefone).limit(1);
    const jaExisteDB = existDB && existDB[0];
    if(jaExisteDB){
      // Garante que esta em _clientes para uso imediato
      if(!_clientes.find(c=>c.id===jaExisteDB.id)) _clientes.push({ id:jaExisteDB.id, nome:jaExisteDB.nome, telefone:jaExisteDB.telefone, ausenteEnviadoEm:null });
      _novoAgClienteId = jaExisteDB.id;
      _novoAgClienteBusca = jaExisteDB.nome;
      _novoAgClienteResultados = [];
      _novoAgCriarCliente = false;
      draw(); toast('Cliente já cadastrado com este número.','ok');
      return;
    }
    const { data, error } = await supabaseClient.from('clientes').insert({ empresa_id:emp.id, nome, telefone }).select().single();
    if(error){ toast('Erro ao cadastrar cliente.','err'); return; }
    _clientes.push({ id:data.id, nome:data.nome, telefone:data.telefone, ausenteEnviadoEm:null });
    _clientes.sort((a,b)=>a.nome.localeCompare(b.nome));
    _novoAgClienteId = data.id;
    _novoAgClienteBusca = data.nome;
    _novoAgClienteResultados = [];
    _novoAgCriarCliente = false;
    draw(); toast('Cliente cadastrado.','ok');
  };

  window.salvarCancelamentoHoras = async (empresaId)=>{
    const val = parseInt(document.getElementById('cancelamentoHoras')?.value||'', 10);
    if(isNaN(val)||val<0){ toast('Digite um número de horas válido (0 = sem limite).','err'); return; }
    const { error } = await supabaseClient.from('empresas').update({ cancelamento_horas: val }).eq('id', empresaId);
    if(error){ toast('Erro ao salvar.','err'); return; }
    emp.cancelamentoHoras = val;
    const g = empresas.find(e=>e.id===empresaId); if(g) g.cancelamentoHoras = val;
    toast('Configuração salva.','ok');
    configurarSub = null; draw();
  };

  window.configurarIr = (sub)=>{ configurarSub=sub; personalizarDirty=false; _removendoServicoIdx=null; draw(); };
  window.irParaHorarios = ()=>{ corner='configurar'; configurarSub='horarios'; draw(); };
  window.toggleCorPicker = ()=>{
    const sliders  = document.getElementById('pCorSliders');
    const chevron  = document.getElementById('pCorChevron');
    if(!sliders) return;
    const aberto = sliders.style.display !== 'none';
    sliders.style.display  = aberto ? 'none' : 'block';
    if(chevron) chevron.style.transform = aberto ? '' : 'rotate(180deg)';
    if(!aberto) _initRodaCores();
  };
  window.atualizarCorPersonalizar = ()=>{}; // mantido para compatibilidade, substituido pela roda

  function _atualizarCorRoda(){
    const cor = hsvToHex(_rodaH, _rodaS, _rodaV);
    const preview = document.getElementById('pCorPreview');
    const hexEl   = document.getElementById('pCorHex');
    const hidden  = document.getElementById('pCor');
    const brilho  = document.getElementById('pCorBrilho');
    if(preview) preview.style.background = cor;
    if(hexEl)   hexEl.textContent = cor;
    if(hidden)  hidden.value = cor;
    if(brilho)  brilho.style.background = 'linear-gradient(to right,#000,'+hsvToHex(_rodaH,_rodaS,100)+')';
    marcarPersonalizarDirty();
  }

  window.rodaBrilhoChange = ()=>{
    const brilho = document.getElementById('pCorBrilho');
    if(!brilho) return;
    _rodaV = parseInt(brilho.value);
    _atualizarCorRoda();
  };

  function _desenharRodaCores(canvas){
    const ctx = canvas.getContext('2d');
    const cx = canvas.width/2, cy = canvas.height/2, r = cx;
    // Limpa
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Desenha setores de matiz (conic gradient via arcos)
    const steps = 360;
    for(let i=0;i<steps;i++){
      const startAngle = (i-0.5)*Math.PI/180;
      const endAngle   = (i+0.5)*Math.PI/180;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,startAngle,endAngle);
      ctx.closePath();
      ctx.fillStyle = 'hsl('+i+',100%,50%)';
      ctx.fill();
    }
    // Sobrepoe gradiente radial branco (centro branco = saturacao 0)
    const wGrad = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
    wGrad.addColorStop(0,'rgba(255,255,255,1)');
    wGrad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,2*Math.PI);
    ctx.fillStyle = wGrad;
    ctx.fill();
  }

  function _posRodaParaHsv(canvas,x,y){
    const cx = canvas.width/2, cy = canvas.height/2, r = cx;
    const dx = x-cx, dy = y-cy;
    const dist = Math.min(Math.sqrt(dx*dx+dy*dy),r);
    let ang = Math.atan2(dy,dx)*(180/Math.PI);
    if(ang<0) ang+=360;
    _rodaH = Math.round(ang);
    _rodaS = Math.round((dist/r)*100);
    _atualizarCorRoda();
    _desenharRodaCores(canvas);
    _desenharCursorRoda(canvas);
  }

  function _desenharCursorRoda(canvas){
    const ctx = canvas.getContext('2d');
    const cx = canvas.width/2, cy = canvas.height/2, r = cx;
    const ang = _rodaH*Math.PI/180;
    const dist = (_rodaS/100)*r;
    const px = cx + dist*Math.cos(ang);
    const py = cy + dist*Math.sin(ang);
    ctx.beginPath();
    ctx.arc(px,py,8,0,2*Math.PI);
    ctx.fillStyle = hsvToHex(_rodaH,_rodaS,100);
    ctx.fill();
    ctx.strokeStyle='#fff';
    ctx.lineWidth=2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px,py,9,0,2*Math.PI);
    ctx.strokeStyle='rgba(0,0,0,0.25)';
    ctx.lineWidth=1;
    ctx.stroke();
  }

  // Guarda as funcoes de listener do window para poder remover antes de adicionar novos
  let _rodaWinListeners = null;

  function _initRodaCores(){
    const canvas = document.getElementById('rodaCores');
    if(!canvas) return;

    // Remove listeners anteriores do window antes de adicionar novos
    if(_rodaWinListeners){
      window.removeEventListener('mousemove', _rodaWinListeners.move);
      window.removeEventListener('mouseup',   _rodaWinListeners.up);
      _rodaWinListeners = null;
    }

    _desenharRodaCores(canvas);
    _desenharCursorRoda(canvas);

    function getPos(e){
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width/rect.width, scaleY = canvas.height/rect.height;
      if(e.touches){
        return {x:(e.touches[0].clientX-rect.left)*scaleX, y:(e.touches[0].clientY-rect.top)*scaleY};
      }
      return {x:(e.clientX-rect.left)*scaleX, y:(e.clientY-rect.top)*scaleY};
    }
    function dentroRoda(x,y){
      const cx=canvas.width/2,cy=canvas.height/2;
      return Math.sqrt((x-cx)**2+(y-cy)**2) <= cx;
    }

    let dragging = false;
    canvas.addEventListener('mousedown', e=>{
      const {x,y}=getPos(e);
      if(!dentroRoda(x,y)) return;
      dragging=true;
      _posRodaParaHsv(canvas,x,y);
    });

    const onMove = e=>{ if(!dragging) return; const {x,y}=getPos(e); _posRodaParaHsv(canvas,x,y); };
    const onUp   = ()=>{ dragging=false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    _rodaWinListeners = { move: onMove, up: onUp };

    canvas.addEventListener('touchstart', e=>{
      e.preventDefault();
      const {x,y}=getPos(e);
      if(!dentroRoda(x,y)) return;
      dragging=true;
      _posRodaParaHsv(canvas,x,y);
    },{passive:false});
    canvas.addEventListener('touchmove', e=>{
      e.preventDefault();
      if(!dragging) return;
      const {x,y}=getPos(e);
      _posRodaParaHsv(canvas,x,y);
    },{passive:false});
    canvas.addEventListener('touchend', ()=>{ dragging=false; });
  }
  window.salvarSlugEmpresa = async ()=>{
    const novoSlug = (document.getElementById('pSlug')?.value || '').trim();
    if(!novoSlug){ toast('Preencha o link.','err'); return; }
    if(novoSlug === emp.slug){ toast('Link não alterado.','ok'); return; }
    // #40: lista unificada de slugs reservados (igual em todos os lugares do sistema)
    const _slugsReservados = ['api','app','admin','master','login','logout','auth','static','assets','sw','manifest','index','null','undefined','favicon','www','mail','suporte','ajuda','cdn','blog','help','cadastro'];
    if(_slugsReservados.includes(novoSlug)){ toast('Este link não pode ser usado. Escolha outro.','err'); return; }
    if(!confirm('Alterar o link para "'+novoSlug+'.agenplus.com.br"? O endereço antigo vai parar de funcionar.')) return;
    const { error } = await supabaseClient.from('empresas').update({ slug: novoSlug }).eq('id', emp.id);
    if(error){ toast((error.message||'').includes('unique')||error.code==='23505' ? 'Este link já está em uso.' : 'Erro ao salvar. Tente novamente.','err'); return; }
    const oldSlug = emp.slug;
    emp.slug = novoSlug;
    agendamentos.forEach(a => { if(a.slug === oldSlug) a.slug = novoSlug; });
    toast('Link atualizado!','ok');
    draw();
  };
  window.marcarPersonalizarDirty = ()=>{
    if(personalizarDirty) return;
    personalizarDirty = true;
    const saveWrap = document.getElementById('pers-save-wrap');
    const dirtyBanner = document.getElementById('pers-dirty-banner');
    if(saveWrap) saveWrap.style.display = 'none';
    if(dirtyBanner) dirtyBanner.style.display = 'block';
  };
  window.voltarDePersonalizar = ()=>{ personalizarDirty=false; configurarIr(null); };
  window.descartarPersonalizar = ()=>{ personalizarDirty=false; configurarIr(null); };
  window.abrirInputHorario = (dia)=>{
    const row = document.getElementById('hi-row-'+dia);
    const btn = document.getElementById('btn-add-'+dia);
    if(!row) return;
    row.style.display = 'flex';
    if(btn) btn.style.display = 'none';
    const inp = document.getElementById('hi-'+dia);
    if(inp){ inp.value = ''; inp.focus(); }
  };
  window.fecharInputHorario = (dia)=>{
    const row = document.getElementById('hi-row-'+dia);
    const btn = document.getElementById('btn-add-'+dia);
    if(row) row.style.display = 'none';
    if(btn) btn.style.display = '';
  };
  window.mascaraHorario = (el)=>{
    let v = el.value.replace(/\D/g,'');
    if(v.length > 4) v = v.slice(0,4);
    if(v.length >= 3) v = v.slice(0,2) + ':' + v.slice(2);
    el.value = v;
  };
  window.selecionarHorarioDia = (dia)=>{
    _horariosDiaSel = dia;
    draw();
  };
  window.adicionarHorario = async (dia)=>{
    const el = document.getElementById('hi-'+dia) || document.getElementById('novoHorarioInput');
    const raw = el ? el.value.trim() : '';
    const val = raw.length === 4 && !raw.includes(':') ? raw.slice(0,2)+':'+raw.slice(2) : raw;
    const horaValida = /^([01]\d|2[0-3]):([0-5]\d)$/.test(val);
    if(!horaValida){ toast('Horário inválido. Use o formato HH:MM.','err'); return; }
    emp.horariosPorMes = emp.horariosPorMes || {};
    const key = '_d' + dia + '_';
    // Se ainda nao existe chave pro dia, herda _uni_ como base
    if(!emp.horariosPorMes[key]){
      emp.horariosPorMes[key] = [...(emp.horariosPorMes['_uni_'] || [])];
    }
    const lista = emp.horariosPorMes[key];
    if(lista.includes(val)){ return; }
    const { error } = await supabaseClient.from('horarios_disponiveis').insert({
      empresa_id: emp.id, mes: key, hora: val
    });
    if(error){ toast(friendlyError(error,'Erro ao adicionar horário. Tente novamente.'),'err'); return; }
    lista.push(val);
    emp.horariosPorMes[key] = lista;
    draw();
    // reabre o card no estado correto (sem input visivel)
  };
  window.removerHorario = async (h, dia)=>{
    emp.horariosPorMes = emp.horariosPorMes || {};
    const key = '_d' + dia + '_';
    // Se nao existe chave pro dia, cria com base em _uni_ antes de remover
    if(!emp.horariosPorMes[key]){
      const base = [...(emp.horariosPorMes['_uni_'] || [])];
      for(const slot of base){
        await supabaseClient.from('horarios_disponiveis').insert({ empresa_id: emp.id, mes: key, hora: slot });
      }
      emp.horariosPorMes[key] = base;
    }
    const { error } = await supabaseClient.from('horarios_disponiveis')
      .delete().eq('empresa_id', emp.id).eq('mes', key).eq('hora', h);
    if(error){ toast(friendlyError(error,'Erro ao remover horário. Tente novamente.'),'err'); return; }
    emp.horariosPorMes[key] = (emp.horariosPorMes[key]||[]).filter(x=>x!==h);
    draw();
  };
  window.copiarHorarioParaTodos = async (diaOrigem)=>{
    emp.horariosPorMes = emp.horariosPorMes || {};
    const keyOrigem = '_d' + diaOrigem + '_';
    const slots = horariosParaDia(emp, diaOrigem);
    const diasTrabalho = (emp.horariosPorMes['_dias_'] || []).map(Number);
    const diasDestino = diasTrabalho.filter(d => d !== diaOrigem);
    if(!diasDestino.length){ return; }
    toast('Copiando...','info');
    for(const d of diasDestino){
      const key = '_d' + d + '_';
      // Remove slots existentes do dia destino
      await supabaseClient.from('horarios_disponiveis').delete().eq('empresa_id', emp.id).eq('mes', key);
      emp.horariosPorMes[key] = [];
      // Insere os slots do dia origem
      for(const slot of slots){
        await supabaseClient.from('horarios_disponiveis').insert({ empresa_id: emp.id, mes: key, hora: slot });
        emp.horariosPorMes[key].push(slot);
      }
    }
    toast('Horários copiados!','ok');
    draw();
  };
  window.toggleDiaSemana = async (dia)=>{
    emp.horariosPorMes = emp.horariosPorMes || {};
    const atual = (emp.horariosPorMes['_dias_'] || []).map(Number);
    let novos;
    if(!('_dias_' in emp.horariosPorMes)){
      // empresa nunca configurou dias: assume todos ativos e remove o clicado
      novos = [0,1,2,3,4,5,6].filter(d=>d!==dia);
    } else {
      // empresa ja configurou: toggle normal (adiciona ou remove o dia clicado)
      novos = atual.includes(dia) ? atual.filter(d=>d!==dia) : [...atual, dia].sort();
    }

    // Abordagem diff: nunca apaga tudo de uma vez
    // 1. Insere apenas os dias que entraram (não estavam em atual)
    const paraInserir = novos.filter(d => !atual.includes(d));
    if(paraInserir.length){
      const rows = paraInserir.map(d => ({ empresa_id: emp.id, mes: '_dias_', hora: String(d) }));
      const { error: insErr } = await supabaseClient.from('horarios_disponiveis').insert(rows);
      if(insErr){ toast(friendlyError(insErr,'Erro ao salvar dias. Tente novamente.'),'err'); return; }
    }

    // 2. Remove apenas os dias que saíram (não apaga o restante)
    // Se este passo falhar, os dias novos já foram inseridos e o banco fica consistente
    const paraRemover = atual.filter(d => !novos.includes(d));
    if(paraRemover.length){
      const { error: delErr } = await supabaseClient.from('horarios_disponiveis')
        .delete().eq('empresa_id', emp.id).eq('mes', '_dias_')
        .in('hora', paraRemover.map(String));
      if(delErr){ toast(friendlyError(delErr,'Erro ao salvar dias. Tente novamente.'),'err'); return; }
    }

    emp.horariosPorMes['_dias_'] = novos.map(String);
    draw();
  };

  // ── PERSONALIZAR PÁGINA ──────────────────────────────────

  window.salvarInfoEmpresa = async ()=>{
    emp.nome               = document.getElementById('pNome').value.trim() || emp.nome;
    emp.descricao          = document.getElementById('pDescricao').value.trim();
    emp.textoDestaque      = document.getElementById('pTextoDestaque').value.trim();
    emp.textoAgendar       = document.getElementById('pTextoAgendar').value.trim();
    emp.corPrincipal       = document.getElementById('pCor').value;
    const { error } = await supabaseClient.from('empresas').update({
      nome:                  emp.nome,
      descricao:             emp.descricao             || null,
      cor_principal:         emp.corPrincipal,
      texto_destaque:        emp.textoDestaque         || null,
      texto_agendar:         emp.textoAgendar          || null,
    }).eq('id', emp.id);
    if(error){ console.error('Erro ao salvar informações:', error); toast('Erro ao salvar. Tente novamente.','err'); return; }
    personalizarDirty = false;
    toast('Informações salvas!','ok');
    draw();
  };

  function validarConverterWhatsapp(val){
    let d = val.replace(/\D/g,'');
    if(d.startsWith('55') && d.length > 11) d = d.slice(2);
    if(d.startsWith('0')) d = d.slice(1);
    if(d.length !== 11 || d[2] !== '9') return null;
    return 'https://wa.me/55' + d;
  }
  window.atualizarCampoBotao = (tipoId, linkId, hintId, labelId, descId)=>{
    const tipo  = document.getElementById(tipoId)?.value;
    const inp   = document.getElementById(linkId);
    const hint  = document.getElementById(hintId);
    const label = labelId ? document.getElementById(labelId) : null;
    const desc  = descId  ? document.getElementById(descId)  : null;
    if(!inp) return;
    const BINFO = {
      whatsapp:     { label:'Número',  desc:'Digite o número com DDD', ph:'(xx) xxxxx-xxxx' },
      instagram:    { label:'Link',    desc:'Cole aqui o link do seu Instagram', ph:'https://instagram.com/seuusuario' },
      maps:         { label:'Link',    desc:'Pesquise seu endereço no Google Maps e cole o link aqui', ph:'https://maps.app.goo.gl/...' },
      site:         { label:'Link',    desc:'Cole o link do seu site, caso tenha', ph:'https://seusite.com.br' },
      personalizado:{ label:'Link',    desc:'Cole o link do botão', ph:'https://...' },
    };
    const bi = BINFO[tipo] || BINFO.whatsapp;
    if(label) label.textContent = bi.label;
    if(desc)  desc.textContent  = bi.desc;
    inp.placeholder = bi.ph;
    inp.value = '';
    const nomeWrap = document.getElementById(tipoId + 'NomeWrap');
    if(nomeWrap) nomeWrap.style.display = tipo === 'personalizado' ? 'block' : 'none';
    if(tipo === 'whatsapp'){
      inp.type = 'tel'; inp.inputMode = 'numeric'; inp.maxLength = 16;
      inp.oninput = ()=>window.maskTel(inp);
    } else {
      inp.type = 'text'; inp.inputMode = ''; inp.maxLength = 500;
      inp.oninput = null; inp.removeAttribute('oninput');
      if(hint) hint.style.display = 'none';
    }
  };
  window.iniciarNovoBotao  = ()=>{ novoBotaoState = {}; editandoBotaoId = null; draw(); };
  window.cancelarNovoBotao = ()=>{ novoBotaoState = null; draw(); };
  window.editarBotao       = (id)=>{ editandoBotaoId = id; novoBotaoState = null; draw(); };
  window.cancelarEdicaoBotao = ()=>{ editandoBotaoId = null; draw(); };
  window.salvarEdicaoBotao = async (id)=>{
    const tipo = document.getElementById('ebTipo').value;
    let nome = tipo === 'personalizado'
      ? (document.getElementById('ebTipoNomeEl')?.value.trim() || '')
      : (LABEL_POR_TIPO[tipo] || tipo);
    if(tipo === 'personalizado' && !nome){ toast('Digite o nome do botão.','err'); return; }
    let link   = document.getElementById('ebLink').value.trim();
    if(!link){ toast('Preencha o link do botão.','err'); return; }
    if(tipo === 'whatsapp'){
      const convertido = validarConverterWhatsapp(link);
      if(!convertido){
        const hint = document.getElementById('ebLinkHint');
        if(hint) hint.style.display = 'block';
        return;
      }
      link = convertido;
    } else if(!/^(https?:|tel:|mailto:)/i.test(link)){
      toast('O link deve começar com https://, http://, tel: ou mailto:','err'); return;
    }
    const existingB = emp.botoes.find(x=>x.id===id);
    const _corElEb = document.getElementById('ebTipoCorEl');
    const corBotao = emp.tipo === 'pagina' && _corElEb && _corElEb.dataset.sem !== '1' ? (_corElEb.value || '') : '';
    const { error } = await supabaseClient.from('botoes_empresa').update({
      nome, tipo, link, icone: '', abrir_nova_aba: true, cor: corBotao || null
    }).eq('id', id);
    if(error){ toast('Erro ao salvar. Tente novamente.','err'); return; }
    Object.assign(existingB, { nome, tipo, link, icone: '', abrirNovaAba: true, cor: corBotao });
    editandoBotaoId = null;
    draw();
  };

  window.salvarNovoBotao = async ()=>{
    const tipo = document.getElementById('bTipo').value;
    let nome = tipo === 'personalizado'
      ? (document.getElementById('bTipoNomeEl')?.value.trim() || '')
      : (LABEL_POR_TIPO[tipo] || tipo);
    if(tipo === 'personalizado' && !nome){ toast('Digite o nome do botão.','err'); return; }
    let link   = document.getElementById('bLink').value.trim();
    if(!link){ toast('Preencha o link do botão.','err'); return; }
    if(tipo === 'whatsapp'){
      const convertido = validarConverterWhatsapp(link);
      if(!convertido){
        const hint = document.getElementById('bLinkHint');
        if(hint) hint.style.display = 'block';
        return;
      }
      link = convertido;
    } else if(!/^(https?:|tel:|mailto:)/i.test(link)){
      toast('O link deve começar com https://, http://, tel: ou mailto:','err'); return;
    }
    const ordemMax = emp.botoes.length > 0 ? Math.max(...emp.botoes.map(b=>b.ordem)) + 1 : 0;
    const _corEl = document.getElementById('bTipoCorEl');
    const corBotao = emp.tipo === 'pagina' && _corEl && _corEl.dataset.sem !== '1' ? (_corEl.value || '') : '';
    const { data: row, error } = await supabaseClient.from('botoes_empresa').insert({
      empresa_id:    emp.id,
      nome, tipo, link,
      icone:         '',
      ordem:         ordemMax,
      ativo:         true,
      abrir_nova_aba: true,
      cor:           corBotao || null
    }).select().single();
    if(error){ console.error('Erro ao adicionar botão:', error); toast('Erro ao salvar. Tente novamente.','err'); return; }
    emp.botoes.push({ id:row.id, nome:row.nome, tipo:row.tipo, link:row.link,
      icone:row.icone, ordem:row.ordem, ativo:row.ativo, abrirNovaAba:row.abrir_nova_aba, cor:row.cor||'' });
    emp.botoes.sort((a,b)=>a.ordem-b.ordem);
    novoBotaoState = null;
    draw();
  };

  window.removerBotao = async (id)=>{
    if(!confirm('Remover este botão?')) return;
    const { error } = await supabaseClient.from('botoes_empresa').delete().eq('id', id);
    if(error){ toast(friendlyError(error,'Erro ao remover botão. Tente novamente.'),'err'); return; }
    emp.botoes = emp.botoes.filter(b=>b.id!==id);
    draw();
  };

  let _dragFromId = null;
  window.dragBotaoStart = (e, id)=>{
    _dragFromId = id;
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  };
  window.dragBotaoOver = (e)=>{
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  window.dragBotaoEnd = (e)=>{
    e.currentTarget.style.opacity = '';
    _dragFromId = null;
  };
  window.dragBotaoDrop = async (e, toId)=>{
    e.preventDefault();
    if(!_dragFromId || _dragFromId === toId) return;
    const fromIdx = emp.botoes.findIndex(b=>b.id===_dragFromId);
    const toIdx   = emp.botoes.findIndex(b=>b.id===toId);
    if(fromIdx < 0 || toIdx < 0) return;
    const moved = emp.botoes.splice(fromIdx, 1)[0];
    emp.botoes.splice(toIdx, 0, moved);
    emp.botoes.forEach((b, i) => b.ordem = i);
    _dragFromId = null;
    await Promise.all(emp.botoes.map(b =>
      supabaseClient.from('botoes_empresa').update({ ordem: b.ordem }).eq('id', b.id)
    ));
    draw();
  };

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
    const formAberto = editandoId !== null || novoAgState !== null || novoBotaoState !== null || editandoBotaoId !== null || _gFinModal !== null || _notaModal !== null || _clienteModalNovo || _clientePerfilEditando;
    if(!formAberto && (corner===null || corner==='dashboard')) draw();
  });
}

