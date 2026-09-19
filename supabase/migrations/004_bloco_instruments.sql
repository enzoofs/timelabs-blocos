-- Cada bloco tem sua própria lista de instrumentos, editável pela
-- diretoria (antes era uma lista fixa igual pra todo mundo, copiada
-- do Abalô-Caxi). Fica guardada na própria linha do bloco pra não
-- precisar de mais uma tabela + RLS pra algo tão simples.

alter table public.blocos
  add column if not exists instruments text[] not null default array[
    'Surdo de Primeira', 'Surdo de Segunda', 'Surdo de Terceira',
    'Agogô', 'Xequerê', 'Caixa', 'Repique'
  ];

drop view if exists public.blocos_public;
create view public.blocos_public as
  select id, slug, name, city, theme, instruments, created_at
  from public.blocos
  where status = 'active';

grant select on public.blocos_public to anon, authenticated;

-- Só o diretor do próprio bloco pode alterar a lista de instrumentos.
-- É uma função em vez de uma policy de UPDATE na tabela blocos porque
-- RLS não restringe coluna por coluna — sem isso, um diretor com
-- UPDATE liberado na própria linha poderia mexer em status/plano/etc.
create or replace function public.update_bloco_instruments(p_instruments text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bloco_id uuid;
begin
  select bloco_id into v_bloco_id
  from public.members
  where auth_user_id = auth.uid() and role = 'director'
  limit 1;

  if v_bloco_id is null then
    raise exception 'not_authorized';
  end if;

  update public.blocos set instruments = p_instruments where id = v_bloco_id;
end;
$$;

grant execute on function public.update_bloco_instruments(text[]) to authenticated;
