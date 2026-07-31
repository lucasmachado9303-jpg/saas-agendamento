-- ============================================================
-- Agenda+ — Tabela notas (bloco de notas do painel de gestão)
-- Execute INTEIRO no SQL Editor do Supabase.
-- É seguro rodar mais de uma vez.
-- ============================================================

create table if not exists notas (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  texto      text not null,
  cor        text not null default 'amarelo' check (cor in ('amarelo','azul','rosa','verde')),
  criado_em  timestamptz not null default now()
);

-- Índice para consultas por empresa
create index if not exists notas_empresa on notas(empresa_id, criado_em desc);

-- RLS
alter table notas enable row level security;

-- Remove políticas antigas se existirem (idempotente)
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'notas'
  loop
    execute format('drop policy %I on notas', p.policyname);
  end loop;
end $$;

-- Gestor gerencia apenas as notas da própria empresa
create policy "notas_owner" on notas
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and role = 'owner_empresa'
        and empresa_id = notas.empresa_id
        and status = 'ativo'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and role = 'owner_empresa'
        and empresa_id = notas.empresa_id
        and status = 'ativo'
    )
  );

-- Master acessa tudo
create policy "notas_master" on notas
  for all
  using (is_master())
  with check (is_master());

-- Confirmação
select 'notas criada com sucesso' as status;
