// Gestao — aba Clientes: lista, perfil, ausentes/inativos.


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

      // Mesmo criterio de _diasSemVoltar: pelo id do cliente, ou pelo telefone nos agendamentos antigos sem cliente.
      // (antes era so pelo telefone: editar o telefone do cliente "apagava" o historico)
      const hist = agendamentos
        .filter(a => a.slug===emp.slug && (a.clienteId ? a.clienteId===c.id : a.telefone===c.telefone))
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
      const diaColor = d => d>=45?'#dc2626':d>=30?'#f97316':'#d97706'; // mesmas faixas dos botoes (+15, +30, +45)
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

  async function carregarClientes(){
    const seq = ++_clientesSeq; // so a resposta da carga mais recente e aplicada
    _clientesCarregando = true; draw();
    const { data, error } = await supabaseClient.from('clientes').select('*').eq('empresa_id', emp.id).order('nome');
    if(seq !== _clientesSeq) return;
    _clientesCarregando = false;
    if(error){ toast('Erro ao carregar clientes.','err'); _clientes=[]; draw(); return; }
    _clientes = (data||[]).map(c=>({ id:c.id, nome:c.nome || '', telefone:soDigitos(c.telefone), ausenteEnviadoEm:c.ausente_enviado_em||null }));
    draw();
  }

// Handlers chamados pelos onclick do HTML. Registrados a cada renderGestao().
function _registrarHandlersClientes(){

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
  // Expoe para o visibilitychange recarregar clientes quando a aba estiver ativa
  // So recarrega se a gestao ainda estiver aberta (a funcao continua registrada depois de sair dela)
  window._recarregarClientes = ()=>{ if(currentRoute.page === 'gestao' && corner === 'clientes') carregarClientes(); };
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
    const telRaw = telefoneNacional(document.getElementById('cliTel')?.value); // DDD 55 (RS) e valido
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
    const telRaw = telefoneNacional(document.getElementById('cliTel')?.value); // DDD 55 (RS) e valido
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
}
