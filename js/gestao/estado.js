// Estado do painel de gestao, compartilhado pelos arquivos js/gestao/*.js.
// Os valores iniciais sao definidos a cada abertura em renderGestao() (nucleo.js).
let emp;
let corner;
let diaSelecionado;
let editandoId;
let novoAgState;
let configurarSub; // null | 'servicos' | 'horarios' | 'personalizar' | 'mensagens'
let _waMenuId; // id do agendamento com dropdown WA aberto
let _inativoWaMenuId; // id do cliente inativo com dropdown WA aberto
let _rodaH, _rodaS, _rodaV; // estado da roda de cores (HSV)
let personalizarDirty;
let novoBotaoState;
let editandoBotaoId;
let _removendoServicoIdx;
let _editandoServicoIdx;
let _novoServicoForm;
let _gFinPeriodo; // 'dia' | 'mes'
let _gFinData; // ISO date para dia, 'YYYY-MM' para mes
let _gFinLancamentos; // registros de lancamentos_financeiros
let _gFinModal; // { tipo, agId?, descricao, valor, editId? }
let _gFinFiltro; // 'todos' | 'entradas' | 'saidas'
let _gFinAgLancados; // IDs de agendamentos já lançados — reconstruído do banco em cada chamada de gFinCarregar()
let _finalizarAgId; // ID do agendamento com modal "Finalizar" aberto
let _finalizarAcao; // null = etapa 1 (escolha) | 'atendido' = etapa 2 (valor)
let _novoAgModalOpen; // modal de novo agendamento aberto
let _relAba; // null = menu | 'financeiro' | 'agendamentos' | 'clientes' | 'servicos'
let _relMes; // YYYY-MM
let _clientes;
let _clientesBusca;
let _clientesCarregando;
let _clienteModalNovo;
let _novoAgClienteId; // cliente selecionado no formulário de novo agendamento
let _novoAgClienteBusca;
let _novoAgClienteResultados;
let _clientePerfilId;
let _clientePerfilEditando;
let _excluirClienteModal; // id do cliente aguardando confirmação de exclusão
let _clientesAba; // 'todos' | 'ausentes'
let _clientesInativosFiltro; // faixa selecionada: 15 | 30 | 45 (compartilhada com o dashboard)
let _clientesBannerDismissed;
let _notas; // registros da tabela notas
let _notaModal; // { texto, cor }
let _novoAgCriarCliente;
let _novoAgServicos; // ids dos servicos selecionados no modal manual
let _rodaWinListeners;
let _dragFromId;
let _personalizarOriginal; // copia dos campos ao entrar em Personalizar (para "Descartar" desfazer de verdade)
// Contadores de requisicao: so a resposta mais recente e aplicada (nao precisam ser reiniciados)
let _notasSeq = 0;
let _gFinSeq = 0;
let _clientesSeq = 0;
