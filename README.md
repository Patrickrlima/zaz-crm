# Central do Vendedor — ZAZ CRM

Plataforma CRM para vendedores externos, desenvolvida como **PWA (Progressive Web App)** 100% front-end, sem backend nesta primeira versão. Todos os dados são armazenados no **LocalStorage** do navegador, organizados em uma camada de serviços (`src/services`) pensada para facilitar uma futura migração para API/banco de dados.

## Tecnologias

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- React Router DOM
- React Hook Form + Zod
- Lucide React (ícones)
- Recharts (gráficos)
- Framer Motion (animações)
- jsPDF + html2canvas (geração de PDF)
- date-fns
- vite-plugin-pwa (manifest + service worker)

## Como rodar o projeto

```bash
npm install
npm run dev
```

Abra http://localhost:5173 no navegador.

## Build de produção

```bash
npm run build
npm run preview
```

O build gera a pasta `dist/` já com `manifest.webmanifest` e service worker (via `vite-plugin-pwa`), pronta para publicar em qualquer hospedagem estática (Vercel, Netlify, etc.) e ser instalada como aplicativo (PWA) no computador ou celular.

## Estrutura de pastas

```
src/
  assets/            -> logo ZAZ e imagens
  components/
    layout/          -> Sidebar, Header, Footer, AppLayout
    dashboard/       -> Cards, Agenda do dia, Funil de vendas, Últimos clientes, Retornos pendentes
    clientes/        -> Form, Card, Filtro, Histórico
    agenda/          -> Form, Card, Calendário
    propostas/       -> Card, Lista/Detalhe
    simulador/       -> Calculadora, Resultado, Resumo, Taxas
    prospeccoes/     -> Kanban (drag and drop nativo)
    ui/              -> Modal, ConfirmDialog, EmptyState, StatusBadge
  pages/             -> Uma página por rota (Dashboard, Clientes, ClienteDetalhes, Agenda, Prospeccoes, Propostas, Simulador, Historico, Relatorios, Configuracoes)
  services/
    storage.ts       -> Serviço único de LocalStorage (save/get/remove/update/clear)
    clienteService.ts, agendaService.ts, propostaService.ts, simuladorService.ts, historicoService.ts, usuarioService.ts
    pdfService.ts    -> Geração de PDF da proposta com jsPDF
    seedService.ts   -> Popula dados de exemplo no primeiro acesso
  types/             -> Interfaces e tipos TypeScript do domínio
  utils/             -> Formatação (moeda, data, CNPJ, telefone) e geração de IDs
```

## Funcionalidades implementadas

- **Dashboard**: cards dinâmicos (clientes, retornos, negociações, propostas), agenda do dia, funil de vendas (gráfico doughnut), últimos clientes, retornos pendentes.
- **Clientes**: cadastro completo (CNPJ e telefone com máscara), listagem com busca/filtro por status, página de detalhe com abas (Visão geral, Histórico, Propostas, Tarefas), edição e exclusão.
- **Agenda**: calendário mensal, visualizações Dia/Semana/Mês, tipos de evento (visita, ligação, retorno, reunião, treinamento, envio de proposta).
- **Prospecções**: Kanban com 6 colunas e drag and drop nativo, atualizando o status do cliente.
- **Propostas**: criação, duplicação, alteração de status, geração de PDF com logo da ZAZ, exclusão.
- **Simulador**: calculadora de taxas (débito, crédito, Pix, voucher, Banricompras, antecipação, taxa personalizada), comparativo entre formas de pagamento, geração de PDF, salvar simulação e enviar direto para proposta.
- **Histórico**: linha do tempo de todas as atividades do sistema, com busca e filtro por tipo.
- **Relatórios**: gráficos de novos clientes por mês, visitas por mês, funil por estágio e propostas por status (Recharts).
- **Configurações**: dados do usuário, tema (claro/escuro — claro habilitado nesta versão), exportação/importação de backup (JSON) e limpeza de dados locais.
- **PWA**: manifest, ícones e service worker gerados automaticamente pelo `vite-plugin-pwa`, permitindo instalação no desktop e no celular com funcionamento offline básico (cache de assets).

## Próximos passos (fora do escopo desta versão)

A camada de serviços (`src/services`) foi desenhada para que a substituição do LocalStorage por chamadas HTTP a uma API REST exija apenas a troca da implementação interna de cada `*Service.ts`, sem alterar páginas ou componentes. Está preparado para evoluir com: API REST, PostgreSQL/Firebase/Supabase, login e multiusuário, sincronização online, integração com WhatsApp API, Google Maps e consulta de CNPJ, geração de propostas com IA, e dashboards para supervisores/coordenadores/administração.
