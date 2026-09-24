// Gestao — aba Dashboard e bloco de notas.


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
            <div style="font-weight:700;font-size:16px;margin-bottom:14px;">Nova anotação</div>
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

  // ── Bloco de notas (dashboard) ──

  async function carregarNotas(){
    // Antes, uma carga em andamento fazia a proxima ser ignorada (a nota recem-salva nao aparecia).
    // Agora todas rodam e so a resposta da mais recente e aplicada.
    const seq = ++_notasSeq;
    const { data, error } = await supabaseClient
      .from('notas')
      .select('*')
      .eq('empresa_id', emp.id)
      .order('criado_em', { ascending: false });
    if(seq !== _notasSeq) return;
    if(!error && data) _notas = data;
    if(corner === 'dashboard') draw();
  }

// Handlers chamados pelos onclick do HTML. Registrados a cada renderGestao().
function _registrarHandlersDashboard(){

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

  window.removerNota = (id)=>{
    confirmarAcao('Excluir esta anotação?', async ()=>{
      const { error } = await supabaseClient.from('notas').delete().eq('id', id);
      if(error){ toast(friendlyError(error,'Erro ao excluir anotação.'),'err'); return; }
      _notas = _notas.filter(n=>n.id !== id);
      draw();
    });
  };
}
