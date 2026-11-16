-- Ensaios separados por grupo: bateria x coral.
--
-- Cada membro pertence a UM grupo só (não dá pra ser dos dois) e cada
-- ensaio é de um grupo. O membro só enxerga e só faz check-in nos
-- ensaios do próprio grupo; a diretoria enxerga tudo.
--
-- Tudo que já existe vira 'bateria' pelo default — nada muda pra quem
-- não usa coral. A opção só aparece na tela pros blocos com
-- tem_coral = true (por enquanto só o Abalô-Caxi).

-- 1) Liga/desliga a feature por bloco
alter table public.blocos
  add column if not exists tem_coral boolean not null default false;

update public.blocos set tem_coral = true where slug = 'abalo-caxi';

drop view if exists public.blocos_public;
create view public.blocos_public as
  select id, slug, name, city, theme, instruments, tem_coral, created_at
  from public.blocos
  where status in ('active', 'past_due');

grant select on public.blocos_public to anon, authenticated;

-- 2) Grupo do membro e do ensaio
alter table public.members
  add column if not exists grupo text not null default 'bateria'
  check (grupo in ('bateria', 'coral'));

alter table public.events
  add column if not exists grupo text not null default 'bateria'
  check (grupo in ('bateria', 'coral'));

create index if not exists members_bloco_grupo_idx on public.members(bloco_id, grupo);

-- members tem privilégio por coluna (ver 006): o diretor precisa poder
-- gravar o grupo no cadastro, na edição e na importação do coral.
grant insert (grupo), update (grupo) on public.members to authenticated;

-- 3) Membro só lê ensaio do próprio grupo; diretor lê todos.
create or replace function public.can_see_event(p_bloco_id uuid, p_grupo text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.members
    where bloco_id = p_bloco_id
      and auth_user_id = auth.uid()
      and (role = 'director' or grupo = p_grupo)
  );
$$;

drop policy if exists "bloco members read their bloco's events" on public.events;
create policy "bloco members read their group's events" on public.events
  for select using (public.can_see_event(bloco_id, grupo));

-- 4) check_in recusa ensaio de outro grupo (mesmo com o QR na mão).
-- Igual à versão da 002, só com o bloco "wrong_group" a mais.
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

  if v_member.grupo <> v_event.grupo then
    return json_build_object('ok', false, 'error', 'wrong_group', 'event_group', v_event.grupo);
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
