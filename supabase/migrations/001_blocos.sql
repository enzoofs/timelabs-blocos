-- TimeLabs — plataforma multi-bloco
-- Fase 1: cadastro do bloco + pagamento (Stripe). O sistema de
-- check-in em si (members/events/attendances, multi-tenant) entra
-- na Fase 2, quando os blocos existentes forem migrados pra cá.

create table public.blocos (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text,
  contact_name text,
  contact_email text not null,
  -- {"primary": "#...", "ink": "#...", "paper": "#...", "accent": "#..."}
  theme jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'past_due', 'canceled')),
  plan text check (plan in ('monthly', 'lump_sum')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  paid_until timestamptz,
  created_at timestamptz not null default now()
);

create index blocos_status_idx on public.blocos(status);

alter table public.blocos enable row level security;

-- Qualquer um pode criar um cadastro pendente (antes de pagar) — mas
-- não pode inventar que já está ativo/pago. Só o webhook do Stripe
-- (via service role, que ignora RLS) promove pra 'active'.
create policy "anyone can start a signup" on public.blocos
  for insert
  with check (
    status = 'pending'
    and stripe_customer_id is null
    and stripe_subscription_id is null
    and paid_until is null
  );

-- Vitrine pública: só os campos de exibição de quem já está ativo.
-- Sem security_invoker: a view roda com o privilégio de quem criou
-- (não do visitante anônimo), então ela enxerga a tabela mesmo sem
-- policy de select nela — e só expõe as colunas listadas aqui.
-- stripe_customer_id, contact_email etc nunca passam por essa view.
create view public.blocos_public as
  select slug, name, city, theme, created_at
  from public.blocos
  where status = 'active';

grant select on public.blocos_public to anon, authenticated;
