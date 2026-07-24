import { storage, STORAGE_KEYS } from './storage';
import { generateId } from '../utils/id';
import { historicoService } from './historicoService';
import type { Cliente, StatusCliente } from '../types';

export type NovoClienteInput = Omit<Cliente, 'id' | 'dataCadastro'>;

export const clienteService = {
  listar(): Cliente[] {
    return storage
      .list<Cliente>(STORAGE_KEYS.clientes)
      .sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime());
  },

  obter(id: string): Cliente | undefined {
    return storage.findItem<Cliente>(STORAGE_KEYS.clientes, id);
  },

  criar(input: NovoClienteInput): Cliente {
    const cliente: Cliente = {
      ...input,
      id: generateId('cli'),
      dataCadastro: new Date().toISOString(),
    };
    storage.addItem(STORAGE_KEYS.clientes, cliente);
    historicoService.registrar({
      tipo: 'cadastro',
      titulo: 'Cadastro de cliente',
      descricao: `${cliente.nomeFantasia} foi adicionado como novo cliente.`,
      clienteId: cliente.id,
      clienteNome: cliente.nomeFantasia,
    });
    return cliente;
  },

  atualizar(id: string, partial: Partial<Cliente>): Cliente | null {
    const atualizado = storage.updateItem<Cliente>(STORAGE_KEYS.clientes, id, partial);
    if (atualizado) {
      historicoService.registrar({
        tipo: 'edicao',
        titulo: 'Edição de cliente',
        descricao: `Dados de ${atualizado.nomeFantasia} foram atualizados.`,
        clienteId: atualizado.id,
        clienteNome: atualizado.nomeFantasia,
      });
    }
    return atualizado;
  },

  atualizarStatus(id: string, status: StatusCliente): Cliente | null {
    return this.atualizar(id, { status });
  },

  remover(id: string): void {
    const cliente = this.obter(id);
    storage.removeItem<Cliente>(STORAGE_KEYS.clientes, id);
    if (cliente) {
      historicoService.registrar({
        tipo: 'exclusao',
        titulo: 'Exclusão de cliente',
        descricao: `${cliente.nomeFantasia} foi removido da base de clientes.`,
      });
    }
  },

  contar(): number {
    return this.listar().length;
  },

  adicionadosNaSemana(): number {
    const umaSemanaAtras = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.listar().filter((c) => new Date(c.dataCadastro).getTime() >= umaSemanaAtras).length;
  },
};
