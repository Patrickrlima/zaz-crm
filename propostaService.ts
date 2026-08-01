import { storage, STORAGE_KEYS } from './storage';
import { generateId } from '../utils/id';
import { historicoService } from './historicoService';
import type { Proposta } from '../types';

export const propostaService = {
  listar(): Proposta[] {
    return storage
      .list<Proposta>(STORAGE_KEYS.propostas)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  },

  listarPorCliente(clienteId: string): Proposta[] {
    return this.listar().filter((p) => p.clienteId === clienteId);
  },

  obter(id: string): Proposta | undefined {
    return storage.findItem<Proposta>(STORAGE_KEYS.propostas, id);
  },

  criar(input: Omit<Proposta, 'id' | 'data' | 'status'> & { status?: Proposta['status'] }): Proposta {
    const proposta: Proposta = {
      ...input,
      id: generateId('prop'),
      data: new Date().toISOString(),
      status: input.status ?? 'enviada',
    };
    storage.addItem(STORAGE_KEYS.propostas, proposta);
    historicoService.registrar({
      tipo: 'proposta',
      titulo: 'Proposta enviada',
      descricao: `Proposta no valor de ${proposta.valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })} enviada para ${proposta.clienteNome}.`,
      clienteId: proposta.clienteId,
      clienteNome: proposta.clienteNome,
    });
    return proposta;
  },

  duplicar(id: string): Proposta | null {
    const original = this.obter(id);
    if (!original) return null;
    return this.criar({
      clienteId: original.clienteId,
      clienteNome: original.clienteNome,
      valor: original.valor,
      parcelamento: original.parcelamento,
      taxas: original.taxas,
      observacoes: original.observacoes,
      simulacaoId: original.simulacaoId,
    });
  },

  atualizar(id: string, partial: Partial<Proposta>): Proposta | null {
    return storage.updateItem<Proposta>(STORAGE_KEYS.propostas, id, partial);
  },

  atualizarStatus(id: string, status: Proposta['status']): Proposta | null {
    return this.atualizar(id, { status });
  },

  remover(id: string): void {
    storage.removeItem<Proposta>(STORAGE_KEYS.propostas, id);
  },

  contarEsteMes(): number {
    const agora = new Date();
    return this.listar().filter((p) => {
      const d = new Date(p.data);
      return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
    }).length;
  },
};
