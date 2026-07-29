-- ============================================================
-- Agenda+ — CORREÇÃO 2 (segunda tentativa)
--
-- A primeira tentativa não funcionou: os dados dos clientes
-- continuam públicos. Provavelmente a trava de segurança (RLS)
-- da tabela "agendamentos" nunca foi ligada.
--
-- Este script força o estado correto, independente de como
-- a tabela está agora.
--
-- Execute o arquivo INTEIRO no SQL Editor do Supabase.
-- ============================================================


-- PASSO 1 — Liga a trava de segurança da tabela
alter table agendamentos enable row level security;


-- PASSO 2 — Apaga TODAS as permissões atuais da tabela
-- (não sabemos os nomes, então removemos todas e recriamos)
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


-- PASSO 3 — Recria apenas as permissões corretas

-- 3a) Visitante do site PODE criar um agendamento...
create policy "agendamentos_criar_publico" on agendamentos
  for insert with check (true);

-- 3b) ...mas NÃO existe permissão de leitura para visitantes.
--     Eles enxergam só a view "horarios_ocupados" (empresa/data/hora).

-- 3c) Master enxerga e gerencia tudo
create policy "agendamentos_master" on agendamentos
  for all using (is_master()) with check (is_master());

-- 3d) Dono da empresa gerencia apenas os agendamentos dela
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


-- ============================================================
-- PASSO 4 — RELATÓRIO
--
-- O resultado abaixo vai aparecer na tela. Copie e me mande.
-- A coluna "trava_ligada" precisa estar TRUE em todas as linhas.
-- ============================================================

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
