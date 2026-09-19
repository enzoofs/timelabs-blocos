-- Guarda o WhatsApp de quem cadastrou o bloco, pra poder criar o
-- primeiro diretor automaticamente assim que o pagamento confirma
-- (mesmo esquema de login automático: e-mail + 6 últimos dígitos do
-- WhatsApp como senha). Sem isso, ninguém tinha como entrar no
-- sistema depois de pagar.
alter table public.blocos add column if not exists contact_whatsapp text;
