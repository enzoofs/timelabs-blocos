# TimeLabs — Blocos

Plataforma multi-bloco: landing page + cadastro + pagamento (Stripe).
Cada bloco que se cadastra e paga vira um cliente ativo, com cores
próprias. O sistema de check-in em si (Fase 2) ainda não está
portado pra cá — os blocos existentes (Abalô-Caxi, Lavô Tá Novo)
continuam nos repositórios/bancos deles até essa migração.

## Rodando local

```
cp .env.example .env.local
npm install
npm run dev
```

Preenche `.env.local` com um projeto Supabase (roda a migration em
`supabase/migrations/001_blocos.sql`) e chaves de teste do Stripe.

## Variáveis de ambiente

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — projeto Supabase (novo, dedicado a essa plataforma).
- `VITE_STRIPE_PUBLISHABLE_KEY` — chave publicável do Stripe.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — só usadas nas funções em `/api` (nunca expostas ao navegador).
- `SUPABASE_SERVICE_ROLE_KEY` — idem, só no servidor.

## Webhook do Stripe

Configura um endpoint apontando pra `/api/stripe-webhook` escutando
pelo menos: `checkout.session.completed`, `customer.subscription.deleted`,
`invoice.payment_failed`.
