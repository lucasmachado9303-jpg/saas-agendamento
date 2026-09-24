// ---------- HOME DA EMPRESA ----------
function renderHome(emp){
  applyAccent(emp.corPrincipal);
  setPageMeta(
    emp.nome + ' — Agendamento online',
    emp.descricao || ('Agende online com ' + emp.nome),
    emp.fotoUrl || emp.logo || ''
  );
  if(emp.bloqueada){
    render(`${barraVoltarMaster()}<div class="container"><div class="empty"><h2 class="display">Agendamentos temporariamente indisponíveis</h2><p>Entre em contato diretamente com ${escapeHtml(emp.nome)}.</p></div></div>`);
    return;
  }

  const bg  = emp.fotoUrl || null;
  const cor = emp.corPrincipal || '#3d1f3a';
  const botoesAtivos = (emp.botoes || []).filter(b => b.ativo).sort((a,b) => a.ordem - b.ordem);

  const logoHtml = emp.logo
    ? `<img src="${escapeAttr(emp.logo)}" alt="Logo" style="width:180px;height:180px;border-radius:50%;border:4px solid #fff;object-fit:cover;box-shadow:0 4px 24px rgba(0,0,0,0.22);">`
    : `<div style="width:180px;height:180px;border-radius:50%;border:4px solid #fff;background:${cor};display:flex;align-items:center;justify-content:center;font-size:72px;font-family:'Nunito',sans-serif;font-weight:600;color:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.22);">${escapeHtml(emp.nome.charAt(0).toUpperCase())}</div>`;

  const _corTexto = (hex) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return (r*299 + g*587 + b*114) / 1000 > 140 ? '#1a1a1a' : '#ffffff';
  };
  const botoesHtml = botoesAtivos.map(b => {
    const target = b.abrirNovaAba ? 'target="_blank" rel="noopener noreferrer"' : '';
    const usarCor = emp.tipo === 'pagina' && b.cor;
    const txtCor  = usarCor ? _corTexto(b.cor) : 'var(--ink)';
    const btnStyle = usarCor
      ? `background:${b.cor};border:none;color:${txtCor};`
      : `background:#fff;border:1.5px solid var(--line);color:var(--ink);`;
    return `<a href="${escapeAttr(linkSeguro(b.link))}" ${target} style="text-decoration:none;display:block;width:100%;max-width:240px;margin:0 auto 10px;">
      <div style="${btnStyle}border-radius:14px;padding:14px 20px;font-size:15px;font-weight:600;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;gap:8px;">
        ${b.icone ? `<span style="font-size:18px;">${escapeHtml(b.icone)}</span>` : ''}${escapeHtml(b.nome)}
      </div>
    </a>`;
  }).join('');

  render(`
    ${barraVoltarMaster()}
    <div style="min-height:100vh;background:var(--paper);display:flex;flex-direction:column;">

      <!-- Imagem de fundo -->
      <div style="position:relative;height:220px;${bg ? `background-image:url('${escapeAttr(bg)}');background-size:cover;background-position:center;` : `background:linear-gradient(135deg,${cor} 0%,#1a0a1a 100%);`}">
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.55) 100%);"></div>
      </div>

      <!-- Perfil -->
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;padding:0 20px;margin-top:-90px;position:relative;">

        ${logoHtml}

        <h1 style="font-family:'Nunito',sans-serif;font-size:26px;font-weight:600;margin:14px 0 4px;text-align:center;color:var(--ink);">${escapeHtml(emp.nome)}</h1>

        ${emp.descricao    ? `<p style="color:var(--ink-soft);font-size:14px;text-align:center;margin:0 0 6px;max-width:300px;line-height:1.5;">${escapeHtml(emp.descricao).replace(/\n/g,'<br>')}</p>` : ''}
        ${emp.textoDestaque ? `<p style="color:var(--ink);font-size:13px;font-weight:700;text-align:center;margin:0 0 4px;letter-spacing:.02em;">${escapeHtml(emp.textoDestaque)}</p>` : ''}

        <div style="height:24px;"></div>

        <!-- Botão principal de agendamento (apenas para empresas do tipo agendamento) -->
        ${emp.tipo !== 'pagina' ? `
        <div style="width:100%;max-width:240px;margin:0 auto 10px;">
          <button onclick="goto({empresa:'${emp.slug}', page:'agendar'})"
            style="width:100%;background:${cor};color:${_corTexto(cor)};border:none;border-radius:14px;padding:14px 20px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.06);font-family:inherit;display:flex;align-items:center;justify-content:center;">
            ${escapeHtml(emp.textoAgendar || 'Agendar horário')}
          </button>
        </div>` : ''}


        <!-- Botões personalizados -->
        ${botoesHtml}

      </div>

      <!-- Rodapé -->
      ${emp.tipo !== 'pagina' ? `<div style="text-align:center;padding:16px 20px calc(16px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);margin-top:24px;">
        <button class="icon-btn" onclick="goto({empresa:'${emp.slug}', page:'gestao'})"
          style="font-size:12px;color:var(--ink-soft);opacity:0.7;letter-spacing:.04em;text-decoration:none;">
          Gestor
        </button>
      </div>` : ''}

    </div>
  `);
}

// ---------- AGENDAMENTO (WIZARD) ----------
let bookingState = {};
function renderAgendar(emp){
  if(emp.bloqueada){
    render(`${barraVoltarMaster()}<div class="container"><div class="empty"><h2 class="display">Agendamentos temporariamente indisponíveis</h2><p>Entre em contato diretamente com ${escapeHtml(emp.nome)}.</p></div></div>`);
    return;
  }
  applyAccent(emp.corPrincipal);
  if(bookingState._slug !== emp.slug) bookingState = {
    _slug:emp.slug, _step:1, _done:false,
    servicos:[], data:null, hora:null,
    nome:"", telefone:"", telefoneDisplay:"", _telErr:false,
    _calMes: mesKey(new Date())
  };

  function calCells(){
    const [ano,mes] = bookingState._calMes.split('-').map(Number);
    const primeiro  = new Date(ano,mes-1,1);
    const ultimo    = new Date(ano,mes,0);
    const hojeIso   = isoData(new Date());
    const cells     = [];
    for(let i=0;i<primeiro.getDay();i++) cells.push(null);
    for(let d=1;d<=ultimo.getDate();d++){
      const dt  = new Date(ano,mes-1,d);
      const iso = isoData(dt);
      const past= iso < hojeIso;
      cells.push({d, iso, past, livre: !past});
    }
    return cells;
  }

  function slotsParaDia(iso){
    const agora   = new Date();
    const hojeIso = isoData(agora);
    const _hpm0 = emp.horariosPorMes || {};
    const diasTrabalho = ('_dias_' in _hpm0)
      ? (_hpm0['_dias_'] || []).map(Number)
      : [0,1,2,3,4,5,6];
    const diaDaSemana = new Date(iso+'T00:00:00').getDay();
    if(!diasTrabalho.includes(diaDaSemana)) return [];
    return horariosParaDia(emp, diaDaSemana).map(h=>{
      const taken   = agendamentos.some(a=>a.slug===emp.slug && a.data===iso && a.hora===h && a.status!=='cancelado');
      const bloq    = (emp.bloqueios||[]).some(b=>b.data===iso && b.hora===h);
      const [hh,mm] = h.split(':').map(Number);
      const passado = iso===hojeIso && (hh*60+mm < agora.getHours()*60+agora.getMinutes()+15);
      return {h, livre: !taken && !bloq && !passado};
    });
  }

  function wizHeader(){
    const acc    = emp.corPrincipal || '#3d1f3a';
    const letras = emp.nome.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const avatarHtml = emp.logo
      ? `<img src="${escapeAttr(emp.logo)}" style="width:46px;height:46px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt="${escapeAttr(emp.nome)}">`
      : `<div style="width:46px;height:46px;border-radius:50%;background:${acc};display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700;flex-shrink:0;">${letras}</div>`;
    const dots = [1,2,3,4].map(i=>{
      const cor = (bookingState._done || i < bookingState._step) ? acc
                : i === bookingState._step ? acc+'80'
                : '#e5e7eb';
      return `<div style="flex:1;height:3px;border-radius:2px;background:${cor};"></div>`;
    }).join('');
    const label = bookingState._done ? '' : `Passo ${bookingState._step} de 3`;
    return `
      ${barraVoltarMaster()}
      <div style="padding:20px 20px 0;background:#fff;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          ${avatarHtml}
          <div>
            <div style="font-size:16px;font-weight:700;color:#111;">${escapeHtml(emp.nome)}</div>
            <div style="font-size:13px;color:#888;">Agendar horário</div>
          </div>
        </div>
        <div style="display:flex;gap:4px;margin-bottom:6px;">${dots}</div>
        ${label ? `<div style="font-size:12px;color:#888;margin-bottom:20px;">${label}</div>` : '<div style="margin-bottom:20px;"></div>'}
      </div>`;
  }

  function draw(){
    const acc = emp.corPrincipal || '#3d1f3a';
    const hdr = wizHeader();
    if(bookingState._done){ drawDone(hdr, acc); return; }
    if(bookingState._step === 1) drawStep1(hdr, acc);
    else if(bookingState._step === 2) drawStep2(hdr, acc);
    else drawStep3(hdr, acc);
  }

  function drawStep1(hdr, acc){
    const srvHtml = emp.servicos.length
      ? emp.servicos.map(s=>{
          const sel = bookingState.servicos.includes(s.id);
          const check = sel
            ? `<svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
            : '';
          return `<div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();wizToggleSrv('${s.id}')}" onclick="wizToggleSrv('${s.id}')" style="border:1.5px solid ${sel?acc:'#e5e7eb'};border-radius:14px;padding:15px 16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;cursor:pointer;background:${sel?acc+'15':'#fff'};">
            <div style="width:24px;height:24px;border-radius:50%;border:1.5px solid ${sel?acc:'#d1d5db'};flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${sel?acc:'transparent'};">${check}</div>
            <div style="font-size:16px;font-weight:600;color:#111;">${escapeHtml(s.nome)}</div>
          </div>`;
        }).join('')
      : `<p style="color:#888;font-size:15px;padding:8px 0;">Em breve — serviços sendo configurados.</p>`;
    const qtd = bookingState.servicos.length;
    render(`<div style="display:flex;flex-direction:column;min-height:100vh;max-width:480px;margin:0 auto;background:#fff;">
      ${hdr}
      <div style="flex:1;padding:0 22px 20px;">
        <div style="font-size:21px;font-weight:700;color:#111;margin-bottom:6px;">Escolha os serviços</div>
        <div style="font-size:15px;color:#888;margin-bottom:18px;">Selecione um ou mais</div>
        ${srvHtml}
      </div>
      <div style="padding:16px 22px 34px;border-top:1px solid #f3f4f6;background:#fff;position:sticky;bottom:0;">
        ${qtd>0?`<div style="font-size:13px;color:#888;margin-bottom:10px;">${qtd} serviço${qtd>1?'s':''} selecionado${qtd>1?'s':''}</div>`:''}
        <button onclick="wizNext()" ${qtd===0?'disabled':''} style="width:100%;height:52px;border-radius:14px;border:none;background:${qtd>0?acc:'#e5e7eb'};color:${qtd>0?'#fff':'#aaa'};font-size:16px;font-weight:600;cursor:${qtd>0?'pointer':'not-allowed'};font-family:inherit;">Continuar</button>
      </div>
    </div>`);
  }

  function drawStep2(hdr, acc){
    const [ano,mes] = bookingState._calMes.split('-').map(Number);
    const nomeMes   = new Date(ano,mes-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    const cells     = calCells();
    const CAB       = ['D','S','T','Q','Q','S','S'];
    const cabHtml   = CAB.map(d=>`<div style="text-align:center;font-size:11px;color:#9ca3af;font-weight:600;padding:5px 0;">${d}</div>`).join('');
    const hojeIso   = isoData(new Date());
    const cellsHtml = cells.map(c=>{
      if(!c) return '<div></div>';
      const sel  = bookingState.data===c.iso;
      const hoje = hojeIso===c.iso;
      if(!c.livre) return `<div style="aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;font-weight:${hoje?'700':'500'};color:#d1d5db;">${c.d}${hoje?'<span style="font-size:8px;line-height:1;margin-top:1px;">hoje</span>':''}</div>`;
      return `<div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();wizSelDia('${c.iso}')}" onclick="wizSelDia('${c.iso}')" style="aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:${sel?'#fff':hoje?acc:'#374151'};background:${sel?acc:'transparent'};border-radius:50%;cursor:pointer;">${c.d}${hoje?`<span style="font-size:8px;line-height:1;margin-top:1px;color:${sel?'#fff':acc};">hoje</span>`:''}</div>`;
    }).join('');
    const prevDate = new Date(ano,mes-2,1);
    const nextDate = new Date(ano,mes,1);
    const prevKey  = mesKey(prevDate);
    const nextKey  = mesKey(nextDate);
    const canPrev  = prevKey >= mesKey(new Date());
    let slotsHtml = '', diaLabel = '';
    if(bookingState.data){
      const dt = new Date(bookingState.data+"T00:00:00");
      diaLabel = dt.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
      const _hpm1 = emp.horariosPorMes || {};
      const _diasTrab = ('_dias_' in _hpm1)
        ? (_hpm1['_dias_'] || []).map(Number)
        : [0,1,2,3,4,5,6];
      const _naoAtende = !_diasTrab.includes(new Date(bookingState.data+'T00:00:00').getDay());
      if(_naoAtende){
        slotsHtml = `<p style="color:#888;font-size:15px;text-align:center;padding:8px 0;">Não há atendimento neste dia.</p>`;
      } else {
        const sl = slotsParaDia(bookingState.data);
        slotsHtml = sl.length
          ? sl.map(({h,livre})=>{
              const sel = bookingState.hora===h;
              if(!livre) return `<div style="border:1px solid #f3f4f6;border-radius:10px;padding:9px 4px;font-size:14px;font-weight:600;color:#d1d5db;text-align:center;background:#fafafa;">${h}</div>`;
              return `<div role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();wizSelHora('${h}')}" onclick="wizSelHora('${h}')" style="border:1px solid ${sel?acc:'#e5e7eb'};border-radius:10px;padding:9px 4px;font-size:14px;font-weight:600;color:${sel?'#fff':'#374151'};text-align:center;background:${sel?acc:'#fff'};cursor:pointer;">${h}</div>`;
            }).join('')
          : `<p style="color:#888;font-size:15px;">Nenhum horário disponível.</p>`;
      }
    }
    const canNext  = !!(bookingState.data && bookingState.hora);
    const resumoLn = canNext ? `<div style="font-size:13px;color:#888;margin-bottom:10px;text-transform:capitalize;">${new Date(bookingState.data+"T00:00:00").toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})} · ${bookingState.hora}</div>` : '';
    render(`<div style="display:flex;flex-direction:column;min-height:100vh;max-width:480px;margin:0 auto;background:#fff;">
      ${hdr}
      <div style="flex:1;padding:0 22px 20px;">
        <div style="font-size:21px;font-weight:700;color:#111;margin-bottom:6px;">Quando?</div>
        <div style="font-size:15px;color:#888;margin-bottom:16px;">Escolha o dia e horário</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <button onclick="${canPrev?`wizCalMes('${prevKey}')`:'void(0)'}" style="width:34px;height:34px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;cursor:${canPrev?'pointer':'not-allowed'};display:flex;align-items:center;justify-content:center;font-size:18px;color:${canPrev?'#555':'#ccc'};font-family:inherit;">&lsaquo;</button>
          <span style="font-size:15px;font-weight:600;color:#111;text-transform:capitalize;">${nomeMes}</span>
          <button onclick="wizCalMes('${nextKey}')" style="width:34px;height:34px;border-radius:10px;border:1px solid #e5e7eb;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:#555;font-family:inherit;">&rsaquo;</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:18px;">${cabHtml}${cellsHtml}</div>
        ${bookingState.data
          ? `<div style="font-size:13px;font-weight:600;color:#555;margin-bottom:10px;text-transform:capitalize;">${diaLabel}</div>
             <div class="wiz-horas" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">${slotsHtml}</div>`
          : `<p style="font-size:14px;color:#aaa;text-align:center;padding:8px 0;">Selecione um dia no calendário</p>`}
      </div>
      <div style="padding:16px 22px 34px;border-top:1px solid #f3f4f6;background:#fff;position:sticky;bottom:0;">
        ${resumoLn}
        <div style="display:flex;gap:10px;">
          <button onclick="wizBack()" style="width:52px;height:52px;border-radius:14px;border:1.5px solid #e5e7eb;background:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#555;font-family:inherit;">&larr;</button>
          <button onclick="wizNext()" ${canNext?'':'disabled'} style="flex:1;height:52px;border-radius:14px;border:none;background:${canNext?acc:'#e5e7eb'};color:${canNext?'#fff':'#aaa'};font-size:16px;font-weight:600;cursor:${canNext?'pointer':'not-allowed'};font-family:inherit;">Continuar</button>
        </div>
      </div>
    </div>`);
  }

  function drawStep3(hdr, acc){
    const digits   = bookingState.telefone.replace(/\D/g,'');
    const telValido= digits.length===12 && digits[0]==='0' && digits[3]==='9';
    const telErro  = digits.length>0 && !telValido;
    const nomeOk   = bookingState.nome.trim().length>0;
    const canSubmit= nomeOk && telValido;
    const srvNomes = bookingState.servicos.map(id=>{ const s=emp.servicos.find(x=>x.id===id); return s?s.nome:''; }).filter(Boolean);
    const dataFmt  = new Date(bookingState.data+"T00:00:00").toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
    render(`<div style="display:flex;flex-direction:column;min-height:100vh;max-width:480px;margin:0 auto;background:#fff;">
      ${hdr}
      <div style="flex:1;padding:0 22px 20px;">
        <div style="font-size:21px;font-weight:700;color:#111;margin-bottom:6px;">Seus dados</div>
        <div style="font-size:15px;color:#888;margin-bottom:18px;">Para confirmar o agendamento</div>
        <div style="margin-bottom:14px;">
          <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;">Nome completo</label>
          <input id="inpNome" type="text" maxlength="100" value="${escapeAttr(bookingState.nome)}"
            oninput="bookingState.nome=this.value.toUpperCase();this.value=this.value.toUpperCase();wizAtualizaBtn()"
            placeholder="SEU NOME"
            style="text-transform:uppercase;width:100%;border:1.5px solid #e5e7eb;border-radius:12px;padding:13px 14px;font-size:16px;color:#111;font-family:inherit;outline:none;"
            onfocus="this.style.borderColor='${acc}'" onblur="this.style.borderColor='#e5e7eb'"/>
        </div>
        <div style="margin-bottom:18px;">
          <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;">Telefone (WhatsApp)</label>
          <input id="inpTel" type="tel" inputmode="numeric" maxlength="16"
            value="${escapeAttr(bookingState.telefoneDisplay||bookingState.telefone)}"
            oninput="wizFormatTel(this)"
            placeholder="(11) 91234-5678"
            style="width:100%;border:1.5px solid ${telErro?'var(--danger)':'#e5e7eb'};border-radius:12px;padding:13px 14px;font-size:16px;color:#111;font-family:inherit;outline:none;"
            onfocus="this.style.borderColor='${acc}'" onblur="if(!bookingState._telErr)this.style.borderColor='#e5e7eb'"/>
          <div id="telError" style="display:${telErro?'flex':'none'};align-items:center;gap:6px;margin-top:8px;color:var(--danger);font-size:13px;">
            <span style="font-weight:700;">!</span><span>DDD + 9 + 8 dígitos. Ex: (11) 91234-5678</span>
          </div>
        </div>
        <div style="background:${acc}12;border:1px solid ${acc}40;border-radius:14px;padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:4px 0;">
            <span style="font-size:13px;color:#888;flex-shrink:0;margin-right:10px;">Serviços</span>
            <span style="font-size:14px;font-weight:600;color:#111;text-align:right;">${escapeHtml(srvNomes.join(', '))}</span>
          </div>
          <div style="border-top:1px solid ${acc}30;margin:8px 0;"></div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span style="font-size:13px;color:#888;">Data</span>
            <span style="font-size:14px;font-weight:600;color:#111;text-transform:capitalize;">${dataFmt}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span style="font-size:13px;color:#888;">Horário</span>
            <span style="font-size:14px;font-weight:600;color:#111;">${bookingState.hora}</span>
          </div>
        </div>
      </div>
      <div style="padding:16px 22px 34px;border-top:1px solid #f3f4f6;background:#fff;position:sticky;bottom:0;">
        <div style="display:flex;gap:10px;">
          <button onclick="wizBack()" style="width:52px;height:52px;border-radius:14px;border:1.5px solid #e5e7eb;background:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#555;font-family:inherit;">&larr;</button>
          <button id="btnAgendar" onclick="wizSubmit('${emp.slug}')" ${canSubmit?'':'disabled'}
            style="flex:1;height:52px;border-radius:14px;border:none;background:${canSubmit?acc:'#e5e7eb'};color:${canSubmit?'#fff':'#aaa'};font-size:16px;font-weight:600;cursor:${canSubmit?'pointer':'not-allowed'};font-family:inherit;">Confirmar</button>
        </div>
      </div>
    </div>`);
  }

  function drawDone(hdr, acc){
    const b        = lastBooking;
    const srvNomes = (b.servicosNomes||[b.servicoNome]).filter(Boolean);
    const dataFmt  = new Date(b.data+"T00:00:00").toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
    const msg      = `Olá!\n\nGostaria de confirmar meu agendamento!\n\nData: ${dataFmt}\nHorário: ${b.hora}\nServiço: ${srvNomes.join(', ')}\nNome: ${b.nome}`;
    const numero   = '55' + (emp.whatsapp||"").replace(/\D/g,"").replace(/^0/,"");
    const waLink   = `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
    const waIcon   = `<svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
    render(`<div style="display:flex;flex-direction:column;min-height:100vh;max-width:480px;margin:0 auto;background:#fff;">
      ${hdr}
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:28px 22px 40px;">
        <div style="width:72px;height:72px;border-radius:50%;background:#f0fdf4;border:2px solid #bbf7d0;display:flex;align-items:center;justify-content:center;font-size:32px;margin-bottom:20px;color:#22c55e;">&#10003;</div>
        <div style="font-size:23px;font-weight:700;color:#111;margin-bottom:8px;">Agendamento confirmado</div>
        <div style="font-size:15px;color:#888;line-height:1.6;margin-bottom:26px;max-width:260px;">Seu horário foi reservado com sucesso! Clique em enviar confirmação.</div>
        <div style="background:${acc}12;border:1px solid ${acc}40;border-radius:14px;padding:18px;width:100%;text-align:left;margin-bottom:20px;">
          <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;"><span style="font-size:13px;color:#9ca3af;width:68px;flex-shrink:0;">Serviços</span><span style="font-size:15px;font-weight:600;color:#111;">${escapeHtml(srvNomes.join(', '))}</span></div>
          <div style="display:flex;gap:10px;margin-bottom:10px;"><span style="font-size:13px;color:#9ca3af;width:68px;flex-shrink:0;">Data</span><span style="font-size:15px;font-weight:600;color:#111;text-transform:capitalize;">${dataFmt}</span></div>
          <div style="display:flex;gap:10px;"><span style="font-size:13px;color:#9ca3af;width:68px;flex-shrink:0;">Horário</span><span style="font-size:15px;font-weight:600;color:#111;">${b.hora}</span></div>
        </div>
        ${emp.whatsapp ? `<a href="${waLink}" target="_blank" rel="noopener noreferrer" style="display:block;width:100%;margin-bottom:14px;text-decoration:none;"><button style="width:100%;height:52px;border-radius:14px;border:1.5px solid #25d366;background:#fff;color:#1a7d40;font-size:16px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;font-family:inherit;">${waIcon}Enviar confirmação</button></a>` : ''}
        <button onclick="bookingState={};goto({empresa:'${emp.slug}'})" style="background:none;border:none;color:#9ca3af;font-size:15px;cursor:pointer;font-family:inherit;">Fazer outro agendamento</button>
      </div>
    </div>`);
  }

  window.wizToggleSrv = (id)=>{
    const i = bookingState.servicos.indexOf(id);
    if(i>=0) bookingState.servicos.splice(i,1);
    else bookingState.servicos.push(id);
    draw();
  };
  window.wizNext    = ()=>{ bookingState._step = Math.min(3, bookingState._step+1); draw(); };
  window.wizBack    = ()=>{ bookingState._step = Math.max(1, bookingState._step-1); draw(); };
  window.wizSelDia  = (iso)=>{ bookingState.data=iso; bookingState.hora=null; draw(); setTimeout(()=>{ document.querySelector('.wiz-horas')?.scrollIntoView({behavior:'smooth',block:'nearest'}); window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}); },80); };
  window.wizSelHora = (h)=>{ bookingState.hora=h; draw(); };
  window.wizCalMes  = (key)=>{ bookingState._calMes=key; draw(); };
  window.wizAtualizaBtn = ()=>{
    const btn = document.getElementById('btnAgendar');
    if(!btn) return;
    const digits = bookingState.telefone.replace(/\D/g,'');
    const telOk  = digits.length===12 && digits[0]==='0' && digits[3]==='9';
    const nomeOk = (document.getElementById('inpNome')?.value||'').trim().length>0;
    const ok = nomeOk && telOk;
    btn.disabled = !ok;
    btn.style.background = ok ? (emp.corPrincipal||'#3d1f3a') : '#e5e7eb';
    btn.style.color      = ok ? '#fff' : '#aaa';
    btn.style.cursor     = ok ? 'pointer' : 'not-allowed';
  };
  window.wizFormatTel = (input)=>{
    input.value = fmtTelStr(input.value);
    const d = input.value.replace(/\D/g,'').replace(/^0/,'');
    const norm = d.length>0 ? '0'+d : '';
    bookingState.telefone        = norm;
    bookingState.telefoneDisplay = input.value;
    const valido = norm.length===12 && norm[0]==='0' && norm[3]==='9';
    const erro   = d.length>0 && !valido;
    bookingState._telErr = erro;
    const errEl = document.getElementById('telError');
    if(errEl) errEl.style.display = erro?'flex':'none';
    window.wizAtualizaBtn();
  };
  window.wizSubmit = async (slug)=>{
    const btn = document.getElementById('btnAgendar');
    if(btn && btn.disabled) return;
    if(btn){ btn.disabled=true; btn.innerHTML='<span style="opacity:.6">Agendando…</span>'; }
    const nomeInp = document.getElementById('inpNome');
    const telInp  = document.getElementById('inpTel');
    bookingState.nome = nomeInp ? nomeInp.value : bookingState.nome;
    if(telInp){
      let _d = telInp.value.replace(/\D/g,'');
      if(_d.startsWith('55')&&_d.length>11) _d=_d.slice(2);
      if(_d.startsWith('0')) _d=_d.slice(1);
      bookingState.telefone = _d.length?'0'+_d:'';
    }
    const _digits = bookingState.telefone.replace(/\D/g,'');
    const _telOk  = _digits.length===12 && _digits[0]==='0' && _digits[3]==='9';
    if(!bookingState.servicos.length || !bookingState.data || !bookingState.hora || !bookingState.nome.trim() || !_telOk){
      if(btn){ btn.disabled=false; btn.innerHTML='Confirmar'; } return;
    }
    const emp2 = empresas.find(e=>e.slug===slug);
    if(emp2?.bloqueada){
      toast('Esta empresa não está aceitando agendamentos no momento.','err');
      if(btn){ btn.disabled=false; btn.innerHTML='Confirmar'; }
      return;
    }
    const jaOcupado = agendamentos.some(a=>a.slug===slug && a.data===bookingState.data && a.hora===bookingState.hora && a.status!=='cancelado')
      || (emp2?.bloqueios||[]).some(b=>b.data===bookingState.data && b.hora===bookingState.hora);
    if(jaOcupado){
      toast('Esse horário foi reservado ou bloqueado. Escolha outro.','err');
      if(btn){ btn.disabled=false; btn.innerHTML='Confirmar'; }
      bookingState._step=2; draw(); return;
    }
    const primeiroServico = emp2.servicos.find(s=>s.id===bookingState.servicos[0]);
    // Registra/unifica cliente por telefone antes de inserir o agendamento
    let clienteIdBooking = null;
    try {
      const ucRes = await fetch('/api/upsert-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id: emp2.id, nome: bookingState.nome.trim(), telefone: bookingState.telefone.trim() })
      });
      if(ucRes.ok){ const ucData = await ucRes.json(); clienteIdBooking = ucData.cliente_id || null; }
    } catch(e){}
    // #15/#28: retry em caso de colisão de token_curto (code 23505 com token_curto)
    let error = null;
    for(let _tentativa = 0; _tentativa < 3; _tentativa++){
      const res = await supabaseClient.from('agendamentos').insert({
        empresa_id:    emp2.id,
        cliente_id:    clienteIdBooking,
        servico_id:    primeiroServico ? primeiroServico.id   : null,
        servico_nome:  primeiroServico ? primeiroServico.nome : '',
        servicos_json: JSON.stringify(bookingState.servicos),
        data:          bookingState.data,
        hora:          bookingState.hora,
        nome_cliente:  bookingState.nome.trim(),
        telefone:      bookingState.telefone.trim(),
        token_curto:   gerarTokenCurto()
      });
      error = res.error;
      // colisão de token_curto: tenta novamente com outro token
      if(error && error.code === '23505' && (error.message||'').includes('token_curto')) continue;
      break;
    }
    if(error){
      if(btn){ btn.disabled=false; btn.innerHTML='Confirmar'; }
      // #16: colisão de horário → mensagem amigável
      if(error.code === '23505') { toast('Este horário acabou de ser reservado. Escolha outro.','err'); draw(); return; }
      toast(friendlyError(error,'Erro ao realizar agendamento. Tente novamente.'),'err');
      return;
    }
    const srvNomes = bookingState.servicos.map(id=>{ const s=emp2.servicos.find(x=>x.id===id); return s?s.nome:''; }).filter(Boolean);
    const novo = {
      slug,
      servicoId:    primeiroServico?.id   || null,
      servicoNome:  primeiroServico?.nome || '',
      servicosNomes: srvNomes,
      data:         bookingState.data,
      hora:         bookingState.hora,
      nome:         bookingState.nome.trim(),
      telefone:     bookingState.telefone.trim()
    };
    agendamentos.push({...novo});
    lastBooking = novo;
    bookingState._done = true;
    draw();
  };
  draw();
}

let lastBooking = null;

// ---------- CONFIRMAÇÃO ----------
function renderConfirmacao(emp){
  applyAccent(emp.corPrincipal);
  const b = lastBooking;
  if(!b){
    render(`<div class="container"><div class="empty"><h2 class="display">Nenhum agendamento recente</h2><button class="btn" onclick="goto({empresa:'${emp.slug}'})">Voltar</button></div></div>`);
    return;
  }
  const srvNomesConf = (b.servicosNomes||[b.servicoNome]).filter(Boolean);
  const dataFmt = new Date(b.data+"T00:00:00").toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
  const msg = `Olá!\n\nGostaria de confirmar meu agendamento!\n\nData: ${dataFmt}\nHorário: ${b.hora}\nServiço: ${srvNomesConf.join(', ')}\nNome: ${b.nome}`;
  const numero = '55' + (emp.whatsapp||"").replace(/\D/g,"").replace(/^0/,"");
  const link = `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
  render(`
    <div class="container">
      <div class="card" style="text-align:center;">
        <div style="font-size:52px;margin-bottom:8px;">✓</div>
        <div class="eyebrow" style="color:var(--ok);">Agendamento confirmado</div>
        <h1 class="display">Agendado!</h1>
        <div style="text-align:left;background:var(--paper);border-radius:10px;padding:16px;margin:20px 0;">
          <div><strong>Serviço:</strong> ${escapeHtml(srvNomesConf.join(', '))}</div>
          <div><strong>Dia:</strong> ${dataFmt}</div>
          <div><strong>Hora:</strong> ${b.hora}</div>
          <div><strong>Nome:</strong> ${escapeHtml(b.nome)}</div>
        </div>
        ${emp.whatsapp ? `<a href="${link}" target="_blank" rel="noopener noreferrer"><button class="btn ghost" style="width:100%;">Enviar confirmação pelo WhatsApp</button></a>` : ''}
        <div style="margin-top:14px;"><button class="icon-btn" onclick="goto({empresa:'${emp.slug}'})">Voltar ao início</button></div>
      </div>
    </div>
  `);
}

// ---------- LINK DIRETO DE AGENDAMENTO (?ag=UUID) ----------
async function renderAgConfirmar(emp, agId){
  applyAccent(emp.corPrincipal);
  const cor = emp.corPrincipal || '#3d1f3a';

  // Tela de carregamento
  render(`<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--paper);"><div style="font-size:14px;color:#aaa;">Carregando...</div></div>`);

  // Busca o agendamento pelo UUID via API (service key, contorna RLS)
  let ag = null;
  try {
    const r = await fetch('/api/ag-get?ag_id=' + encodeURIComponent(agId));
    if(r.ok) ag = await r.json();
  } catch(e){}

  if(!ag){
    render(`
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--paper);padding:24px;">
        <div style="background:#fff;border-radius:20px;padding:32px 24px;max-width:360px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.10);text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">?</div>
          <div style="font-size:17px;font-weight:700;color:var(--ink);margin-bottom:8px;">Agendamento não encontrado</div>
          <div style="font-size:14px;color:#8e8e93;margin-bottom:24px;">Este link pode ter expirado ou o agendamento foi removido.</div>
          <button onclick="goto({empresa:'${emp.slug}'})" style="background:${cor};color:#fff;border:none;border-radius:14px;padding:14px 24px;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer;width:100%;">Fazer novo agendamento</button>
        </div>
      </div>
    `);
    return;
  }

  const diasSemana = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const dtObj = new Date(ag.data + 'T00:00:00');
  const dataFmt = `${diasSemana[dtObj.getDay()]}, ${dtObj.getDate()} de ${meses[dtObj.getMonth()]}`;

  const statusLabels = { confirmado: 'Confirmado', cancelado: 'Cancelado', agendado: 'Aguardando confirmação' };
  const statusColors = { confirmado: { bg:'#f0fdf4', text:'#16a34a', dot:'#16a34a', border:'#bbf7d0' }, cancelado: { bg:'#fef2f2', text:'#dc2626', dot:'#dc2626', border:'#fecaca' }, agendado: { bg:'#fff8ec', text:'#d97706', dot:'#d97706', border:'#fde68a' } };
  const sc = statusColors[ag.status] || statusColors.agendado;
  const sl = statusLabels[ag.status] || 'Aguardando confirmação';

  const jaDefinido = ag.status === 'confirmado' || ag.status === 'cancelado';

  render(`
    <div style="min-height:100vh;background:var(--paper);display:flex;align-items:center;justify-content:center;padding:24px 16px;">
      <div style="background:#fff;border-radius:20px;padding:32px 24px 28px;max-width:360px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div><div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px;">Cliente</div><div style="font-size:16px;font-weight:600;color:var(--ink);">${escapeHtml(ag.nome_cliente||'')}</div></div>
        </div>

        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/><path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/><path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/></svg>
          </div>
          <div><div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px;">Servico</div><div style="font-size:16px;font-weight:600;color:var(--ink);">${escapeHtml(ag.servico_nome||'')}</div></div>
        </div>

        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div><div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px;">Data</div><div style="font-size:16px;font-weight:600;color:var(--ink);">${dataFmt}</div></div>
        </div>

        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:0;">
          <div style="width:36px;height:36px;border-radius:10px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
          </div>
          <div><div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px;">Horario</div><div style="font-size:16px;font-weight:600;color:var(--ink);">${escapeHtml(ag.hora||'')}</div></div>
        </div>

        ${jaDefinido ? `
        <div style="margin-top:28px;text-align:center;font-size:14px;color:#aaa;">
          Este agendamento já foi ${ag.status === 'confirmado' ? 'confirmado' : 'cancelado'}.
        </div>
        ` : `
        <div style="margin-top:28px;display:flex;flex-direction:column;align-items:center;gap:14px;" id="agActionArea">
          <button id="btnConfirmarAg" onclick="agConfirmar('${agId}','confirmar','${emp.slug}')"
            style="width:100%;background:#16a34a;color:#fff;border:none;border-radius:14px;padding:17px 24px;font-size:16px;font-weight:700;font-family:inherit;cursor:pointer;box-shadow:0 4px 16px rgba(22,163,74,0.25);">
            Confirmar agendamento
          </button>
          <button onclick="agConfirmar('${agId}','cancelar','${emp.slug}')"
            style="background:none;border:none;color:#aaa;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;padding:4px 8px;text-decoration:underline;text-underline-offset:3px;">
            cancelar agendamento
          </button>
        </div>
        `}
      </div>
    </div>
  `);
}

window.agConfirmar = async (agId, acao, empSlug) => {
  const btnConfirmar = document.getElementById('btnConfirmarAg');
  const area = document.getElementById('agActionArea');
  if(area) area.style.opacity = '0.5';
  if(btnConfirmar) btnConfirmar.disabled = true;
  try {
    const res = await fetch('/api/ag-action', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ag_id: agId, acao })
    });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Erro');
    const msg = acao === 'confirmar' ? 'Agendamento confirmado!' : 'Agendamento cancelado.';
    if(area){
      area.innerHTML = `<div style="text-align:center;font-size:15px;font-weight:600;color:${acao==='confirmar'?'#16a34a':'#8e8e93'};padding:8px 0;">${msg}</div>`;
      area.style.opacity = '1';
    }
  } catch(e) {
    if(area) area.style.opacity = '1';
    if(btnConfirmar) btnConfirmar.disabled = false;
    const msg = (e?.message && e.message !== 'Erro') ? e.message : mensagemErroRede(e);
    toast(msg,'err');
  }
};

window.loginComGoogle = async (slug)=>{
  if(slug) localStorage.setItem('ob_goto', JSON.stringify({ empresa: slug, page: 'gestao' }));
  const redirectTo = urlPrincipal('/login');
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  if(error){ localStorage.removeItem('ob_goto'); toast('Erro ao iniciar login com Google.','err'); }
};
window.recuperarSenha = async (slug)=>{
  // Le o email do campo ja preenchido na tela de login; evita prompt() nativo
  const inputEl = document.getElementById('loginEmail');
  const email = (inputEl?.value || '').trim();
  if(!email){
    toast('Preencha seu e-mail no campo acima antes de recuperar a senha.','err',4000);
    inputEl?.focus();
    return;
  }
  const redirectTo = urlPrincipal('/login');
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
  if(error){ toast('Erro ao enviar. Tente novamente.','err'); return; }
  toast('Se o e-mail estiver cadastrado, você receberá um link em breve.','ok',5000);
};

// Salva marcacao no banco diretamente pelo supabaseClient
async function agMarkFetch(body){
  try {
    if(body.ag_id && body.campo){
      await supabaseClient.from('agendamentos').update({ [body.campo]: true }).eq('id', body.ag_id);
    } else if(body.cliente_id && body.campo){
      const valor = body.reset ? null : new Date().toISOString();
      await supabaseClient.from('clientes').update({ [body.campo]: valor }).eq('id', body.cliente_id);
    }
  } catch(_){}
}

