-- ============================================================
-- Agen+ — CORRECOES DA AUDITORIA (setembro/2026)
--
-- Execute o arquivo INTEIRO no SQL Editor do Supabase.
-- E seguro rodar mais de uma vez.
--
-- O que ele corrige:
--   1. O gestor conseguia mudar pelo navegador o proprio status,
--      bloqueio, data do trial e tipo de conta (e assim nunca pagar).
--   2. Campos que aparecem na tela (link, cor dos botoes, horarios)
--      aceitavam qualquer texto, inclusive codigo malicioso.
--   3. Um horario cancelado continuava ocupado para sempre: a pagina
--      publica o mostrava como reservado e o banco recusava nova reserva.
--
-- ANTES (opcional, so leitura) — rode uma por vez para ver o estado atual:
--   select policyname, cmd, qual from pg_policies where tablename = 'empresas';
--   select pg_get_viewdef('horarios_ocupados'::regclass, true);
--   select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'agendamentos'::regclass;
--   select slug from empresas where slug !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$';   -- links fora do padrao
-- ============================================================


-- ------------------------------------------------------------
-- PARTE 1 — Gestor nao altera status, bloqueio, trial nem tipo
--
-- A regra de acesso deixa o dono atualizar a propria empresa (nome, textos,
-- cor, logo...). Este gatilho impede que ele mude os campos de cobranca.
-- Master, as APIs (service_role) e o SQL Editor continuam podendo tudo.
-- ------------------------------------------------------------

create or replace function empresas_protege_colunas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sem usuario logado (APIs com service_role, SQL Editor) ou master: pode tudo
  if auth.uid() is null or is_master() then
    return new;
  end if;
  if new.status          is distinct from old.status
  or new.bloqueada       is distinct from old.bloqueada
  or new.trial_expira_em is distinct from old.trial_expira_em
  or new.tipo            is distinct from old.tipo
  or new.id              is distinct from old.id then
    raise exception 'Sem permissão para alterar status, bloqueio, trial ou tipo da conta'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists empresas_protege_colunas on empresas;
create trigger empresas_protege_colunas
  before update on empresas
  for each row execute function empresas_protege_colunas();


-- ------------------------------------------------------------
-- PARTE 2 — Formato dos campos que aparecem na tela
--
-- "not valid" = vale para tudo que for gravado daqui para frente, sem
-- reprocessar os registros antigos (nada existente e alterado ou apagado).
-- ------------------------------------------------------------

-- Link publico: letras minusculas, numeros e hifens (igual ao que o app ja exige)
alter table empresas drop constraint if exists empresas_slug_formato;
alter table empresas add constraint empresas_slug_formato
  check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$') not valid;

-- Cor do botao: #rrggbb (o seletor de cor do app ja gera assim).
-- Uma cor antiga fora do padrao ja e ignorada pelo app; ela e limpa aqui porque,
-- senao, a restricao impediria atualizar aquele botao (ex.: reordenar).
update botoes_empresa set cor = null where cor is not null and cor !~ '^#[0-9a-fA-F]{6}$';
alter table botoes_empresa drop constraint if exists botoes_cor_formato;
alter table botoes_empresa add constraint botoes_cor_formato
  check (cor is null or cor ~ '^#[0-9a-fA-F]{6}$') not valid;

-- Agendamentos (qualquer visitante pode criar): data AAAA-MM-DD e hora HH:MM
alter table agendamentos drop constraint if exists agendamentos_data_hora_formato;
alter table agendamentos add constraint agendamentos_data_hora_formato
  check (data::text ~ '^\d{4}-\d{2}-\d{2}$' and hora::text ~ '^\d{2}:\d{2}(:\d{2})?$') not valid;

-- Codigo curto do link de confirmacao (?ag=): so letras e numeros (o app gera 8)
alter table agendamentos drop constraint if exists agendamentos_token_formato;
alter table agendamentos add constraint agendamentos_token_formato
  check (token_curto is null or token_curto ~ '^[a-z0-9]{4,32}$') not valid;

-- Horarios configurados: dia da semana (0-6) na chave _dias_, HH:MM nas demais
alter table horarios_disponiveis drop constraint if exists horarios_hora_formato;
alter table horarios_disponiveis add constraint horarios_hora_formato
  check (
    (mes = '_dias_' and hora::text ~ '^[0-6]$')
    or (mes <> '_dias_' and hora::text ~ '^\d{2}:\d{2}(:\d{2})?$')
  ) not valid;

-- Bloqueios: HH:MM
alter table bloqueios drop constraint if exists bloqueios_hora_formato;
alter table bloqueios add constraint bloqueios_hora_formato
  check (hora::text ~ '^\d{2}:\d{2}(:\d{2})?$') not valid;


-- ------------------------------------------------------------
-- PARTE 3 — Cancelado libera o horario
-- ------------------------------------------------------------

-- 3a) A "janela" publica de horarios ocupados deixa de contar os cancelados
create or replace view horarios_ocupados as
  select empresa_id, data, hora
  from agendamentos
  where status is distinct from 'cancelado';

grant select on horarios_ocupados to anon;
grant select on horarios_ocupados to authenticated;

-- 3b) Um horario so fica preso enquanto o agendamento NAO esta cancelado.
--     Cria o indice novo ANTES de remover a restricao antiga, para nunca
--     haver um intervalo sem protecao contra reserva dupla.
create unique index if not exists agendamentos_slot_ativo_unique
  on agendamentos (empresa_id, data, hora)
  where status is distinct from 'cancelado';

alter table agendamentos
  drop constraint if exists agendamentos_empresa_data_hora_unique;


-- ============================================================
-- RELATORIO — confere o resultado (todas as linhas devem mostrar "ok")
-- ============================================================
select 'gatilho empresas_protege_colunas' as item,
       case when exists (select 1 from pg_trigger where tgname = 'empresas_protege_colunas') then 'ok' else 'FALTANDO' end as status
union all
select 'restricao empresas_slug_formato',
       case when exists (select 1 from pg_constraint where conname = 'empresas_slug_formato') then 'ok' else 'FALTANDO' end
union all
select 'restricao botoes_cor_formato',
       case when exists (select 1 from pg_constraint where conname = 'botoes_cor_formato') then 'ok' else 'FALTANDO' end
union all
select 'restricao agendamentos_data_hora_formato',
       case when exists (select 1 from pg_constraint where conname = 'agendamentos_data_hora_formato') then 'ok' else 'FALTANDO' end
union all
select 'restricao agendamentos_token_formato',
       case when exists (select 1 from pg_constraint where conname = 'agendamentos_token_formato') then 'ok' else 'FALTANDO' end
union all
select 'indice agendamentos_slot_ativo_unique',
       case when exists (select 1 from pg_indexes where indexname = 'agendamentos_slot_ativo_unique') then 'ok' else 'FALTANDO' end
union all
select 'restricao antiga removida',
       case when not exists (select 1 from pg_constraint where conname = 'agendamentos_empresa_data_hora_unique') then 'ok' else 'AINDA EXISTE' end
union all
select 'view sem cancelados',
       case when pg_get_viewdef('horarios_ocupados'::regclass, true) ilike '%cancelado%' then 'ok' else 'FALTANDO' end
union all
-- Se o seu banco tiver outra restricao unica de horario com nome diferente, ela aparece aqui
-- e continua impedindo reservar um horario cancelado: nesse caso, me mande o nome.
select 'outras restricoes unicas de horario',
       coalesce((select string_agg(conname, ', ') from pg_constraint
                 where conrelid = 'agendamentos'::regclass and contype = 'u'
                   and pg_get_constraintdef(oid) ilike '%hora%'), 'ok (nenhuma)');
