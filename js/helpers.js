// ─────────────────────────────────────────────────────────────

// Modal de confirmacao customizado — substitui confirm() nativo que pode ser bloqueado
function confirmarAcao(msg, onConfirm){
  let ov = document.getElementById('_confOverlay');
  if(ov) ov.remove();
  ov = document.createElement('div');
  ov.id = '_confOverlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  ov.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:24px 20px;max-width:340px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.18);">
      <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:8px;">Confirmar</div>
      <div style="font-size:14px;color:#555;margin-bottom:20px;line-height:1.5;">${msg}</div>
      <div style="display:flex;gap:8px;">
        <button id="_confCancel" style="flex:1;height:40px;border:1.5px solid #e5e5ea;border-radius:10px;background:#fff;font-size:14px;font-weight:600;color:#555;cursor:pointer;font-family:inherit;">Cancelar</button>
        <button id="_confOk" style="flex:1;height:40px;border:none;border-radius:10px;background:#dc2626;font-size:14px;font-weight:700;color:#fff;cursor:pointer;font-family:inherit;">Confirmar</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const fecharOv = () => ov.remove();
  document.getElementById('_confCancel').onclick = fecharOv;
  ov.onclick = (ev) => { if(ev.target === ov) fecharOv(); };
  document.getElementById('_confOk').onclick = () => { fecharOv(); onConfirm(); };
}

function escapeHtml(s){ return String(s==null?"":s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// Alias intencional: escapeAttr usa a mesma logica de escapeHtml para valores em atributos HTML entre aspas duplas
function escapeAttr(s){ return escapeHtml(s); }
// Aceita #rgb ou #rrggbb e devolve sempre #rrggbb: o resto da interface concatena
// transparencia (cor+'80') e calcula contraste assumindo 6 digitos.
function sanitizeCor(c){
  const s = String(c || '');
  if(/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if(/^#[0-9a-fA-F]{3}$/.test(s)) return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  return '#3d1f3a';
}

// Bloqueia links do tipo "javascript:" salvos nos botões da empresa,
// que executariam código na página pública.
function linkSeguro(url){
  const u = String(url||"").trim();
  return /^(https?:|tel:|mailto:)/i.test(u) ? u : '#';
}
// Baixa um arquivo gerado no navegador. O link precisa estar no documento (Firefox) e a URL
// so e liberada depois do clique ser processado (revogar na hora cancela o download no Safari).
function baixarArquivo(conteudo, nome, tipo){
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
function checkCapsLock(e, id){ const el=document.getElementById(id); if(el) el.style.display=e.getModifierState('CapsLock')?'flex':'none'; }
function applyAccent(cor){ document.documentElement.style.setProperty('--accent', cor || '#3d1f3a'); setFavicon(false); }

