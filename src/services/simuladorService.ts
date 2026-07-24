import { storage, STORAGE_KEYS } from './storage';
import { generateId } from '../utils/id';
import { historicoService } from './historicoService';
import type { Simulacao, TaxasSimulador } from '../types';

export const TAXAS_PADRAO: TaxasSimulador = {
  debito: 1.39,
  credito: 3.15,
  pix: 0.0,
  voucher: 2.5,
  banricompras: 2.2,
  antecipacao: 1.8,
  personalizada: 2.0,
};

export interface ResultadoSimulacao {
  valorBruto: number;
  taxaAplicada: number;
  valorTaxa: number;
  valorLiquido: number;
  economiaVsCredito: number;
  economiaPercentual: number;
  valorPorParcela: number;
}

export function calcular(
  valorVenda: number,
  parcelas: number,
  formaPagamento: keyof TaxasSimulador,
  taxas: TaxasSimulador
): ResultadoSimulacao {
  const taxaBase = taxas[formaPagamento] ?? 0;
  // Cada parcela adicional (acima da 1ª) soma a taxa de antecipação, simulando o custo de antecipar o recebível.
  const taxaAntecipacao = formaPagamento === 'credito' && parcelas > 1 ? taxas.antecipacao * (parcelas - 1) * 0.15 : 0;
  const taxaAplicada = taxaBase + taxaAntecipacao;
  const valorTaxa = valorVenda * (taxaAplicada / 100);
  const valorLiquido = valorVenda - valorTaxa;

  const valorTaxaCredito = valorVenda * (taxas.credito / 100);
  const economiaVsCredito = valorTaxaCredito - valorTaxa;
  const economiaPercentual = valorVenda > 0 ? (economiaVsCredito / valorVenda) * 100 : 0;

  return {
    valorBruto: valorVenda,
    taxaAplicada,
    valorTaxa,
    valorLiquido,
    economiaVsCredito,
    economiaPercentual,
    valorPorParcela: parcelas > 0 ? valorVenda / parcelas : valorVenda,
  };
}

export const simuladorService = {
  listar(): Simulacao[] {
    return storage
      .list<Simulacao>(STORAGE_KEYS.simulacoes)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  },

  listarPorCliente(clienteId: string): Simulacao[] {
    return this.listar().filter((s) => s.clienteId === clienteId);
  },

  salvar(input: Omit<Simulacao, 'id' | 'data'>): Simulacao {
    const simulacao: Simulacao = {
      ...input,
      id: generateId('sim'),
      data: new Date().toISOString(),
    };
    storage.addItem(STORAGE_KEYS.simulacoes, simulacao);
    historicoService.registrar({
      tipo: 'simulacao',
      titulo: 'Simulação salva',
      descricao: `Simulação de venda no valor de ${simulacao.valorVenda.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })} foi salva.`,
      clienteId: simulacao.clienteId,
      clienteNome: simulacao.clienteNome,
    });
    return simulacao;
  },

  remover(id: string): void {
    storage.removeItem<Simulacao>(STORAGE_KEYS.simulacoes, id);
  },

  obterTaxas(): TaxasSimulador {
    return storage.get<TaxasSimulador>('zaz_crm_taxas', TAXAS_PADRAO);
  },

  salvarTaxas(taxas: TaxasSimulador): void {
    storage.save('zaz_crm_taxas', taxas);
  },
};
