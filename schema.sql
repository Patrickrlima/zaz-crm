-- Execute este script no Supabase: Painel do projeto > SQL Editor > New query > colar e "Run".
--
-- Cria a tabela que guarda os dados do CRM (clientes, agenda, histórico,
-- propostas, simulações e usuário), sincronizados entre dispositivos.
-- Row Level Security garante que cada usuário só enxerga e altera os
-- próprios dados — mesmo que dois vendedores usem o mesmo projeto Supabase.

create table if not exists public.dados_crm (
  user_id uuid not null references auth.users(id) on delete cascade,
  chave text not null,
  valor jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, chave)
);

alter table public.dados_crm enable row level security;

-- Cada usuário só pode ler/gravar/atualizar/excluir as próprias linhas.
create policy "usuarios leem seus proprios dados"
  on public.dados_crm for select
  using (auth.uid() = user_id);

create policy "usuarios inserem seus proprios dados"
  on public.dados_crm for insert
  with check (auth.uid() = user_id);

create policy "usuarios atualizam seus proprios dados"
  on public.dados_crm for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "usuarios excluem seus proprios dados"
  on public.dados_crm for delete
  using (auth.uid() = user_id);

-- Habilita a replicação em tempo real (Realtime) para esta tabela.
alter publication supabase_realtime add table public.dados_crm;
