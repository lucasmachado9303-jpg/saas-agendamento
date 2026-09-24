// Gestao — Personalizar pagina: dados, imagens, cor (roda), botoes.


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

    // Arrastar funciona so com mouse; no celular a ordem muda pelas setas ▲ ▼
    const _BTN_SETA = 'width:32px;height:32px;min-height:0;border-radius:8px;border:1px solid var(--line);background:#fff;color:#555;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:inherit;';
    const botoesHtml = botoesSorted.length ? `<div id="botoes-drag-list">${botoesSorted.map((b, i) => `
      <div data-id="${b.id}" draggable="true"
        style="display:flex;flex-direction:column;gap:10px;padding:14px 16px;margin-bottom:8px;border-radius:12px;border:1.5px solid var(--line);background:var(--card);cursor:default;transition:opacity .15s;overflow:hidden;"
        ondragstart="dragBotaoStart(event,'${b.id}')"
        ondragover="dragBotaoOver(event)"
        ondrop="dragBotaoDrop(event,'${b.id}')"
        ondragend="dragBotaoEnd(event)">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
          <div style="color:#bbb;font-size:14px;cursor:grab;padding:0 4px;line-height:1;flex-shrink:0;letter-spacing:1px;" title="Arraste para reordenar">::</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:14px;">${escapeHtml(b.nome)}</div>
            <div class="muted" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(b.link)}</div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0;">
            <button type="button" aria-label="Subir" title="Subir" onclick="moverBotao('${b.id}',-1)" ${i===0?'disabled':''} style="${_BTN_SETA}${i===0?'opacity:.35;cursor:default;':''}">&#9650;</button>
            <button type="button" aria-label="Descer" title="Descer" onclick="moverBotao('${b.id}',1)" ${i===botoesSorted.length-1?'disabled':''} style="${_BTN_SETA}${i===botoesSorted.length-1?'opacity:.35;cursor:default;':''}">&#9660;</button>
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

  function preservarCamposPersonalizar(){
    // Garante que valores digitados no formulário de personalizar
    // não sejam perdidos quando draw() é chamado por outra razão
    if(configurarSub !== 'personalizar') return;
    const _nome = document.getElementById('pNome')?.value;          if(_nome != null) emp.nome = _nome || emp.nome;
    const _desc = document.getElementById('pDescricao')?.value;     if(_desc != null) emp.descricao = _desc;
    const _dest = document.getElementById('pTextoDestaque')?.value; if(_dest != null) emp.textoDestaque = _dest;
    // (o texto do botao de agendamento nao era preservado e sumia ao abrir o formulario de botao)
    const _agd  = document.getElementById('pTextoAgendar');         if(_agd && _agd.type !== 'hidden') emp.textoAgendar = _agd.value;
    const _cor  = document.getElementById('pCor')?.value;           if(_cor)          emp.corPrincipal = sanitizeCor(_cor);
  }

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

  function validarConverterWhatsapp(val){
    let d = val.replace(/\D/g,'');
    if(d.startsWith('55') && d.length > 11) d = d.slice(2);
    if(d.startsWith('0')) d = d.slice(1);
    if(d.length !== 11 || d[2] !== '9') return null;
    return 'https://wa.me/55' + d;
  }

// Handlers chamados pelos onclick do HTML. Registrados a cada renderGestao().
function _registrarHandlersPersonalizar(){
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
  window.toggleCorPicker = ()=>{
    const sliders  = document.getElementById('pCorSliders');
    const chevron  = document.getElementById('pCorChevron');
    if(!sliders) return;
    const aberto = sliders.style.display !== 'none';
    sliders.style.display  = aberto ? 'none' : 'block';
    if(chevron) chevron.style.transform = aberto ? '' : 'rotate(180deg)';
    if(!aberto) _initRodaCores();
  };
  window.rodaBrilhoChange = ()=>{
    const brilho = document.getElementById('pCorBrilho');
    if(!brilho) return;
    _rodaV = parseInt(brilho.value);
    _atualizarCorRoda();
  };
  window.salvarSlugEmpresa = async ()=>{
    const novoSlug = (document.getElementById('pSlug')?.value || '').trim();
    if(!novoSlug){ toast('Preencha o link.','err'); return; }
    if(novoSlug === emp.slug){ toast('Link não alterado.','ok'); return; }
    // Mesmo formato exigido no painel master: letras minusculas, numeros e hifens (sem hifen nas pontas)
    if(!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(novoSlug) || novoSlug.length > 63){
      toast('Link inválido. Use letras minúsculas, números e hífens (sem hífen no começo ou no fim).','err'); return;
    }
    // #40: lista unificada de slugs reservados (igual em todos os lugares do sistema)
    const _slugsReservados = ['api','app','admin','master','login','logout','auth','static','assets','sw','manifest','index','null','undefined','favicon','www','mail','suporte','ajuda','cdn','blog','help','cadastro'];
    if(_slugsReservados.includes(novoSlug)){ toast('Este link não pode ser usado. Escolha outro.','err'); return; }
    confirmarAcao(`Alterar o link para <strong>${escapeHtml(novoSlug)}.agenplus.com.br</strong>? O endereço antigo vai parar de funcionar.`, async ()=>{
      const { error } = await supabaseClient.from('empresas').update({ slug: novoSlug }).eq('id', emp.id);
      if(error){ toast((error.message||'').includes('unique')||error.code==='23505' ? 'Este link já está em uso.' : 'Erro ao salvar. Tente novamente.','err'); return; }
      const oldSlug = emp.slug;
      emp.slug = novoSlug;
      agendamentos.forEach(a => { if(a.slug === oldSlug) a.slug = novoSlug; });
      toast('Link atualizado!','ok');
      // Se a gestao esta aberta no subdominio antigo, ele deixou de existir: leva para o novo
      // endereco levando a sessao junto (cada subdominio guarda o login separado).
      if(slugDoSubdominio() === oldSlug){
        const { data: { session } } = await supabaseClient.auth.getSession();
        if(session){
          const hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer&type=bearer`;
          location.replace(urlEmpresa(novoSlug, `/gestao#${hash}`));
          return;
        }
      }
      currentRoute = { ...currentRoute, empresa: novoSlug };
      draw();
    });
  };
  window.marcarPersonalizarDirty = ()=>{
    if(personalizarDirty) return;
    personalizarDirty = true;
    const saveWrap = document.getElementById('pers-save-wrap');
    const dirtyBanner = document.getElementById('pers-dirty-banner');
    if(saveWrap) saveWrap.style.display = 'none';
    if(dirtyBanner) dirtyBanner.style.display = 'block';
  };
  // Sair sem salvar desfaz o que foi digitado: draw() copia os campos para "emp" (preservarCamposPersonalizar),
  // entao sem restaurar a copia, as alteracoes nao salvas continuavam valendo na memoria.
  function _restaurarPersonalizar(){
    if(_personalizarOriginal) Object.assign(emp, _personalizarOriginal);
    configurarSub = null; // evita que o draw() de configurarIr copie os campos de novo
  }
  window.voltarDePersonalizar = ()=>{ _restaurarPersonalizar(); personalizarDirty=false; configurarIr(null); };
  window.descartarPersonalizar = ()=>{ _restaurarPersonalizar(); personalizarDirty=false; configurarIr(null); };

  // ── PERSONALIZAR PÁGINA ──────────────────────────────────

  window.salvarInfoEmpresa = async ()=>{
    emp.nome               = document.getElementById('pNome').value.trim() || emp.nome;
    emp.descricao          = document.getElementById('pDescricao').value.trim();
    emp.textoDestaque      = document.getElementById('pTextoDestaque').value.trim();
    emp.textoAgendar       = document.getElementById('pTextoAgendar').value.trim();
    emp.corPrincipal       = sanitizeCor(document.getElementById('pCor').value);
    const { error } = await supabaseClient.from('empresas').update({
      nome:                  emp.nome,
      descricao:             emp.descricao             || null,
      cor_principal:         emp.corPrincipal,
      texto_destaque:        emp.textoDestaque         || null,
      texto_agendar:         emp.textoAgendar          || null,
    }).eq('id', emp.id);
    if(error){ console.error('Erro ao salvar informações:', error); toast('Erro ao salvar. Tente novamente.','err'); return; }
    personalizarDirty = false;
    _personalizarOriginal = { nome:emp.nome, descricao:emp.descricao, textoDestaque:emp.textoDestaque, textoAgendar:emp.textoAgendar, corPrincipal:emp.corPrincipal };
    toast('Informações salvas!','ok');
    draw();
  };
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
    Object.assign(existingB, { nome, tipo, link, icone: '', abrirNovaAba: true, cor: corHexSegura(corBotao) });
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
      icone:row.icone, ordem:row.ordem, ativo:row.ativo, abrirNovaAba:row.abrir_nova_aba, cor:corHexSegura(row.cor) });
    emp.botoes.sort((a,b)=>a.ordem-b.ordem);
    novoBotaoState = null;
    draw();
  };

  window.removerBotao = (id)=>{
    confirmarAcao('Remover este botão?', async ()=>{
      const { error } = await supabaseClient.from('botoes_empresa').delete().eq('id', id);
      if(error){ toast(friendlyError(error,'Erro ao remover botão. Tente novamente.'),'err'); return; }
      emp.botoes = emp.botoes.filter(b=>b.id!==id);
      draw();
    });
  };
  // Grava a ordem atual dos botoes (usado pelo arrastar e pelas setas)
  async function _salvarOrdemBotoes(){
    emp.botoes.forEach((b, i) => b.ordem = i);
    const resultados = await Promise.all(emp.botoes.map(b =>
      supabaseClient.from('botoes_empresa').update({ ordem: b.ordem }).eq('id', b.id)
    ));
    if(resultados.some(r => r.error)) toast('Não foi possível salvar a nova ordem. Tente novamente.','err');
    draw();
  }
  window.moverBotao = async (id, dir)=>{
    emp.botoes.sort((a,b)=>a.ordem-b.ordem);
    const i = emp.botoes.findIndex(b=>b.id===id);
    const j = i + dir;
    if(i < 0 || j < 0 || j >= emp.botoes.length) return;
    [emp.botoes[i], emp.botoes[j]] = [emp.botoes[j], emp.botoes[i]];
    await _salvarOrdemBotoes();
  };
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
    _dragFromId = null;
    await _salvarOrdemBotoes();
  };
}
