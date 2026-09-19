-- update_bloco_instruments (004) pegava "o primeiro bloco que a pessoa
-- dirige" com `limit 1`, sem checar qual bloco de fato. Se um dia
-- alguém for diretor de mais de um bloco (o esquema permite, já que
-- um mesmo e-mail pode ter membership em blocos diferentes), a edição
-- podia acabar indo pro bloco errado. Agora exige o bloco_id explícito
-- e confere que quem chamou é diretor DAQUELE bloco.

create or replace function public.update_bloco_instruments(p_bloco_id uuid, p_instruments text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_director(p_bloco_id) then
    raise exception 'not_authorized';
  end if;

  update public.blocos set instruments = p_instruments where id = p_bloco_id;
end;
$$;

-- remove a assinatura antiga (parâmetro único) já que trocamos a forma de chamar
drop function if exists public.update_bloco_instruments(text[]);

grant execute on function public.update_bloco_instruments(uuid, text[]) to authenticated;
