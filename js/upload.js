// ── UPLOAD DE IMAGENS ────────────────────────────────────────
let _cropInstance = null;
let _cropCallback = null;
let _cropTipo = null;
let _cropSlug = null;

function validarArquivo(file){
  const tipos = ['image/jpeg','image/png','image/webp'];
  if(!tipos.includes(file.type)) return 'Formato inválido. Use JPG, PNG ou WEBP.';
  if(file.size > 5 * 1024 * 1024) return 'Arquivo muito grande. Máximo 5 MB.';
  return null;
}

function _carregarCropper(){
  return new Promise((resolve, reject)=>{
    if(window.Cropper) return resolve();
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
    css.integrity = 'sha384-6LFfkTKLRlzFtgx8xsWyBdKGpcMMQTkv+dB7rAbugeJAu1Ym2q1Aji1cjHBG12Xh';
    css.crossOrigin = 'anonymous';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
    js.integrity = 'sha384-jrOgQzBlDeUNdmQn3rUt/PZD+pdcRBdWd/HWRqRo+n2OR2QtGyjSaJC0GiCeH+ir';
    js.crossOrigin = 'anonymous';
    js.onload = resolve;
    js.onerror = () => reject(new Error('Falha ao carregar editor de imagem.'));
    document.head.appendChild(js);
  });
}
function abrirCrop(tipo, slug, callback){
  _cropTipo = tipo; _cropSlug = slug; _cropCallback = callback;
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp';
  input.onchange = async (ev)=>{
    const file = ev.target.files[0]; if(!file) return;
    const err = validarArquivo(file); if(err){ toast(err,'err'); return; }
    try{ await _carregarCropper(); }catch(_){ toast('Não foi possível carregar o editor de imagem. Verifique sua conexão e tente novamente.','err'); return; }
    const reader = new FileReader();
    reader.onload = (e)=>{
      const modal = document.getElementById('cropModal');
      const img   = document.getElementById('cropImg');
      img.src = e.target.result;
      modal.style.display = 'flex';
      if(_cropInstance){ _cropInstance.destroy(); _cropInstance = null; }
      const ratio = tipo==='logo' ? 1 : 16/9;
      _cropInstance = new Cropper(img, { aspectRatio: ratio, viewMode: 1, autoCropArea: 0.9, movable: true, zoomable: true, rotatable: false, scalable: false });
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

async function confirmarCrop(){
  if(!_cropInstance) return;
  const btn = document.getElementById('btnConfirmarCrop');
  btn.disabled = true; btn.textContent = 'Enviando...';
  const isLogo = _cropTipo === 'logo';
  const w = isLogo ? 540 : 1280, h = isLogo ? 540 : 720;
  const canvas = _cropInstance.getCroppedCanvas({ width: w, height: h, imageSmoothingQuality: 'high' });
  canvas.toBlob(async (blob)=>{
    if(!blob){ toast('Nao foi possivel processar a imagem. Tente novamente.','err'); btn.disabled=false; btn.textContent='Confirmar recorte'; return; }
    const bucket = isLogo ? 'logos' : 'backgrounds';
    const path   = `${_cropSlug}/${isLogo ? 'logo' : 'background'}.jpg`;
    const { error: upErr } = await supabaseClient.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if(upErr){ toast('Erro ao enviar imagem. Tente novamente.','err'); btn.disabled=false; btn.textContent='Confirmar recorte'; return; }
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    const url = data.publicUrl + '?t=' + Date.now();
    const col = isLogo ? 'logo' : 'foto_url';
    const emp = empresas.find(x=>x.slug===_cropSlug);
    if(emp && emp.id){
      const { error: updErr } = await supabaseClient.from('empresas').update({ [col]: url }).eq('id', emp.id);
      if(updErr){
        toast('Imagem enviada, mas não foi possível salvar no cadastro. Tente novamente.','err');
        btn.disabled=false; btn.textContent='Confirmar recorte';
        return;
      }
    }
    const cb = _cropCallback;
    fecharCrop();
    if(cb) cb(url);
  }, 'image/jpeg', 0.80);
}

function cancelarCrop(){ fecharCrop(); }

function fecharCrop(){
  document.getElementById('cropModal').style.display = 'none';
  if(_cropInstance){ _cropInstance.destroy(); _cropInstance = null; }
  const btn = document.getElementById('btnConfirmarCrop');
  btn.disabled = false; btn.textContent = 'Confirmar recorte';
  _cropCallback = null; _cropTipo = null; _cropSlug = null;
}

async function excluirImagensEmpresa(slug){
  await supabaseClient.storage.from('logos').remove([`${slug}/logo.jpg`]);
  await supabaseClient.storage.from('backgrounds').remove([`${slug}/background.jpg`]);
}
