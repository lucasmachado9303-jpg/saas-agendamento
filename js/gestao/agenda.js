// Gestao — aba Agenda: dia, bloqueios, novo/editar agendamento, finalizar, WhatsApp.


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

// Handlers chamados pelos onclick do HTML. Registrados a cada renderGestao().
function _registrarHandlersAgenda(){

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

  window.bloquearDiaTodo = async ()=>{
    const _diaS = new Date(diaSelecionado+'T00:00:00').getDay();
    const horarios = horariosParaDia(emp, _diaS);
    if(!horarios.length){ toast('Nenhum horário configurado para este dia.','err'); return; }
    const naoBloquados = horarios.filter(h=>!((emp.bloqueios||[]).some(b=>b.data===diaSelecionado && b.hora===h)));
    const dataFmtConf = new Date(diaSelecionado+"T00:00:00").toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
    const dia = diaSelecionado;
    confirmarAcao(`Bloquear o dia ${dataFmtConf} inteiro?`, async ()=>{
      if(naoBloquados.length){
        const rows = naoBloquados.map(h=>({ empresa_id: emp.id, data: dia, hora: h }));
        const { data, error } = await supabaseClient.from('bloqueios').insert(rows).select();
        if(error){ toast('Erro ao bloquear. Tente novamente.','err'); return; }
        if(data) data.forEach(r=>{ (emp.bloqueios=emp.bloqueios||[]).push({id:r.id, data:dataSegura(r.data), hora:horaSegura(r.hora)}); });
      }
      draw();
    });
  };
  window.desbloquearDiaTodo = async ()=>{
    const dataFmtConf = new Date(diaSelecionado+"T00:00:00").toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
    const dia = diaSelecionado;
    confirmarAcao(`Desbloquear o dia ${dataFmtConf} inteiro?`, async ()=>{
      const ids = (emp.bloqueios||[]).filter(b=>b.data===dia).map(b=>b.id);
      if(!ids.length){ draw(); return; }
      const { error } = await supabaseClient.from('bloqueios').delete().in('id', ids);
      if(error){ toast('Erro ao desbloquear. Tente novamente.','err'); return; }
      emp.bloqueios = (emp.bloqueios||[]).filter(b=>b.data!==dia);
      draw();
    });
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
      data:dataSegura(row.data), hora:horaSegura(row.hora),
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
    const telDigitos = telefoneNacional(tel); // (antes, o DDD 55 era removido como se fosse o codigo do pais)
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
      // servicos_json tambem: e dele que o nome do servico e montado ao recarregar
      // (antes, em agendamentos com varios servicos, a edicao "voltava" depois de atualizar a pagina)
      servicos_json: JSON.stringify([servicoId]),
      hora:         hora
    }).eq('id', id);
    if(error){ toast(friendlyError(error,'Erro ao salvar agendamento. Tente novamente.'),'err'); return; }
    ag.nome = nome; ag.telefone = telNorm; ag.servicoId = servicoId; ag.servicoNome = servico?servico.nome:ag.servicoNome; ag.hora = hora;
    ag.servicosNomes = servico ? [servico.nome] : [];
    editandoId = null; draw();
  };
  window.cancelarAgendamento = (id)=>{
    confirmarAcao('Cancelar este agendamento? O horário será liberado para novos agendamentos.', async ()=>{
      const { error } = await supabaseClient.from('agendamentos').update({ status: 'cancelado' }).eq('id', id);
      if(error){ toast(friendlyError(error,'Erro ao cancelar agendamento. Tente novamente.'),'err'); return; }
      const ag = agendamentos.find(a=>a.id===id);
      if(ag) ag.status = 'cancelado';
      draw();
    });
  };
  window.excluirAgendamento = (id)=>{
    confirmarAcao('Excluir este agendamento? Essa ação não pode ser desfeita.', async ()=>{
      const { error } = await supabaseClient.from('agendamentos').delete().eq('id', id);
      if(error){ toast(friendlyError(error,'Erro ao excluir agendamento. Tente novamente.'),'err'); return; }
      agendamentos = agendamentos.filter(a=>a.id!==id);
      draw();
    });
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

  window.toggleWaMenu = (agId)=>{
    _waMenuId = _waMenuId === agId ? null : agId;
    draw();
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
  window.toggleNovoAgServico = (id)=>{
    const i = _novoAgServicos.indexOf(id);
    if(i===-1) _novoAgServicos.push(id); else _novoAgServicos.splice(i,1);
    draw();
  };
  window.criarClienteRapido = ()=>{ _novoAgCriarCliente=true; draw(); };
  window.cancelarCriarClienteRapido = ()=>{ _novoAgCriarCliente=false; draw(); };
  window.salvarClienteRapido = async ()=>{
    const nome = (document.getElementById('novoAgCliNome')?.value||'').trim().toUpperCase();
    const telRaw = telefoneNacional(document.getElementById('novoAgCliTel')?.value);
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
}
