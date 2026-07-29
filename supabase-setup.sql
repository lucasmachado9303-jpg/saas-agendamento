-- ============================================================
-- Agenda+ — Setup Supabase Auth
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard → SQL Editor
-- ============================================================

-- 1. Tabela de perfis (vinculada ao auth.users)
create table if not exists profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  nome        text        not null,
  email       text        not null,
  role        text        not null default 'owner_empresa'
                          check (role in ('master', 'owner_empresa')),
  empresa_id  uuid        references empresas(id) on delete set null,
  status      text        not null default 'ativo'
                          check (status in ('ativo', 'bloqueado')),
  created_at  timestamptz not null default now()
);

-- 2. RLS na tabela profiles
alter table profiles enable row level security;

-- Cada usuário lê apenas o próprio perfil
create policy "profiles_own_select" on profiles
  for select using (auth.uid() = id);

-- Apenas service_role pode inserir/atualizar (via API serverless)
-- (service_role já tem acesso irrestrito por padrão no Supabase)

-- ============================================================
-- 3. RLS nas tabelas existentes
-- ============================================================

-- ── empresas ─────────────────────────────────────────────────
alter table empresas enable row level security;

-- Leitura pública (fluxo de agendamento de clientes)
create policy "empresas_public_read" on empresas
  for select using (true);

-- Master pode fazer tudo
create policy "empresas_master_all" on empresas
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  );

-- Dono da empresa pode atualizar apenas a sua
create policy "empresas_owner_update" on empresas
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = empresas.id and status = 'ativo'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = empresas.id and status = 'ativo'
    )
  );

-- ── servicos ─────────────────────────────────────────────────
alter table servicos enable row level security;

create policy "servicos_public_read" on servicos
  for select using (true);

create policy "servicos_master_all" on servicos
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  );

create policy "servicos_owner_all" on servicos
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = servicos.empresa_id and status = 'ativo'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = servicos.empresa_id and status = 'ativo'
    )
  );

-- ── horarios_disponiveis ──────────────────────────────────────
alter table horarios_disponiveis enable row level security;

create policy "horarios_public_read" on horarios_disponiveis
  for select using (true);

create policy "horarios_master_all" on horarios_disponiveis
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  );

create policy "horarios_owner_all" on horarios_disponiveis
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = horarios_disponiveis.empresa_id and status = 'ativo'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = horarios_disponiveis.empresa_id and status = 'ativo'
    )
  );

-- ── bloqueios ─────────────────────────────────────────────────
alter table bloqueios enable row level security;

create policy "bloqueios_public_read" on bloqueios
  for select using (true);

create policy "bloqueios_master_all" on bloqueios
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  );

create policy "bloqueios_owner_all" on bloqueios
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = bloqueios.empresa_id and status = 'ativo'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = bloqueios.empresa_id and status = 'ativo'
    )
  );

-- ── botoes_empresa ────────────────────────────────────────────
alter table botoes_empresa enable row level security;

create policy "botoes_public_read" on botoes_empresa
  for select using (true);

create policy "botoes_master_all" on botoes_empresa
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  );

create policy "botoes_owner_all" on botoes_empresa
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = botoes_empresa.empresa_id and status = 'ativo'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'owner_empresa'
        and empresa_id = botoes_empresa.empresa_id and status = 'ativo'
    )
  );

-- ── agendamentos ──────────────────────────────────────────────
alter table agendamentos enable row level security;

-- Clientes (anon) podem inserir agendamentos
create policy "agendamentos_public_insert" on agendamentos
  for insert with check (true);

-- Leitura pública (necessário para verificar slots ocupados)
create policy "agendamentos_public_read" on agendamentos
  for select using (true);

create policy "agendamentos_master_all" on agendamentos
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'master')
  );

create policy "agendamentos_owner_write" on agendamentos
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
-- PRÓXIMOS PASSOS MANUAIS:
-- 1. Crie o usuário master em: Authentication → Users → Add user
--    (marque "Auto Confirm User")
-- 2. Após criado, insira o perfil master no SQL Editor:
--
--    insert into profiles (id, nome, email, role, status)
--    values ('<UUID_DO_USUARIO>', 'Master', 'seu@email.com', 'master', 'ativo');
--
-- 3. Configure as variáveis de ambiente na Vercel:
--    SUPABASE_URL = https://byrcbihwqgostesuoztd.supabase.co
--    SUPABASE_SERVICE_ROLE_KEY = (em Project Settings → API → service_role)
-- ============================================================
