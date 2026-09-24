// Gestao — Configurar: menu, servicos, mensagens, cancelamento, link.


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
          <div style="font-size:13px;color:#8e8e93;margin-bottom:14px;line-height:1.5;">Até quantas horas antes do horário o cliente pode cancelar pelo link. Use 0 para não ter prazo mínimo.</div>
          <div class="field" style="margin:0;">
            <label>Horas de antecedência</label>
            <input id="cancelamentoHoras" type="number" min="0" max="168" step="1" value="${horas}" placeholder="0"
              style="width:100%;border:0.5px solid #d1d5db;border-radius:10px;padding:10px 12px;font-size:16px;font-family:inherit;color:#1a1a1a;"/>
          </div>
          <div style="font-size:12px;color:#8e8e93;margin-top:8px;line-height:1.6;">Exemplo: 0 = O cliente pode cancelar até o horário marcado<br>Exemplo: 2 = O cliente pode cancelar até 2 horas antes</div>
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
      // Mesmo nome do item no menu Configurar (varia com o tipo de conta)
      const P = emp.tipo === 'pagina' ? 'Personalize sua pagina' : 'Personalize seu link';
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
            `Vá em <b>Configurar → Serviços oferecidos</b> e adicione os serviços com nome e preço. Depois, em <b>Horários de agendamento</b>, ative os dias em que você atende e adicione os horários de cada dia. Por último, em <b>${P}</b>, coloque seu nome, logo, imagem de fundo e cor.`)
          + ajudaItem('Como meu cliente agenda?',
            'Compartilhe seu link (ex: seuNome.agenplus.com.br). O cliente abre o link, escolhe um ou mais serviços, o dia e o horário disponível, informa nome e telefone e confirma. O agendamento aparece no seu painel automaticamente.', true)
        )}
        ${ajudaCat('Meu link',
          ajudaItem('Como encontrar meu link de agendamento?',
            'Vá em <b>Configurar → Link público</b>. Lá aparece seu link completo, com as opções <b>Abrir</b>, <b>Copiar link</b> e <b>Compartilhar</b>.')
          + ajudaItem('Como compartilhar o link?',
            'Vá em <b>Configurar → Link público</b> e toque em <b>Compartilhar</b>. Você pode mandar pelo WhatsApp, Instagram ou qualquer outro app. Também dá para colocar na bio do Instagram.')
          + ajudaItem('Como personalizar a aparência da minha página?',
            `Vá em <b>Configurar → ${P}</b>. Lá você altera o nome, a descrição, o texto de destaque, o texto do botão de agendamento, a logo, a imagem de fundo, a cor principal e os botões da página. Toque em <b>Salvar</b> no final.`, true)
        )}
        ${ajudaCat('Agenda',
          ajudaItem('Como ver os agendamentos do dia?',
            'Abra a aba <b>Agenda</b>. Ela começa no dia de hoje. Use as setas <b>‹ ›</b> ao lado da data, ou toque na data, para ver outros dias.')
          + ajudaItem('Como bloquear um horário?',
            'Na aba <b>Agenda</b>, toque em <b>Bloquear</b> ao lado de um horário livre. Para fechar o dia inteiro, use <b>Bloquear dia todo</b>. O horário fica indisponível para novos agendamentos.')
          + ajudaItem('Como cancelar um agendamento?',
            'Na aba <b>Agenda</b>, toque em <b>Cancelar</b> no agendamento. O horário volta a ficar disponível e o cancelado aparece no fim do dia, em <b>Cancelados</b>.')
          + ajudaItem('Como marcar um agendamento como atendido?',
            'Depois que o horário passa, o agendamento mostra o botão <b>Finalizar</b>. Toque nele, escolha <b>Atendido</b> e informe o valor recebido: ele é lançado no Financeiro. Os pendentes também aparecem na aba Financeiro.', true)
        )}
        ${ajudaCat('Clientes',
          ajudaItem('Como cadastrar um cliente manualmente?',
            'Vá na aba <b>Clientes</b> e toque no botão <b>Novo</b> no canto superior direito. Preencha o nome e telefone e salve.')
          + ajudaItem('O que é a aba Ausentes?',
            'A aba <b>Ausentes</b> mostra clientes que não agendam há 15 dias ou mais, separados em <b>+15</b>, <b>+30</b> e <b>+45 dias</b>. Toque no botão do WhatsApp ao lado do cliente para enviar a mensagem de cliente ausente.')
          + ajudaItem('Como enviar lembrete de agendamento pelo WhatsApp?',
            'Na aba <b>Agenda</b>, toque em <b>WhatsApp</b> no agendamento e escolha <b>Lembrete</b> (ou <b>Confirmação</b>). O WhatsApp abre com a mensagem pronta para você enviar. Os textos podem ser alterados em <b>Configurar → Configurar mensagens</b>.', true)
        )}
        ${ajudaCat('Financeiro',
          ajudaItem('Como registrar uma entrada ou saída?',
            'Vá na aba <b>Financeiro</b> e toque em <b>+ Receita</b> ou <b>+ Despesa</b>. Informe a descrição e o valor. O lançamento entra no dia que está selecionado.')
          + ajudaItem('Como ver o faturamento do mês?',
            'Na aba <b>Financeiro</b>, toque em <b>Mês</b> no topo: aparecem as receitas, despesas e o saldo do mês. Use as setas para ver outros meses. Em <b>Configurar → Relatórios</b> há o resumo mensal com exportação em CSV.', true)
        )}
        ${ajudaCat('Configurações',
          ajudaItem('Como adicionar ou editar um serviço?',
            'Vá em <b>Configurar → Serviços oferecidos</b>. Toque em <b>Novo serviço</b> para criar um, no lápis para editar o nome e o preço, ou na lixeira para excluir.')
          + ajudaItem('Como configurar os dias e horários de atendimento?',
            'Vá em <b>Configurar → Horários de agendamento</b>. Ative os dias da semana em que você atende e, em cada dia, toque em <b>+ Adicionar</b> para incluir um horário (ex.: 09:00).')
          + ajudaItem('Como trocar o nome do meu link (endereço)?',
            `Vá em <b>Configurar → ${P}</b>, altere o campo <b>Link público</b> e toque em <b>Salvar link</b>. O endereço antigo deixa de funcionar e você será levado para o novo.`)
          + ajudaItem('Como trocar a logo e a cor da página?',
            `Vá em <b>Configurar → ${P}</b>. Use <b>Enviar logo</b> e <b>Enviar imagem de fundo</b> para as imagens e toque na <b>Cor principal</b> para escolher na roda de cores. Depois toque em <b>Salvar</b>.`, true)
        )}
        <div style="text-align:center;padding:8px 0 4px;">
          <p style="font-size:13px;color:#8e8e93;">Não encontrou o que procurava?</p>
          <a href="mailto:suporte@agenplus.com.br" style="display:inline-block;margin-top:8px;font-size:14px;font-weight:600;color:#6366f1;text-decoration:none;">Falar com o suporte</a>
        </div>
      `;
    }

    return '';
  }

// Handlers chamados pelos onclick do HTML. Registrados a cada renderGestao().
function _registrarHandlersConfigurar(){

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

  window.salvarCancelamentoHoras = async (empresaId)=>{
    const val = parseInt(document.getElementById('cancelamentoHoras')?.value||'', 10);
    if(isNaN(val)||val<0||val>168){ toast('Digite um número de horas de 0 a 168 (0 = sem prazo mínimo).','err'); return; }
    const { error } = await supabaseClient.from('empresas').update({ cancelamento_horas: val }).eq('id', empresaId);
    if(error){ toast('Erro ao salvar.','err'); return; }
    emp.cancelamentoHoras = val;
    const g = empresas.find(e=>e.id===empresaId); if(g) g.cancelamentoHoras = val;
    toast('Configuração salva.','ok');
    configurarSub = null; draw();
  };

  window.configurarIr = (sub)=>{
    configurarSub=sub; personalizarDirty=false; _removendoServicoIdx=null;
    // Guarda os campos ao entrar em Personalizar, para "Descartar"/"Voltar" desfazerem o que nao foi salvo
    if(sub === 'personalizar') _personalizarOriginal = { nome:emp.nome, descricao:emp.descricao, textoDestaque:emp.textoDestaque, textoAgendar:emp.textoAgendar, corPrincipal:emp.corPrincipal };
    if(sub === 'relatorios') _relAba = null; // sempre abre no menu de relatorios
    draw();
  };
  window.irParaHorarios = ()=>{ corner='configurar'; configurarSub='horarios'; draw(); };
}
