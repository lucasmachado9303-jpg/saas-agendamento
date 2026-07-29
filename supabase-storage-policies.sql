-- ============================================================
-- Agenda+ — CORREÇÃO DE SEGURANÇA: Buckets de Storage
--
-- PROBLEMA: qualquer visitante anônimo pode inserir, atualizar
-- ou apagar imagens dos buckets "logos" e "backgrounds".
--
-- SOLUÇÃO: restringir escrita a usuários autenticados com
-- permissão sobre a empresa dona da imagem. Leitura pública
-- continua liberada (necessária para exibir as imagens).
--
-- Execute o arquivo INTEIRO no SQL Editor do Supabase.
-- ============================================================


-- ============================================================
-- PASSO 1 — Apagar as políticas antigas (abertas para anon)
-- ============================================================

drop policy if exists "logos_insert_anon"     on storage.objects;
drop policy if exists "logos_update_anon"     on storage.objects;
drop policy if exists "logos_delete_anon"     on storage.objects;
drop policy if exists "backgrounds_insert_anon" on storage.objects;
drop policy if exists "backgrounds_update_anon" on storage.objects;
drop policy if exists "backgrounds_delete_anon" on storage.objects;


-- ============================================================
-- PASSO 2 — Criar políticas corretas
--
-- Quem pode escrever:
--   a) Master (qualquer imagem de qualquer empresa)
--   b) Owner da empresa, somente na pasta do próprio slug
--      (caminho: "slug/logo.jpg" ou "slug/background.jpg")
-- ============================================================

-- Helper: verifica se o usuário autenticado é dono da empresa
-- cujo slug aparece na primeira parte do caminho do arquivo.
-- Exemplo: "cafeteria-central/logo.jpg" → slug = "cafeteria-central"
create or replace function storage_owner_desta_empresa(obj_name text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from profiles p
    join empresas e on e.id = p.empresa_id
    where p.id          = auth.uid()
      and p.role        = 'owner_empresa'
      and p.status      = 'ativo'
      and e.slug        = split_part(obj_name, '/', 1)
  );
$$;


-- ---- LOGOS — INSERT ----
create policy "logos_insert_auth" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (is_master() or storage_owner_desta_empresa(name))
  );

-- ---- LOGOS — UPDATE ----
create policy "logos_update_auth" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (is_master() or storage_owner_desta_empresa(name))
  );

-- ---- LOGOS — DELETE ----
create policy "logos_delete_auth" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and (is_master() or storage_owner_desta_empresa(name))
  );


-- ---- BACKGROUNDS — INSERT ----
create policy "backgrounds_insert_auth" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'backgrounds'
    and (is_master() or storage_owner_desta_empresa(name))
  );

-- ---- BACKGROUNDS — UPDATE ----
create policy "backgrounds_update_auth" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'backgrounds'
    and (is_master() or storage_owner_desta_empresa(name))
  );

-- ---- BACKGROUNDS — DELETE ----
create policy "backgrounds_delete_auth" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'backgrounds'
    and (is_master() or storage_owner_desta_empresa(name))
  );


-- ============================================================
-- FIM — se apareceu "Success", deu tudo certo.
--
-- Após rodar, verifique no painel do Supabase:
-- Storage → Policies → deve aparecer somente políticas "auth"
-- e a política de leitura pública que já estava lá.
-- ============================================================
