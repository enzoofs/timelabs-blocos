-- 1) Senha de conta que já existia não pode ser mexida por outro bloco.
--
-- Antes: quando um diretor cadastrava um e-mail que já tinha conta
-- (ex: membro de outro bloco), create_member_auth_user vinculava a
-- conta e marcava auth_auto_password = true. Aí bastava o diretor
-- editar o WhatsApp desse membro pro trigger resetar a senha GLOBAL
-- da pessoa pros 6 dígitos que ele escolheu — dava pra tomar a conta
-- de qualquer um (inclusive diretor de outro bloco), e também
-- resetava sem querer a senha de quem toca em dois blocos.
--
-- Agora: conta pré-existente é só vinculada, nunca com senha
-- automática; o reset só acontece se a conta pertence a um único
-- registro de membro; e diretor não consegue mais escrever
-- auth_user_id / auth_auto_password pela API.

create or replace function public.create_member_auth_user(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members;
  v_password text;
  v_user_id uuid;
  v_existing uuid;
begin
  select * into v_member from public.members where id = p_member_id;
  if v_member.id is null or v_member.auth_user_id is not null then
    return;
  end if;

  -- e-mail já tem conta global? só vincula — a senha dessa conta é de
  -- quem já a usa, e esse bloco nunca pode redefini-la.
  select id into v_existing from auth.users where lower(email) = lower(v_member.email) limit 1;
  if v_existing is not null then
    update public.members
    set auth_user_id = v_existing, auth_auto_password = false
    where id = p_member_id;
    return;
  end if;

  v_password := public.member_password_from_phone(v_member.whatsapp);
  if v_password is null then
    return; -- sem telefone suficiente pra gerar senha
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change,
    phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id, 'authenticated', 'authenticated', lower(v_member.email),
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id::text, v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text, 'email', lower(v_member.email),
      'email_verified', true, 'phone_verified', false
    ),
    'email', now(), now(), now()
  );

  update public.members
  set auth_user_id = v_user_id, auth_auto_password = true
  where id = p_member_id;
exception
  when others then
    raise warning 'create_member_auth_user falhou para %: %', v_member.email, sqlerrm;
end;
$$;

create or replace function public.reset_member_password_from_phone(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members;
  v_password text;
begin
  select * into v_member from public.members where id = p_member_id;
  if v_member.id is null or v_member.auth_user_id is null or not v_member.auth_auto_password then
    return;
  end if;

  -- conta usada em mais de um bloco: nenhum deles redefine a senha.
  if exists (
    select 1 from public.members
    where auth_user_id = v_member.auth_user_id and id <> v_member.id
  ) then
    return;
  end if;

  v_password := public.member_password_from_phone(v_member.whatsapp);
  if v_password is null then
    return;
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = v_member.auth_user_id;
exception
  when others then
    raise warning 'reset_member_password_from_phone falhou para %: %', v_member.email, sqlerrm;
end;
$$;

-- Dados já existentes: em toda conta compartilhada por mais de um
-- registro de membro, desliga a senha automática.
update public.members m
set auth_auto_password = false
where m.auth_auto_password
  and exists (
    select 1 from public.members o
    where o.auth_user_id = m.auth_user_id and o.id <> m.id
  );

-- RLS não restringe coluna; privilégio de coluna sim. O app do diretor
-- só escreve esses campos — auth_user_id e auth_auto_password ficam
-- só pros triggers (security definer) e pro service role.
revoke insert, update on public.members from anon, authenticated;
grant insert (bloco_id, email, full_name, whatsapp, instrument, role)
  on public.members to authenticated;
grant update (email, full_name, whatsapp, instrument, role)
  on public.members to authenticated;

-- 2) Cartão recusado não pode tirar o bloco do ar.
--
-- Antes: invoice.payment_failed marcava 'past_due' e a vitrine só
-- mostrava 'active' — o app inteiro do bloco virava "Bloco não
-- encontrado" no primeiro cartão recusado, até no meio de ensaio.
-- Agora 'past_due' continua funcionando enquanto o Stripe tenta de
-- novo; só 'canceled' (assinatura encerrada) tira do ar.
drop view if exists public.blocos_public;
create view public.blocos_public as
  select id, slug, name, city, theme, instruments, created_at
  from public.blocos
  where status in ('active', 'past_due');

grant select on public.blocos_public to anon, authenticated;
