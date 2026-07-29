-- ============================================================
-- Agenda+ — CORREÇÃO CRÍTICA: RLS nas tabelas principais
--
-- PROBLEMA: as tabelas empresas, servicos, bloqueios,
-- horarios_disponiveis e botoes_empresa estão sem políticas
-- de escrita, permitindo que qualquer visitante crie, edite
-- ou apague registros.
--
-- Execute o arquivo INTEIRO no SQL Editor do Supabase.
-- ============================================================


-- ============================================================
-- PARTE 1 — Liga a trava de segurança em todas as tabelas
-- ============================================================

alter table empresas              enable row level security;
alter table servicos              enable row level security;
alter table bloqueios             enable row level security;
alter table horarios_disponiveis  enable row level security;
alter table botoes_empresa        enable row level security;


-- ============================================================
-- PARTE 2 — Remove políticas antigas (evita conflito)
-- ============================================================

do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('empresas','servicos','bloqueios','horarios_disponiveis','botoes_empresa')
  loop
    execute format('drop policy if exists %I on %I', p.policyname, p.tablename);
  end loop;
end $$;


-- ============================================================
-- PARTE 3 — Helper: dono da empresa
--
-- Reutilizado em várias políticas abaixo.
-- ============================================================

create or replace function is_owner_da_empresa(eid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role = 'owner_empresa'
      and status = 'ativo'
      and empresa_id = eid
  );
$$;


-- ============================================================
-- PARTE 4 — EMPRESAS
--
-- Leitura: todos (necessário para carregar a página pública)
-- Escrita:  só master
-- ============================================================

create policy "empresas_select_public" on empresas
  for select using (true);

create policy "empresas_insert_master" on empresas
  for insert with check (is_master());

create policy "empresas_update_master_ou_owner" on empresas
  for update using (is_master() or is_owner_da_empresa(id));

create policy "empresas_delete_master" on empresas
  for delete using (is_master());


-- ============================================================
-- PARTE 5 — SERVICOS
--
-- Leitura: todos
-- Escrita:  master ou dono da empresa
-- ============================================================

create policy "servicos_select_public" on servicos
  for select using (true);

create policy "servicos_insert_auth" on servicos
  for insert with check (is_master() or is_owner_da_empresa(empresa_id));

create policy "servicos_update_auth" on servicos
  for update using (is_master() or is_owner_da_empresa(empresa_id));

create policy "servicos_delete_auth" on servicos
  for delete using (is_master() or is_owner_da_empresa(empresa_id));


-- ============================================================
-- PARTE 6 — BLOQUEIOS
--
-- Leitura: todos (necessário para mostrar horários bloqueados)
-- Escrita:  master ou dono da empresa
-- ============================================================

create policy "bloqueios_select_public" on bloqueios
  for select using (true);

create policy "bloqueios_insert_auth" on bloqueios
  for insert with check (is_master() or is_owner_da_empresa(empresa_id));

create policy "bloqueios_update_auth" on bloqueios
  for update using (is_master() or is_owner_da_empresa(empresa_id));

create policy "bloqueios_delete_auth" on bloqueios
  for delete using (is_master() or is_owner_da_empresa(empresa_id));


-- ============================================================
-- PARTE 7 — HORARIOS_DISPONIVEIS
--
-- Leitura: todos (necessário para a agenda pública)
-- Escrita:  master ou dono da empresa
-- ============================================================

create policy "horarios_select_public" on horarios_disponiveis
  for select using (true);

create policy "horarios_insert_auth" on horarios_disponiveis
  for insert with check (is_master() or is_owner_da_empresa(empresa_id));

create policy "horarios_update_auth" on horarios_disponiveis
  for update using (is_master() or is_owner_da_empresa(empresa_id));

create policy "horarios_delete_auth" on horarios_disponiveis
  for delete using (is_master() or is_owner_da_empresa(empresa_id));


-- ============================================================
-- PARTE 8 — BOTOES_EMPRESA
--
-- Leitura: todos (necessário para a página pública)
-- Escrita:  master ou dono da empresa
-- ============================================================

create policy "botoes_select_public" on botoes_empresa
  for select using (true);

create policy "botoes_insert_auth" on botoes_empresa
  for insert with check (is_master() or is_owner_da_empresa(empresa_id));

create policy "botoes_update_auth" on botoes_empresa
  for update using (is_master() or is_owner_da_empresa(empresa_id));

create policy "botoes_delete_auth" on botoes_empresa
  for delete using (is_master() or is_owner_da_empresa(empresa_id));


-- ============================================================
-- PARTE 9 — RELATÓRIO FINAL
--
-- Todas as linhas devem mostrar trava_ligada = TRUE.
-- ============================================================

select
  c.relname                       as tabela,
  c.relrowsecurity                as trava_ligada,
  count(p.policyname)             as qtd_politicas
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
