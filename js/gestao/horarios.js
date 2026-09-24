// Gestao — Configurar > Horarios de agendamento.


// Handlers chamados pelos onclick do HTML. Registrados a cada renderGestao().
function _registrarHandlersHorarios(){
  window.abrirInputHorario = (dia)=>{
    const row = document.getElementById('hi-row-'+dia);
    const btn = document.getElementById('btn-add-'+dia);
    if(!row) return;
    row.style.display = 'flex';
    if(btn) btn.style.display = 'none';
    const inp = document.getElementById('hi-'+dia);
    if(inp){ inp.value = ''; inp.focus(); }
  };
  window.fecharInputHorario = (dia)=>{
    const row = document.getElementById('hi-row-'+dia);
    const btn = document.getElementById('btn-add-'+dia);
    if(row) row.style.display = 'none';
    if(btn) btn.style.display = '';
  };
  window.mascaraHorario = (el)=>{
    let v = el.value.replace(/\D/g,'');
    if(v.length > 4) v = v.slice(0,4);
    if(v.length >= 3) v = v.slice(0,2) + ':' + v.slice(2);
    el.value = v;
  };
  window.adicionarHorario = async (dia)=>{
    const el = document.getElementById('hi-'+dia);
    const raw = el ? el.value.trim() : '';
    const val = raw.length === 4 && !raw.includes(':') ? raw.slice(0,2)+':'+raw.slice(2) : raw;
    const horaValida = /^([01]\d|2[0-3]):([0-5]\d)$/.test(val);
    if(!horaValida){ toast('Horário inválido. Use o formato HH:MM.','err'); return; }
    emp.horariosPorMes = emp.horariosPorMes || {};
    const key = '_d' + dia + '_';
    // Se ainda nao existe chave pro dia, herda _uni_ como base
    if(!emp.horariosPorMes[key]){
      emp.horariosPorMes[key] = [...(emp.horariosPorMes['_uni_'] || [])];
    }
    const lista = emp.horariosPorMes[key];
    if(lista.includes(val)){ return; }
    const { error } = await supabaseClient.from('horarios_disponiveis').insert({
      empresa_id: emp.id, mes: key, hora: val
    });
    if(error){ toast(friendlyError(error,'Erro ao adicionar horário. Tente novamente.'),'err'); return; }
    lista.push(val);
    emp.horariosPorMes[key] = lista;
    draw();
    // reabre o card no estado correto (sem input visivel)
  };
  window.removerHorario = async (h, dia)=>{
    emp.horariosPorMes = emp.horariosPorMes || {};
    const key = '_d' + dia + '_';
    // Se nao existe chave pro dia, cria com base em _uni_ antes de remover
    if(!emp.horariosPorMes[key]){
      const base = [...(emp.horariosPorMes['_uni_'] || [])];
      if(base.length){
        const { error: errBase } = await supabaseClient.from('horarios_disponiveis')
          .insert(base.map(slot => ({ empresa_id: emp.id, mes: key, hora: slot })));
        if(errBase){ toast(friendlyError(errBase,'Erro ao remover horário. Tente novamente.'),'err'); return; }
      }
      emp.horariosPorMes[key] = base;
    }
    const { error } = await supabaseClient.from('horarios_disponiveis')
      .delete().eq('empresa_id', emp.id).eq('mes', key).eq('hora', h);
    if(error){ toast(friendlyError(error,'Erro ao remover horário. Tente novamente.'),'err'); return; }
    emp.horariosPorMes[key] = (emp.horariosPorMes[key]||[]).filter(x=>x!==h);
    draw();
  };
  window.toggleDiaSemana = async (dia)=>{
    emp.horariosPorMes = emp.horariosPorMes || {};
    const atual = (emp.horariosPorMes['_dias_'] || []).map(Number);
    let novos;
    if(!('_dias_' in emp.horariosPorMes)){
      // empresa nunca configurou dias: assume todos ativos e remove o clicado
      novos = [0,1,2,3,4,5,6].filter(d=>d!==dia);
    } else {
      // empresa ja configurou: toggle normal (adiciona ou remove o dia clicado)
      novos = atual.includes(dia) ? atual.filter(d=>d!==dia) : [...atual, dia].sort();
    }

    // Abordagem diff: nunca apaga tudo de uma vez
    // 1. Insere apenas os dias que entraram (não estavam em atual)
    const paraInserir = novos.filter(d => !atual.includes(d));
    if(paraInserir.length){
      const rows = paraInserir.map(d => ({ empresa_id: emp.id, mes: '_dias_', hora: String(d) }));
      const { error: insErr } = await supabaseClient.from('horarios_disponiveis').insert(rows);
      if(insErr){ toast(friendlyError(insErr,'Erro ao salvar dias. Tente novamente.'),'err'); return; }
    }

    // 2. Remove apenas os dias que saíram (não apaga o restante)
    // Se este passo falhar, os dias novos já foram inseridos e o banco fica consistente
    const paraRemover = atual.filter(d => !novos.includes(d));
    if(paraRemover.length){
      const { error: delErr } = await supabaseClient.from('horarios_disponiveis')
        .delete().eq('empresa_id', emp.id).eq('mes', '_dias_')
        .in('hora', paraRemover.map(String));
      if(delErr){ toast(friendlyError(delErr,'Erro ao salvar dias. Tente novamente.'),'err'); return; }
    }

    emp.horariosPorMes['_dias_'] = novos.map(String);
    draw();
  };
}
