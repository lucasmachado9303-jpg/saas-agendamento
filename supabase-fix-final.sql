-- ============================================================
-- Agenda+ — FIX FINAL (execute INTEIRO no SQL Editor do Supabase)
-- É seguro rodar mais de uma vez.
-- ============================================================


-- ------------------------------------------------------------
-- 1. VIEW horarios_ocupados
-- Visitantes anônimos veem apenas empresa/data/hora — sem dados pessoais.
-- ------------------------------------------------------------
drop view if exists horarios_ocupados;
create view horarios_ocupados as
  select empresa_id, data, hora from agendamentos;

grant select on horarios_ocupados to anon;
grant select on horarios_ocupados to authenticated;


-- ------------------------------------------------------------
-- 2. RLS em agendamentos — estado correto garantido
-- Liga a trava e recria as políticas do zero.
-- ------------------------------------------------------------
alter table agendamentos enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'agendamentos'
  loop
    execute format('drop policy %I on agendamentos', p.policyname);
  end loop;
end $$;

-- Qualquer visitante pode criar agendamento
create policy "agendamentos_criar_publico" on agendamentos
  for insert with check (true);

-- Master gerencia tudo
create policy "agendamentos_master" on agendamentos
  for all using (is_master()) with check (is_master());

-- Dono da empresa gerencia apenas os dela
create policy "agendamentos_dono" on agendamentos
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = agendamentos.empresa_id and status = 'ativo'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = agendamentos.empresa_id and status = 'ativo'
    )
  );


-- ------------------------------------------------------------
-- 3. UNIQUE constraint — impede duplo-agendamento no banco
-- ------------------------------------------------------------
alter table agendamentos
  drop constraint if exists agendamentos_empresa_data_hora_unique;

alter table agendamentos
  add constraint agendamentos_empresa_data_hora_unique
  unique (empresa_id, data, hora);


-- ------------------------------------------------------------
-- 4. RELATÓRIO — confirma o estado após rodar o script
-- "trava_ligada" deve ser TRUE para todas as tabelas.
-- ------------------------------------------------------------
select
  c.relname                          as tabela,
  c.relrowsecurity                   as trava_ligada,
  count(p.policyname)                as qtd_permissoes
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
       on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'empresas','servicos','horarios_disponiveis',
    'bloqueios','botoes_empresa','agendamentos','profiles'
  )
group by c.relname, c.relrowsecurity
order by c.relrowsecurity, c.relname;
