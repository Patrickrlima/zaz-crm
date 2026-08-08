// ===================== Usuário =====================
export interface Usuario {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone?: string;
  fotoUrl?: string;
}

// ===================== Cliente =====================
/**
 * O status de um cliente é um texto livre (não um enum fechado) para permitir
 * colunas personalizadas no Kanban de Prospecções. As 6 constantes abaixo
 * continuam sendo os valores padrão usados no cadastro, nos filtros e nos
 * gráficos (Dashboard, Relatórios) — colunas extras criadas no Kanban só
 * aparecem lá, sem afetar essas outras telas.
 */
export type StatusCliente = string;

export const STATUS_CLIENTE_PADRAO = {
  novoLead: 'novo_lead',
  emContato: 'em_contato',
  negociacao: 'negociacao',
  propostaEnviada: 'proposta_enviada',
  fechado: 'fechado',
  perdido: 'perdido',
} as const;

export interface Cliente {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  cpf?: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cidade: string;
  estado: string;
  endereco: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  segmento: string;
  status: StatusCliente;
  responsavel: string;
  observacoes: string;
  faturamentoEstimado?: number;
  mcvComprometido?: number;
  /** Valor já transacionado na maquininha neste mês. Editável diretamente (ou preenchido por importação). */
  tpvAtual?: number;
  ticketMedio?: number;
  situacaoCadastral?: string;
  cnaePrincipal?: string;
  dataAbertura?: string;
  /** Cliente vindo da planilha de pós-venda (conta nas métricas do Dashboard Analítico). */
  posVenda?: boolean;
  dataCadastro: string; // ISO
}

export const STATUS_CLIENTE_LABEL: Record<string, string> = {
  novo_lead: 'Novo lead',
  em_contato: 'Em contato',
  negociacao: 'Negociação',
  proposta_enviada: 'Proposta enviada',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

export const STATUS_CLIENTE_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  novo_lead: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' },
  em_contato: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' },
  negociacao: { bg: 'bg-teal-50', text: 'text-teal-600', dot: 'bg-teal-500' },
  proposta_enviada: { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' },
  fechado: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
  perdido: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
};

/** Cor de reserva para colunas personalizadas do Kanban sem cor própria definida. */
export const STATUS_CLIENTE_COLOR_PADRAO = { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };

// ===================== Agenda =====================
export type TipoEvento = 'visita' | 'ligacao' | 'retorno' | 'reuniao' | 'treinamento' | 'proposta';
export type StatusEvento = 'pendente' | 'concluido' | 'cancelado';

export interface EventoAgenda {
  id: string;
  clienteId: string;
  clienteNome: string;
  tipo: TipoEvento;
  data: string; // ISO date (yyyy-MM-dd)
  hora: string; // HH:mm
  status: StatusEvento;
  observacoes?: string;
}

export const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  visita: 'Visita',
  ligacao: 'Ligação',
  retorno: 'Retorno',
  reuniao: 'Reunião',
  treinamento: 'Treinamento',
  proposta: 'Envio de proposta',
};

// ===================== Simulador =====================
export interface TaxasSimulador {
  debito: number;
  credito: number;
  pix: number;
  voucher: number;
  banricompras: number;
  antecipacao: number;
  personalizada: number;
}

export interface Simulacao {
  id: string;
  clienteId?: string;
  clienteNome?: string;
  valorVenda: number;
  parcelas: number;
  formaPagamento: keyof TaxasSimulador;
  taxas: TaxasSimulador;
  valorLiquido: number;
  economia: number;
  data: string; // ISO
}

// ===================== Propostas =====================
export type StatusProposta = 'enviada' | 'aceita' | 'recusada' | 'expirada';

export interface Proposta {
  id: string;
  clienteId: string;
  clienteNome: string;
  valor: number;
  parcelamento: number;
  taxas: TaxasSimulador;
  data: string; // ISO
  status: StatusProposta;
  observacoes?: string;
  simulacaoId?: string;
}

export const STATUS_PROPOSTA_LABEL: Record<StatusProposta, string> = {
  enviada: 'Enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
  expirada: 'Expirada',
};

export const STATUS_PROPOSTA_COLOR: Record<StatusProposta, { bg: string; text: string }> = {
  enviada: { bg: 'bg-blue-50', text: 'text-blue-600' },
  aceita: { bg: 'bg-green-50', text: 'text-green-600' },
  recusada: { bg: 'bg-red-50', text: 'text-red-600' },
  expirada: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

// ===================== Histórico =====================
export type TipoHistorico =
  | 'cadastro'
  | 'edicao'
  | 'ligacao'
  | 'visita'
  | 'proposta'
  | 'simulacao'
  | 'conclusao'
  | 'exclusao';

export interface RegistroHistorico {
  id: string;
  clienteId?: string;
  clienteNome?: string;
  tipo: TipoHistorico;
  titulo: string;
  descricao: string;
  data: string; // ISO datetime
}

export const TIPO_HISTORICO_LABEL: Record<TipoHistorico, string> = {
  cadastro: 'Cadastro',
  edicao: 'Edição',
  ligacao: 'Ligação',
  visita: 'Visita',
  proposta: 'Proposta',
  simulacao: 'Simulação',
  conclusao: 'Conclusão',
  exclusao: 'Exclusão',
};

// ===================== Configurações =====================
export interface Configuracoes {
  tema: 'claro' | 'escuro';
  usuario: Usuario;
}

// ===================== Kanban / Prospecções =====================
export const KANBAN_COLUNAS: StatusCliente[] = [
  'novo_lead',
  'em_contato',
  'negociacao',
  'proposta_enviada',
  'fechado',
  'perdido',
];
