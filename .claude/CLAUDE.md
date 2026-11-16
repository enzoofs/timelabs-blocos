# Seu Bloco (seubloco.com)

## O que é este projeto
Plataforma multi-bloco de carnaval: landing, cadastro do bloco e pagamento (Stripe), mais o sistema de check-in por QR code + geolocalização nos ensaios. Cada bloco tem o próprio slug (`seubloco.com/<slug>`) e as próprias cores.

## Kit base
timelabs (front em React)

## Stack específica deste projeto
- Vite + React 19 + TypeScript + Tailwind 3
- Supabase (`gpqzypsrrdfbjztylhze`): auth + Postgres com RLS, migrations em `supabase/migrations/`
- Stripe (checkout + webhook em `api/stripe-webhook.ts`)
- Resend pra e-mail (`server/email.ts`)
- Vercel: funções serverless em `api/`, código compartilhado do servidor em `server/`

## Comandos essenciais
```bash
npm install
npm run dev        # desenvolvimento
npm run build      # tsc + vite build
npm run check:api  # typecheck das funções /api
npm run lint
```
Não tem suíte de testes. O "teste" antes de commitar é `npm run build && npm run check:api && npm run lint`.

## Estrutura de pastas
- `src/pages/director/` e `src/pages/member/`: telas de diretoria e de membro
- `src/lib/pricing.ts`: cálculo de preço + `FIXED_DEALS` (acordos travados)
- `src/components/MemberImport.tsx` / `AttendanceImport.tsx`: importação por CSV (foi assim que os blocos vieram dos apps antigos)
- `promo-video/`: vídeo promocional (Remotion), projeto separado

## Contexto importante
- **Deploy automático:** push na `main` publica direto em www.seubloco.com. Commitar na main = mandar pra produção.
- Os apps provisórios antigos ficam nos repos `qr-abalo` e `qr-lavo`, cada um com o próprio banco Supabase. O `qr-abalo` já redireciona pra `seubloco.com/abalo-caxi`; o `qr-lavo` não tinha redirect na última conferência.
- O Supabase é free e pausa por inatividade. Se `*.supabase.co` não resolver, pedir pro Enzo reativar o projeto.
- Os segredos ficam no `.env` (não versionado). O valor de `RESEND_FROM_EMAIL` tem `<...>`, então não dá `source .env` no zsh: ler o arquivo via Python/Node.

## O que NÃO fazer neste projeto
- Não dar push na main sem o Enzo confirmar (vai direto pra produção, com blocos pagantes usando)
- Não rodar escrita/delete no banco de produção sem confirmar antes
- Não mexer em `FIXED_DEALS` sem acordo combinado com o Enzo

## Pessoas/sistemas envolvidos
- Blocos clientes: Abalô-Caxi (acordo à vista de R$360 até o Carnaval de 09/02/2027) e Lavô Tá Novo
- Os diretores de cada bloco usam o painel da diretoria
