// Gestao — Relatorios (financeiro, agendamentos, clientes, servicos).


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

// Handlers chamados pelos onclick do HTML. Registrados a cada renderGestao().
function _registrarHandlersRelatorios(){
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
}
