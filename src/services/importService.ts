import { clienteService } from './clienteService';
import { propostaService } from './propostaService';
import type { Cliente, StatusCliente } from '../types';

export type ModoImportacao = 'padrao' | 'pos_venda';

export interface LinhaImportada {
  linha: number;
  dados: Partial<Cliente>;
  tpvAtual?: number;
  erro?: string;
  acao: 'criar' | 'atualizar' | 'ignorar';
}

export interface ResultadoImportacao {
  criados: number;
  atualizados: number;
  ignorados: number;
}

// Aceita várias formas de escrever o mesmo campo (com/sem acento, maiúsculas, abreviações comuns de planilha).
const ALIASES: Record<keyof Pick<
  Cliente,
  | 'nomeFantasia'
  | 'razaoSocial'
  | 'cnpj'
  | 'telefone'
  | 'whatsapp'
  | 'email'
  | 'cidade'
  | 'estado'
  | 'endereco'
  | 'segmento'
  | 'responsavel'
  | 'observacoes'
  | 'mcvComprometido'
>, string[]> = {
  nomeFantasia: ['nome fantasia', 'nome', 'fantasia', 'empresa', 'cliente'],
  razaoSocial: ['razao social', 'razão social', 'razaosocial'],
  cnpj: ['cnpj', 'cpf/cnpj', 'cpf cnpj'],
  telefone: ['telefone', 'fone', 'tel'],
  whatsapp: ['whatsapp', 'whats', 'zap'],
  email: ['email', 'e-mail', 'e mail'],
  cidade: ['cidade', 'municipio', 'município'],
  estado: ['estado', 'uf'],
  endereco: ['endereco', 'endereço', 'rua', 'logradouro'],
  segmento: ['segmento', 'ramo', 'categoria'],
  responsavel: ['responsavel', 'responsável', 'vendedor'],
  observacoes: ['observacoes', 'observações', 'obs', 'notas'],
  mcvComprometido: ['mcv comprometido', 'mcv', 'valor comprometido', 'meta mensal'],
};

const ALIASES_TPV_ATUAL = ['tpv atual', 'tpv', 'valor atual', 'transacionado'];

const STATUS_VALIDOS: StatusCliente[] = [
  'novo_lead',
  'em_contato',
  'negociacao',
  'proposta_enviada',
  'fechado',
  'perdido',
];

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizarStatus(valor: string): StatusCliente | undefined {
  const v = normalizarTexto(valor).replace(/\s+/g, '_');
  if ((STATUS_VALIDOS as string[]).includes(v)) return v as StatusCliente;
  const mapa: Record<string, StatusCliente> = {
    novo: 'novo_lead',
    lead: 'novo_lead',
    contato: 'em_contato',
    negociando: 'negociacao',
    proposta: 'proposta_enviada',
    ganho: 'fechado',
    perdido: 'perdido',
  };
  return mapa[v];
}

function paraNumero(valor: string | undefined): number | undefined {
  if (!valor) return undefined;
  const limpo = String(valor).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3},)/g, '').replace(',', '.');
  const n = parseFloat(limpo);
  return Number.isFinite(n) ? n : undefined;
}

/** Lê um arquivo .csv, .xlsx ou .xls e devolve as linhas como objetos (cabeçalho -> valor). */
export async function lerArquivo(file: File): Promise<Record<string, string>[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const primeiraAba = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, string>>(primeiraAba, { defval: '', raw: false });
}

/** Converte as linhas cruas da planilha em dados de cliente, tentando casar as colunas automaticamente. */
export function mapearLinhas(linhas: Record<string, string>[], modo: ModoImportacao = 'padrao'): LinhaImportada[] {
  const existentes = clienteService.listar();
  const porCnpj = new Map(existentes.filter((c) => c.cnpj).map((c) => [c.cnpj.replace(/\D/g, ''), c]));

  return linhas.map((linha, i) => {
    const colunasNormalizadas = new Map(Object.keys(linha).map((k) => [normalizarTexto(k), linha[k]]));

    function pegar(campo: keyof typeof ALIASES): string {
      for (const alias of ALIASES[campo]) {
        const valor = colunasNormalizadas.get(alias);
        if (valor) return String(valor).trim();
      }
      return '';
    }

    const nomeFantasia = pegar('nomeFantasia');
    const cnpj = pegar('cnpj');
    const statusBruto = colunasNormalizadas.get('status') ?? '';

    let tpvAtual: number | undefined;
    for (const alias of ALIASES_TPV_ATUAL) {
      const valor = colunasNormalizadas.get(alias);
      if (valor) {
        tpvAtual = paraNumero(valor);
        break;
      }
    }

    const dados: Partial<Cliente> = {
      nomeFantasia,
      razaoSocial: pegar('razaoSocial'),
      cnpj,
      telefone: pegar('telefone'),
      whatsapp: pegar('whatsapp'),
      email: pegar('email'),
      cidade: pegar('cidade'),
      estado: pegar('estado').toUpperCase().slice(0, 2),
      endereco: pegar('endereco'),
      segmento: pegar('segmento'),
      responsavel: pegar('responsavel'),
      observacoes: pegar('observacoes'),
      status: (statusBruto && normalizarStatus(statusBruto)) || (modo === 'pos_venda' ? 'fechado' : 'novo_lead'),
      mcvComprometido: paraNumero(pegar('mcvComprometido')),
      posVenda: modo === 'pos_venda' || undefined,
    };

    if (!nomeFantasia && !dados.razaoSocial && !cnpj) {
      return { linha: i + 2, dados, erro: 'Linha vazia (sem nome, razão social nem CNPJ).', acao: 'ignorar' };
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '');
    const jaExiste = cnpjLimpo && porCnpj.has(cnpjLimpo);

    return { linha: i + 2, dados, tpvAtual, acao: jaExiste ? 'atualizar' : 'criar' };
  });
}

/**
 * Executa a importação de fato: cria clientes novos e atualiza os que já
 * existem (casados por CNPJ). Quando a linha traz "TPV Atual", cria também
 * uma proposta "aceita" nesse valor — assim o Dashboard Analítico (que soma
 * propostas aceitas) já contabiliza o valor sem precisar de um campo extra.
 */
export function executarImportacao(linhasImportadas: LinhaImportada[]): ResultadoImportacao {
  const existentes = clienteService.listar();
  const porCnpj = new Map(existentes.filter((c) => c.cnpj).map((c) => [c.cnpj.replace(/\D/g, ''), c]));

  let criados = 0;
  let atualizados = 0;
  let ignorados = 0;

  for (const item of linhasImportadas) {
    if (item.acao === 'ignorar') {
      ignorados++;
      continue;
    }

    let clienteId: string | null = null;
    let clienteNome = item.dados.nomeFantasia || item.dados.razaoSocial || '';

    if (item.acao === 'atualizar') {
      const cnpjLimpo = (item.dados.cnpj ?? '').replace(/\D/g, '');
      const existente = porCnpj.get(cnpjLimpo);
      if (existente) {
        const atualizado = clienteService.atualizar(existente.id, item.dados);
        clienteId = existente.id;
        clienteNome = atualizado?.nomeFantasia || clienteNome;
        atualizados++;
      }
    }

    if (!clienteId) {
      const criado = clienteService.criar({
        nomeFantasia: item.dados.nomeFantasia ?? '',
        razaoSocial: item.dados.razaoSocial ?? '',
        cnpj: item.dados.cnpj ?? '',
        telefone: item.dados.telefone ?? '',
        whatsapp: item.dados.whatsapp ?? '',
        email: item.dados.email ?? '',
        cidade: item.dados.cidade ?? '',
        estado: item.dados.estado ?? '',
        endereco: item.dados.endereco ?? '',
        segmento: item.dados.segmento ?? '',
        status: item.dados.status ?? 'novo_lead',
        responsavel: item.dados.responsavel ?? '',
        observacoes: item.dados.observacoes ?? '',
        mcvComprometido: item.dados.mcvComprometido,
        posVenda: item.dados.posVenda,
      });
      clienteId = criado.id;
      clienteNome = criado.nomeFantasia;
      criados++;
    }

    if (item.tpvAtual && item.tpvAtual > 0 && clienteId) {
      propostaService.criar({
        clienteId,
        clienteNome,
        valor: item.tpvAtual,
        parcelamento: 1,
        taxas: { debito: 0, credito: 0, pix: 0, voucher: 0, banricompras: 0, antecipacao: 0, personalizada: 0 },
        status: 'aceita',
      });
    }
  }

  return { criados, atualizados, ignorados };
}
