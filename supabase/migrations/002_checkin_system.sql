-- TimeLabs — Fase 2: sistema de check-in multi-tenant.
-- Cada membro/ensaio/presença pertence a um bloco (bloco_id). O
-- mesmo e-mail pode, em tese, pertencer a mais de um bloco — por
-- isso members.auth_user_id NÃO é único global (o auth.users em si
-- é global no Supabase; um e-mail só tem uma conta, mas pode estar
-- linkado a vários registros de membro, um por bloco).

create extension if not exists pgcrypto with schema extensions;

-- a vitrine pública (001) não expõe o id — o app do bloco (rota
-- /:blocoSlug) precisa dele pra filtrar members/events/attendances.
-- id não é segredo (é só a FK), então é seguro expor. `create or
-- replace` não deixa inserir uma coluna antes das existentes, então
-- recria a view do zero.
drop view if exists public.blocos_public;
create view public.blocos_public as
  select id, slug, name, city, theme, created_at
  from public.blocos
  where status = 'active';

grant select on public.blocos_public to anon, authenticated;

-- =============================================================
-- Tabelas
-- =============================================================

create table public.members (
  id uuid primary key default gen_random_uuid(),
  bloco_id uuid not null references public.blocos(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  email text not null,
  full_name text not null,
  whatsapp text not null,
  instrument text,
  auth_auto_password boolean not null default false,
  role text not null default 'member' check (role in ('member', 'director')),
  created_at timestamptz not null default now(),
  unique (bloco_id, email)
);

create index members_bloco_id_idx on public.members(bloco_id);
create index members_auth_user_id_idx on public.members(auth_user_id);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  bloco_id uuid not null references public.blocos(id) on delete cascade,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters int not null default 150 check (radius_meters > 0),
  qr_token uuid not null unique default gen_random_uuid(),
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index events_bloco_id_idx on public.events(bloco_id);
create index events_qr_token_idx on public.events(qr_token);
create index events_starts_at_idx on public.events(starts_at);

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  bloco_id uuid not null references public.blocos(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  distance_meters int,
  source text not null default 'self' check (source in ('self', 'manual')),
  unique (event_id, member_id)
);

create index attendances_bloco_id_idx on public.attendances(bloco_id);
create index attendances_event_id_idx on public.attendances(event_id);
create index attendances_member_id_idx on public.attendances(member_id);

-- garante que attendances.bloco_id sempre bate com o do evento —
-- evita inconsistência se alguém inserir manualmente errado.
create or replace function public.set_attendance_bloco_id()
returns trigger
language plpgsql
as $$
begin
  select bloco_id into new.bloco_id from public.events where id = new.event_id;
  return new;
end;
$$;

create trigger attendances_set_bloco_id
  before insert on public.attendances
  for each row execute procedure public.set_attendance_bloco_id();

-- =============================================================
-- Helpers de autorização
-- =============================================================

create or replace function public.is_director(p_bloco_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.members
    where bloco_id = p_bloco_id and auth_user_id = auth.uid() and role = 'director'
  );
$$;

create or replace function public.is_bloco_member(p_bloco_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.members
    where bloco_id = p_bloco_id and auth_user_id = auth.uid()
  );
$$;

-- =============================================================
-- Login automático (mesmo esquema do qr-abalo/qr-lavo): e-mail +
-- 6 últimos dígitos do WhatsApp. auth_auto_password marca quem tem
-- a senha gerada automaticamente, pra nunca sobrescrever quem já
-- trocou a própria senha.
-- =============================================================

create or replace function public.member_password_from_phone(p_whatsapp text)
returns text
language sql immutable
as $$
  select case
    when length(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g')) >= 6
      then right(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g'), 6)
    else null
  end;
$$;

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

  -- e-mail já tem conta global no Supabase (ex: já é membro de outro
  -- bloco)? só vincula esse registro de membro a ela.
  select id into v_existing from auth.users where lower(email) = lower(v_member.email) limit 1;
  if v_existing is not null then
    update public.members
    set auth_user_id = v_existing, auth_auto_password = true
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
  if v_member.id is null or v_member.auth_user_id is null then
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

create or replace function public.mark_password_changed()
returns void
language sql
security definer
set search_path = public
as $$
  update public.members set auth_auto_password = false where auth_user_id = auth.uid();
$$;

grant execute on function public.mark_password_changed() to authenticated;

create or replace function public.member_auto_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.auth_user_id is null then
    perform public.create_member_auth_user(new.id);
  elsif new.auth_auto_password then
    perform public.reset_member_password_from_phone(new.id);
  end if;
  return new;
end;
$$;

create trigger on_member_created_auth
  after insert on public.members
  for each row execute procedure public.member_auto_auth();

create trigger on_member_whatsapp_added
  after update of whatsapp on public.members
  for each row
  when (new.auth_user_id is null and new.whatsapp is distinct from old.whatsapp)
  execute procedure public.member_auto_auth();

-- quando o auth_user_id não muda mas o whatsapp muda e a pessoa ainda
-- está na senha automática, atualiza a senha também.
create trigger on_member_whatsapp_changed_reset_password
  after update of whatsapp on public.members
  for each row
  when (new.auth_user_id is not null and new.auth_auto_password
        and new.whatsapp is distinct from old.whatsapp)
  execute procedure public.member_auto_auth();

-- apaga a conta global quando o último registro de membro dela some
create or replace function public.handle_member_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.auth_user_id is not null
     and not exists (select 1 from public.members where auth_user_id = old.auth_user_id) then
    delete from auth.users where id = old.auth_user_id;
  end if;
  return old;
end;
$$;

create trigger on_member_deleted
  after delete on public.members
  for each row execute procedure public.handle_member_deleted();

-- liga o auth_user_id automaticamente quando alguém que já tinha
-- cadastro de membro (email batendo) finalmente cria a conta —
-- cobre o caso raríssimo de conta criada por outro caminho.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.members
  set auth_user_id = new.id
  where lower(email) = lower(new.email) and auth_user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- =============================================================
-- Check-in (QR + geolocalização), igual ao qr-abalo/qr-lavo mas
-- resolvendo o bloco a partir do próprio QR token.
-- =============================================================

create or replace function public.distance_meters(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians((lat2 - lat1) / 2)), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians((lng2 - lng1) / 2)), 2)
  ));
$$;

create or replace function public.check_in(
  p_qr_token uuid,
  p_latitude double precision,
  p_longitude double precision
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.events;
  v_member public.members;
  v_distance double precision;
  v_attendance_id uuid;
begin
  select * into v_event from public.events where qr_token = p_qr_token;
  if v_event.id is null then
    return json_build_object('ok', false, 'error', 'invalid_qr');
  end if;

  select * into v_member
  from public.members
  where bloco_id = v_event.bloco_id and auth_user_id = auth.uid();

  if v_member.id is null then
    return json_build_object('ok', false, 'error', 'not_whitelisted');
  end if;

  if now() < v_event.starts_at then
    return json_build_object('ok', false, 'error', 'too_early');
  end if;

  if now() > v_event.ends_at then
    return json_build_object('ok', false, 'error', 'too_late');
  end if;

  v_distance := public.distance_meters(v_event.latitude, v_event.longitude, p_latitude, p_longitude);

  if v_distance > v_event.radius_meters then
    return json_build_object('ok', false, 'error', 'too_far', 'distance_meters', round(v_distance));
  end if;

  insert into public.attendances (bloco_id, event_id, member_id, latitude, longitude, distance_meters, source)
  values (v_event.bloco_id, v_event.id, v_member.id, p_latitude, p_longitude, round(v_distance), 'self')
  on conflict (event_id, member_id) do nothing
  returning id into v_attendance_id;

  if v_attendance_id is null then
    return json_build_object('ok', false, 'error', 'already_checked_in');
  end if;

  return json_build_object(
    'ok', true, 'attendance_id', v_attendance_id,
    'event_name', v_event.name, 'distance_meters', round(v_distance)
  );
end;
$$;

-- =============================================================
-- RLS
-- =============================================================

alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.attendances enable row level security;

create policy "members read own" on public.members
  for select using (auth_user_id = auth.uid());

create policy "directors read all members of their bloco" on public.members
  for select using (public.is_director(bloco_id));

create policy "directors manage members of their bloco" on public.members
  for all using (public.is_director(bloco_id)) with check (public.is_director(bloco_id));

create policy "bloco members read their bloco's events" on public.events
  for select using (public.is_bloco_member(bloco_id));

create policy "directors manage events of their bloco" on public.events
  for all using (public.is_director(bloco_id)) with check (public.is_director(bloco_id));

create policy "members read own attendances" on public.attendances
  for select using (
    member_id in (select id from public.members where auth_user_id = auth.uid())
  );

create policy "directors read all attendances of their bloco" on public.attendances
  for select using (public.is_director(bloco_id));

create policy "directors insert manual attendances in their bloco" on public.attendances
  for insert with check (public.is_director(bloco_id) and source = 'manual');

create policy "directors delete attendances of their bloco" on public.attendances
  for delete using (public.is_director(bloco_id));

-- =============================================================
-- Realtime (painel do diretor atualiza ao vivo)
-- =============================================================

alter publication supabase_realtime add table public.attendances;
