// Gestao — aba Financeiro: lancamentos do dia/mes.


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

// Handlers chamados pelos onclick do HTML. Registrados a cada renderGestao().
function _registrarHandlersFinanceiro(){
  window.gFinNavegar = gFinNavegar;

  window.gFinSetPeriodo = (p)=>{
    _gFinPeriodo = p;
    if(p==='dia') _gFinData = isoData(new Date());
    else _gFinData = isoData(new Date()).slice(0,7);
    gFinCarregar();
  };

  window.gFinSetFiltro = (f)=>{ _gFinFiltro=f; draw(); };

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
}
