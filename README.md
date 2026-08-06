# Central do Vendedor — ZAZ CRM

Plataforma de CRM para vendedores externos da ZAZ Vendas / Vero Banrisul, construída como **PWA (Progressive Web App)**: funciona no navegador, pode ser instalada como aplicativo no celular e no computador, e sincroniza dados em tempo real entre todos os dispositivos do vendedor.

🔗 **Acesse em produção:** https://patrickrlima.github.io/zaz-crm/

---

## Visão geral

O sistema cobre o ciclo completo de um vendedor de maquininhas de cartão: prospecção, agenda de visitas, simulação de taxas, envio de propostas, acompanhamento de pós-venda e relatórios analíticos — tudo em um único painel, acessível de qualquer lugar.

## Principais funcionalidades

### Gestão comercial
- **Dashboard** (dois modos, trocáveis em Configurações → Aparência):
  - **Padrão**: agenda do dia, funil de vendas, últimos clientes, retornos pendentes.
  - **Analítico**: cards de Total de clientes, MCV comprometido, TPV atual e projetado, gráfico de evolução, gauge de performance, ranking por cliente e lista de clientes que precisam de atenção.
- **Clientes**: cadastro com todos os campos opcionais (permite cadastro parcial), busca automática de dados via **CNPJ** (BrasilAPI, com fallback ReceitaWS), importação em massa por planilha (.csv/.xlsx/.xls) com reconhecimento automático de colunas, atualização automática por CNPJ duplicado.
- **Prospecções**: Kanban com 6 colunas e drag-and-drop, largura das colunas ajustável.
- **Agenda**: calendário mensal com visualizações Dia/Semana/Mês, tipos de evento (visita, ligação, retorno, reunião, treinamento, envio de proposta).
- **Propostas**: criação, duplicação, mudança de status, geração de PDF com identidade visual da ZAZ.
- **Pós-venda**: página dedicada para acompanhar clientes já fechados — importação própria de planilha, dashboard analítico exclusivo (separado do dashboard geral), e visualização individual do desempenho de cada cliente (acessível pelo botão ☰ dentro da tela).
- **Histórico**: linha do tempo de toda atividade do sistema, com clientes clicáveis.
- **Relatórios**: gráficos de clientes/visitas por mês, funil por estágio, propostas por status — exportáveis em PDF.
- **Simulador**: link direto para o simulador de taxas externo do vendedor (Simulador-Vero), acessível pelo menu lateral e pela ficha do cliente.

### Conta e sincronização
- **Login por e-mail/senha** (Supabase Auth) com recuperação de senha por e-mail.
- **Sincronização em tempo real** entre celular, tablet e computador via Supabase (Postgres + Realtime) — qualquer cadastro ou edição aparece automaticamente nos outros dispositivos em segundos.
- **Isolamento entre contas**: cada login só acessa os próprios dados (Row Level Security no banco), mesmo compartilhando o mesmo projeto Supabase entre vários vendedores.
- Funciona também **sem conta configurada** (modo 100% local, guardando tudo no LocalStorage do navegador) — útil para testes ou uso individual sem nuvem.

### Personalização
- **Modo claro/escuro**, aplicado instantaneamente e salvo por dispositivo.
- **Cor de destaque personalizável** (Configurações → Aparência) — 6 cores prontas ou qualquer cor customizada.
- **Foto de perfil** e nome exibidos no cabeçalho e no menu lateral.
- Menu lateral recolhível manualmente (ícone de seta), com preferência salva.

### Instalação como app
- PWA completo: manifest, ícones e service worker com **atualização automática** (o app verifica por versões novas sozinho, sem precisar limpar cache).
- Pode ser instalado na tela inicial do celular e como app no computador.

---

## Stack técnica

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4**
- **React Router DOM** (HashRouter, compatível com GitHub Pages)
- **Supabase** (Postgres + Auth + Realtime) — sincronização e login
- **React Hook Form + Zod** — formulários e validação
- **Recharts** — gráficos
- **Framer Motion** — animações
- **jsPDF + html2canvas** — geração de PDF (propostas e relatórios)
- **SheetJS (xlsx)** — importação de planilhas
- **Lucide React** — ícones
- **vite-plugin-pwa** — manifest + service worker

## Como rodar localmente

```bash
npm install
cp .env.example .env   # preencha com as chaves do seu projeto Supabase
npm run dev
```

Abra o endereço mostrado no terminal (ex: `http://localhost:5173/zaz-crm/`).

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (gratuito, sem cartão de crédito).
2. No **SQL Editor**, rode o script `supabase/schema.sql` — cria a tabela `dados_crm` e as regras de segurança (RLS).
3. Em **Authentication → Users**, cadastre os e-mails/senhas dos vendedores que vão usar o sistema.
4. Em **Authentication → URL Configuration**, defina a Site URL e adicione a URL do GitHub Pages em Redirect URLs (necessário para o link de recuperação de senha funcionar).
5. Copie **Project URL** e **anon public key** (Project Settings → API) para o `.env`.

Sem essas variáveis configuradas, o app funciona normalmente  em modo local (sem login, sem sincronização).

## Build e deploy

```bash
npm run build
```

Gera a pasta `dist/`, pronta para qualquer hospedagem estática. O repositório já inclui um workflow do **GitHub Actions** (`.github/workflows/deploy.yml`) que builda e publica automaticamente no GitHub Pages a cada push na branch `main`, lendo as chaves do Supabase dos **Secrets** do repositório (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).

## Estrutura de pastas

```
src/
  assets/            -> logo ZAZ e imagens
  components/
    auth/            -> Login, recuperação de senha
    layout/          -> Sidebar, Header, Footer, AppLayout
    dashboard/       -> Cards, Dashboard Analítico, Funil de vendas, etc.
    clientes/        -> Form, Card, Filtro, Histórico, Importação
    agenda/          -> Form, Card, Calendário
    propostas/       -> Card, Lista/Detalhe
    prospeccoes/     -> Kanban (drag and drop nativo)
    ui/              -> Modal, ConfirmDialog, EmptyState, StatusBadge
  contexts/
    ThemeContext.tsx -> Tema, estilo de dashboard, cor de destaque
  hooks/
    useCloudSyncRefresh.ts -> Atualiza a tela quando chega dado de outro dispositivo
  pages/             -> Uma página por rota
  services/
    storage.ts        -> Camada de persistência local (LocalStorage)
    cloudSync.ts       -> Sincronização em tempo real com o Supabase
    authService.ts     -> Login, logout, recuperação de senha
    supabaseClient.ts  -> Inicialização do cliente Supabase
    cnpjService.ts      -> Consulta pública de CNPJ
    importService.ts    -> Importação de clientes via planilha
    exportPdfService.ts, pdfService.ts -> Geração de PDF
    clienteService.ts, agendaService.ts, propostaService.ts, historicoService.ts, usuarioService.ts
  types/             -> Interfaces e tipos TypeScript do domínio
  utils/             -> Formatação, geração de IDs, redimensionamento de imagem

supabase/
  schema.sql         -> Script de criação da tabela e regras de segurança
```

## Próximos passos possíveis

- Notificações automáticas de retorno pendente
- Painel consolidado para supervisores (visão de toda a equipe)
- Anexos de documentos por cliente (Supabase Storage)
- Busca global (Ctrl+K)
