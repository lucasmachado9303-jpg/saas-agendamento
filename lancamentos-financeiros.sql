-- ============================================================
-- Agenda+ — Tabela lancamentos_financeiros (painel de gestão)
-- Execute INTEIRO no SQL Editor do Supabase.
-- É seguro rodar mais de uma vez.
-- ============================================================

create table if not exists lancamentos_financeiros (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid not null references empresas(id) on delete cascade,
  tipo           text not null check (tipo in ('receita','despesa')),
  descricao      text not null,
  valor          numeric(10,2) not null check (valor > 0),
  data           date not null,
  agendamento_id uuid references agendamentos(id) on delete set null,
  criado_em      timestamptz not null default now()
);

-- Índices para consultas por empresa e data
create index if not exists lf_empresa_data on lancamentos_financeiros(empresa_id, data);
create index if not exists lf_agendamento  on lancamentos_financeiros(agendamento_id) where agendamento_id is not null;

-- RLS
alter table lancamentos_financeiros enable row level security;

-- Remove políticas antigas se existirem (idempotente)
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'lancamentos_financeiros'
  loop
    execute format('drop policy %I on lancamentos_financeiros', p.policyname);
  end loop;
end $$;

-- Gestor gerencia apenas os lançamentos da própria empresa
create policy "lf_owner" on lancamentos_financeiros
  for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and role = 'owner_empresa'
        and empresa_id = lancamentos_financeiros.empresa_id
        and status = 'ativo'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
        and role = 'owner_empresa'
        and empresa_id = lancamentos_financeiros.empresa_id
        and status = 'ativo'
    )
  );

-- Master acessa tudo
create policy "lf_master" on lancamentos_financeiros
  for all
  using (is_master())
  with check (is_master());

-- Confirmação
select 'lancamentos_financeiros criada com sucesso' as status;
