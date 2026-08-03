import { clienteService } from './clienteService';
import { storage, STORAGE_KEYS } from './storage';
import { generateId } from '../utils/id';
import { nomeExibicaoCliente } from '../utils/format';
import type { Cliente, RegistroHistorico, StatusCliente } from '../types';

export type ModoImportacao = 'padrao' | 'pos_venda';

export interface LinhaImportada {
  linha: number;
  dados: Partial<Cliente>;
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
    ativo: 'fechado',
    perdido: 'perdido',
  };
  return mapa[v];
}

function paraNumero(valor: string | undefined): number | undefined {
  if (!valor) return undefined;
  let limpo = String(valor).replace(/[^\d,.-]/g, '').trim();
  if (!limpo) return undefined;

  const temVirgula = limpo.includes(',');
  const temPonto = limpo.includes('.');

  if (temVirgula && temPonto) {
    // Os dois aparecem: o último símbolo é o separador decimal de verdade.
    if (limpo.lastIndexOf(',') > limpo.lastIndexOf('.')) {
      // 1.234,56 (formato BR/europeu) -> remove pontos de milhar, vírgula vira ponto
      limpo = limpo.replace(/\./g, '').replace(',', '.');
    } else {
      // 1,234.56 (formato EUA) -> remove vírgulas de milhar
      limpo = limpo.replace(/,/g, '');
    }
  } else if (temVirgula) {
    // Só vírgula: trata como separador decimal (ex.: 174,33)
    limpo = limpo.replace(',', '.');
  }
  // Só ponto (ou nenhum separador): já está em formato válido para parseFloat.

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
      tpvAtual,
      posVenda: modo === 'pos_venda' || undefined,
    };

    if (!nomeFantasia && !dados.razaoSocial && !cnpj) {
      return { linha: i + 2, dados, erro: 'Linha vazia (sem nome, razão social nem CNPJ).', acao: 'ignorar' };
    }

    const cnpjLimpo = cnpj.replace(/\D/g, '');
    const jaExiste = cnpjLimpo && porCnpj.has(cnpjLimpo);

    return { linha: i + 2, dados, acao: jaExiste ? 'atualizar' : 'criar' };
  });
}

/**
 * Executa a importação de fato: cria clientes novos e atualiza os que já
 * existem (casados por CNPJ) — tudo numa ÚNICA gravação no fim, em vez de
 * uma gravação por linha. Isso evita que, ao importar muitos clientes de
 * uma vez, envios simultâneos para a nuvem cheguem fora de ordem e um
 * "sobrescreva" o outro, fazendo alguns clientes sumirem.
 */
export function executarImportacao(linhasImportadas: LinhaImportada[]): ResultadoImportacao {
  const lista = clienteService.listar();
  const porCnpj = new Map(lista.filter((c) => c.cnpj).map((c) => [c.cnpj.replace(/\D/g, ''), c]));

  let criados = 0;
  let atualizados = 0;
  let ignorados = 0;
  const novosRegistrosHistorico: { titulo: string; descricao: string; clienteNome: string; clienteId: string }[] = [];

  for (const item of linhasImportadas) {
    if (item.acao === 'ignorar') {
      ignorados++;
      continue;
    }

    const cnpjLimpo = (item.dados.cnpj ?? '').replace(/\D/g, '');
    const existente = item.acao === 'atualizar' ? porCnpj.get(cnpjLimpo) : undefined;

    if (existente) {
      const idx = lista.findIndex((c) => c.id === existente.id);
      if (idx !== -1) {
        lista[idx] = { ...lista[idx], ...item.dados };
        atualizados++;
        novosRegistrosHistorico.push({
          titulo: 'Edição de cliente',
          descricao: `Dados de ${nomeExibicaoCliente(lista[idx])} foram atualizados via importação.`,
          clienteId: lista[idx].id,
          clienteNome: nomeExibicaoCliente(lista[idx]),
        });
      }
      continue;
    }

    const novoCliente: Cliente = {
      id: generateId('cli'),
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
      tpvAtual: item.dados.tpvAtual,
      posVenda: item.dados.posVenda,
      dataCadastro: new Date().toISOString(),
    };
    lista.unshift(novoCliente);
    if (cnpjLimpo) porCnpj.set(cnpjLimpo, novoCliente);
    criados++;
    novosRegistrosHistorico.push({
      titulo: 'Cadastro de cliente',
      descricao: `${nomeExibicaoCliente(novoCliente)} foi adicionado via importação de planilha.`,
      clienteId: novoCliente.id,
      clienteNome: nomeExibicaoCliente(novoCliente),
    });
  }

  // Uma única gravação para todos os clientes...
  storage.save(STORAGE_KEYS.clientes, lista);

  // ...e uma única gravação para todo o histórico da importação.
  if (novosRegistrosHistorico.length > 0) {
    const historicoAtual = storage.list<RegistroHistorico>(STORAGE_KEYS.historico);
    const novosRegistros: RegistroHistorico[] = novosRegistrosHistorico.map((r) => ({
      id: generateId('hist'),
      tipo: 'cadastro',
      data: new Date().toISOString(),
      ...r,
    }));
    storage.save(STORAGE_KEYS.historico, [...novosRegistros, ...historicoAtual]);
  }

  return { criados, atualizados, ignorados };
}
