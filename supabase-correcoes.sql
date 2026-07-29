-- ============================================================
-- Agenda+ — CORREÇÕES DE SEGURANÇA
--
-- Execute este arquivo INTEIRO no SQL Editor do Supabase.
-- Ele corrige 3 problemas graves encontrados na auditoria.
--
-- É seguro rodar mais de uma vez.
-- ============================================================


-- ------------------------------------------------------------
-- CORREÇÃO 1 — Apagar a coluna de senha antiga
--
-- PROBLEMA: a coluna "senha_gestao" guardava a senha da empresa
-- em texto puro e qualquer pessoa na internet conseguia lê-la.
-- O sistema não usa mais essa coluna (agora usa Supabase Auth).
-- ------------------------------------------------------------

alter table empresas drop column if exists senha_gestao;


-- ------------------------------------------------------------
-- CORREÇÃO 2 — Parar de expor nome e telefone dos clientes
--
-- PROBLEMA: qualquer pessoa conseguia baixar a lista completa
-- de agendamentos, com nome e telefone de todos os clientes.
--
-- SOLUÇÃO: o site público passa a enxergar apenas uma "janela"
-- com empresa/data/hora (sem dados pessoais), que é tudo o que
-- ele precisa para saber quais horários já estão ocupados.
-- ------------------------------------------------------------

-- Remove a permissão de leitura pública da tabela real
drop policy if exists "agendamentos_public_read" on agendamentos;

-- Cria a janela restrita (sem nome, sem telefone)
drop view if exists horarios_ocupados;
create view horarios_ocupados as
  select empresa_id, data, hora from agendamentos;

-- Libera a leitura apenas dessa janela
grant select on horarios_ocupados to anon;
grant select on horarios_ocupados to authenticated;


-- ------------------------------------------------------------
-- CORREÇÃO 3 — Permitir que o master veja os perfis dos gestores
--
-- PROBLEMA: o master não conseguia ler a tabela "profiles",
-- então o campo "E-mail do gestor" ficava sempre vazio.
--
-- OBS: a função abaixo é necessária para evitar um erro de
-- recursão infinita do Postgres. Não simplifique.
-- ------------------------------------------------------------

create or replace function is_master()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'master'
  );
$$;

drop policy if exists "profiles_master_select" on profiles;
create policy "profiles_master_select" on profiles
  for select using (is_master());


-- ============================================================
-- FIM — se apareceu "Success", deu tudo certo.
-- ============================================================
