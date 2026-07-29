-- ============================================================
-- Agenda+ — Tabela Financeiro (painel master)
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard → SQL Editor
-- ============================================================

create table if not exists financeiro (
  id              uuid        primary key default gen_random_uuid(),
  empresa_id      uuid        not null references empresas(id) on delete cascade,
  valor           numeric(10,2) not null default 0,
  dia_vencimento  int         not null default 10 check (dia_vencimento between 1 and 28),
  pago_em         date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(empresa_id)
);

alter table financeiro enable row level security;

-- Somente master pode ler e modificar
create policy "financeiro_master_all" on financeiro
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  );
