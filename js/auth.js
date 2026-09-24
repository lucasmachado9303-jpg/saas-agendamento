// Conversao do cadastro: o Google Analytics e o Meta Pixel so existem na landing (index.html),
// entao sao carregados aqui, SO na tela de cadastro (nunca nas paginas publicas das empresas).
function _carregarRastreamentoCadastro(){
  if(window.__rastreamentoCadastro || _ehLocal) return; // testes locais nao poluem as metricas
  window.__rastreamentoCadastro = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-KKBBZE9GCL');
  const ga = document.createElement('script');
  ga.async = true;
  ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-KKBBZE9GCL';
  document.head.appendChild(ga);
  // Meta Pixel (mesmo codigo da landing)
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  window.fbq('init', '1430461599137461');
  window.fbq('track', 'PageView');
}

// ---------- LOGIN UNIFICADO ----------
function renderCadastro(){
  applyAccent('#1c1917');
  _carregarRastreamentoCadastro();
  render(`
    <div style="min-height:100vh;background:#0A0A09;padding:0 20px 16px;">
      <div style="width:100%;max-width:400px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:0;">
          <img src="/logoagen+.png" alt="agen+" width="160" height="160" fetchpriority="high" style="height:160px;width:auto;margin-top:-30px;"/>
        </div>
        <div class="card" style="margin-top:-30px;">
          <h2 class="display" style="margin-bottom:20px;">Criar conta</h2>
          <div class="field" style="margin-top:20px;">
            <label style="color:#c7c7cc;">Nome da empresa</label>
            <input id="cad-nome" placeholder="Ex: Studio Bella" autocomplete="organization" style="border-color:#e5e5ea;color:#8e8e93;"
              onkeyup="if(event.key==='Enter') document.getElementById('cad-email').focus()"/>
          </div>
          <div class="field">
            <label style="color:#c7c7cc;">WhatsApp</label>
            <input id="cad-whats" type="tel" inputmode="numeric" maxlength="16" placeholder="(xx) xxxxx-xxxx" style="border-color:#e5e5ea;color:#8e8e93;"
              onkeydown="if(event.key.length===1&&!/[0-9]/.test(event.key))event.preventDefault()"
              oninput="maskTel(this)"/>
          </div>
          <div class="field">
            <label style="color:#c7c7cc;">E-mail</label>
            <input id="cad-email" type="email" placeholder="seu@email.com" autocomplete="email" style="border-color:#e5e5ea;color:#8e8e93;"
              onkeyup="if(event.key==='Enter') document.getElementById('cad-senha').focus()"/>
          </div>
          <div class="field">
            <label style="color:#c7c7cc;">Senha</label>
            <input id="cad-senha" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password" style="border-color:#e5e5ea;color:#8e8e93;"
              onkeyup="if(event.key==='Enter') tentarCadastro()"/>
          </div>
          <button class="btn ghost" style="width:100%;color:#8e8e93;border-color:#e5e5ea;" onclick="tentarCadastro()">Criar conta</button>
          <div style="text-align:center;margin-top:12px;">
            <a href="/login" style="font-size:12px;color:#c7c7cc;text-decoration:none;">Já tem conta? Entrar</a>
          </div>
        </div>
      </div>
    </div>
  `);
}

window.tentarCadastro = async ()=>{
  const nome  = (document.getElementById('cad-nome')?.value  || '').trim();
  const whats = (document.getElementById('cad-whats')?.value || '').trim();
  const email = (document.getElementById('cad-email')?.value || '').trim();
  const senha = (document.getElementById('cad-senha')?.value || '');

  if(!nome)  { toast('Digite o nome da empresa.','err'); return; }
  if(!email) { toast('Digite seu e-mail.','err'); return; }
  if(senha.length < 6){ toast('A senha deve ter pelo menos 6 caracteres.','err'); return; }

  if(whats){
    let wd = whats.replace(/\D/g,'');
    if(wd.startsWith('55') && wd.length > 11) wd = wd.slice(2);
    if(wd.startsWith('0')) wd = wd.slice(1);
    if(wd.length < 10 || wd.length > 11){ toast('WhatsApp inválido. Use o formato (xx) xxxxx-xxxx.','err'); return; }
  }

  const btn = document.querySelector('.card .btn');
  if(btn){ btn.disabled = true; btn.textContent = 'Criando conta...'; }

  render(`<div class="loading-wrap"><div class="spinner spinner-dark" style="width:28px;height:28px;"></div><div>Criando sua conta...</div></div>`);

  let resp, result;
  try {
    resp = await fetch('/api/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome_empresa: nome, email, password: senha, whatsapp: whats })
    });
    result = await resp.json();
  } catch(e) {
    toast(mensagemErroRede(e),'err',8000);
    renderCadastro(); return;
  }

  if(!resp.ok){
    toast(result.error || 'Erro ao criar conta.','err',6000);
    renderCadastro(); return;
  }

  // Faz login com as credenciais recem criadas
  const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
  if(loginError || !loginData?.session){
    toast('Conta criada! Faça login para continuar.','ok',5000);
    renderLoginUnificado(); return;
  }

  const session = loginData.session;
  const hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer&type=bearer`;
  // Dispara eventos de conversao e da um instante para eles saírem antes de trocar de pagina
  try{ if(typeof window.fbq==='function') window.fbq('track','Lead'); }catch(e){}
  try{ if(typeof window.gtag==='function') window.gtag('event','sign_up',{method:'email', transport_type:'beacon'}); }catch(e){}
  setTimeout(()=>location.replace(urlEmpresa(result.slug, `/gestao#${hash}`)), 400);
};

function renderLoginUnificado(){
  setFavicon(false);
  applyAccent('#1c1917');
  render(`
    <div style="min-height:100vh;background:#0A0A09;padding:0 20px 16px;">
      <div style="width:100%;max-width:400px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:0;">
          <img src="/logoagen+.png" alt="agen+" width="160" height="160" fetchpriority="high" style="height:160px;width:auto;margin-top:-30px;"/>
        </div>
        <div class="card" style="margin-top:-30px;">
          <h2 class="display" style="margin-bottom:20px;">Entrar</h2>
          <button onclick="loginComGoogle(null)" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#fff;border:1.5px solid #e5e5ea;border-radius:10px;padding:13px 16px;font-size:15px;font-weight:600;color:#1a1a1a;cursor:pointer;font-family:inherit;box-shadow:0 1px 4px rgba(0,0,0,.08);">
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.58-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
            Entrar com Google
          </button>
          <div style="display:flex;align-items:center;gap:10px;margin:20px 0 4px;">
            <div style="flex:1;height:1px;background:#e5e5ea;"></div>
            <span style="font-size:11px;color:#6b7280;white-space:nowrap;">ou use email e senha</span>
            <div style="flex:1;height:1px;background:#e5e5ea;"></div>
          </div>
          <div class="field" style="margin-top:12px;">
            <label style="color:#374151;">E-mail</label>
            <input type="email" id="loginEmail" placeholder="seu@email.com" style="border-color:#e5e5ea;color:#1a1a1a;"
              onkeyup="if(event.key==='Enter') document.getElementById('loginSenha').focus()"/>
          </div>
          <div class="field">
            <label style="color:#374151;">Senha</label>
            <input type="password" id="loginSenha" placeholder="Sua senha" style="border-color:#e5e5ea;color:#1a1a1a;"
              onkeyup="checkCapsLock(event,'cLU'); if(event.key==='Enter') tentarLoginUnificado()"/>
            <div id="cLU" style="display:none;align-items:center;gap:5px;color:var(--danger);font-size:12px;margin-top:6px;"><strong>!</strong> Caps Lock ativado</div>
          </div>
          <button class="btn ghost" style="width:100%;color:#374151;border-color:#e5e5ea;" onclick="tentarLoginUnificado()">Entrar com email</button>
          <div style="text-align:center;margin-top:12px;">
            <button class="icon-btn" style="color:#6b7280;font-size:12px;" onclick="recuperarSenha(null)">Esqueci minha senha</button>
          </div>
        </div>
      </div>
    </div>
  `);
}
window.tentarLoginUnificado = async ()=>{
  const email = (document.getElementById('loginEmail').value || '').trim();
  const senha = document.getElementById('loginSenha').value;
  if(!email || !senha){ toast('Preencha e-mail e senha.','err'); return; }

  const btn = document.querySelector('button[onclick="tentarLoginUnificado()"]');
  if(btn){ btn.disabled = true; btn.textContent = 'Entrando...'; }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
  if(error && btn){ btn.disabled = false; btn.textContent = 'Entrar com email'; }
  if(error){ toast('E-mail ou senha incorretos.','err'); return; }

  const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', data.user.id).single();
  if(!profile || profile.status !== 'ativo'){
    await supabaseClient.auth.signOut();
    toast('Conta bloqueada. Entre em contato com o administrador.','err');
    return;
  }

  currentUser    = data.user;
  currentProfile = profile;

  try {
    await loadData();
  } catch(e) {
    if(btn){ btn.disabled = false; btn.textContent = 'Entrar com email'; }
    toast(mensagemErroRede(e),'err');
    return;
  }

  if(profile.role === 'master'){
    location.replace('/master');
  } else if(profile.role === 'owner_empresa'){
    const emp = empresas.find(e => e.id === profile.empresa_id);
    if(emp){
      const subAtual = slugDoSubdominio();
      if(subAtual === emp.slug){
        // ja esta no subdominio correto — roteia direto sem recarregar
        goto({ empresa: emp.slug, page: 'gestao' });
      } else {
        // vem do dominio principal — precisa do redirect cross-domain com tokens
        try {
          const { data: { session } } = await supabaseClient.auth.getSession();
          const hash = `access_token=${session.access_token}&refresh_token=${session.refresh_token}&token_type=bearer&type=bearer`;
          location.replace(urlEmpresa(emp.slug, `/gestao#${hash}`));
        } catch(e) {
          if(btn){ btn.disabled = false; btn.textContent = 'Entrar com email'; }
          toast('Erro ao redirecionar. Tente novamente.','err');
        }
      }
    } else {
      if(btn){ btn.disabled = false; btn.textContent = 'Entrar com email'; }
      toast('Empresa não encontrada.','err');
    }
  } else {
    if(btn){ btn.disabled = false; btn.textContent = 'Entrar com email'; }
    toast('Acesso não autorizado.','err');
  }
};

// ---------- TELA: REDEFINIR SENHA ----------
function renderRedefinirSenha(){
  applyAccent('#1c1917');
  render(`
    <div class="container">
      <div class="card">
        <div class="eyebrow" style="color:#1a1a1a;">Redefinição de senha</div>
        <h2 class="display">Nova senha</h2>
        <div class="field">
          <label>Nova senha</label>
          <input type="password" id="novaSenhaReset" placeholder="Mínimo 6 caracteres"
            onkeyup="if(event.key==='Enter') document.getElementById('confirmarSenhaReset').focus()"/>
        </div>
        <div class="field">
          <label>Confirmar nova senha</label>
          <input type="password" id="confirmarSenhaReset" placeholder="Repita a senha"
            onkeyup="if(event.key==='Enter') confirmarRedefinicaoSenha()"/>
        </div>
        <button class="btn" style="width:100%;background:#1c1917;" onclick="confirmarRedefinicaoSenha()">Salvar nova senha</button>
      </div>
    </div>
  `);
}
window.confirmarRedefinicaoSenha = async ()=>{
  const nova = document.getElementById('novaSenhaReset').value;
  const conf = document.getElementById('confirmarSenhaReset').value;
  if(nova.length < 6){ toast('A senha deve ter pelo menos 6 caracteres.','err'); return; }
  if(nova !== conf){ toast('As senhas não coincidem.','err'); return; }
  const { error } = await supabaseClient.auth.updateUser({ password: nova });
  if(error){ toast('Erro ao redefinir senha. Tente novamente.','err'); return; }
  toast('Senha redefinida! Você já pode fazer login.','ok',5000);
  currentUser = null; currentProfile = null; modoRecuperacao = false;
  await supabaseClient.auth.signOut();
  goto({master:1});
};

