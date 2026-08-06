import { storage, STORAGE_KEYS } from './storage';
import { generateId } from '../utils/id';
import { historicoService } from './historicoService';
import { nomeExibicaoCliente } from '../utils/format';
import { STATUS_CLIENTE_PADRAO } from '../types';
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
      // Se o cliente já é cadastrado direto na coluna "Fechamentos do Mês", marca a data agora.
      dataFechamento:
        input.status === STATUS_CLIENTE_PADRAO.fechamentoMes ? new Date().toISOString() : input.dataFechamento,
      id: generateId('cli'),
      dataCadastro: new Date().toISOString(),
    };
    storage.addItem(STORAGE_KEYS.clientes, cliente);
    historicoService.registrar({
      tipo: 'cadastro',
      titulo: 'Cadastro de cliente',
      descricao: `${nomeExibicaoCliente(cliente)} foi adicionado como novo cliente.`,
      clienteId: cliente.id,
      clienteNome: nomeExibicaoCliente(cliente),
    });
    return cliente;
  },

  atualizar(id: string, partial: Partial<Cliente>): Cliente | null {
    const atualizado = storage.updateItem<Cliente>(STORAGE_KEYS.clientes, id, partial);
    if (atualizado) {
      historicoService.registrar({
        tipo: 'edicao',
        titulo: 'Edição de cliente',
        descricao: `Dados de ${nomeExibicaoCliente(atualizado)} foram atualizados.`,
        clienteId: atualizado.id,
        clienteNome: nomeExibicaoCliente(atualizado),
      });
    }
    return atualizado;
  },

  atualizarStatus(id: string, status: StatusCliente): Cliente | null {
    const antes = this.obter(id);
    const entrandoEmFechamentoMes =
      status === STATUS_CLIENTE_PADRAO.fechamentoMes && antes?.status !== STATUS_CLIENTE_PADRAO.fechamentoMes;

    const atualizado = this.atualizar(
      id,
      entrandoEmFechamentoMes ? { status, dataFechamento: new Date().toISOString() } : { status }
    );

    if (atualizado && entrandoEmFechamentoMes) {
      historicoService.registrar({
        tipo: 'conclusao',
        titulo: 'Fechamento do mês',
        descricao: `${nomeExibicaoCliente(atualizado)} foi movido para Fechamentos do Mês.`,
        clienteId: atualizado.id,
        clienteNome: nomeExibicaoCliente(atualizado),
      });
    }

    return atualizado;
  },

  remover(id: string): void {
    const cliente = this.obter(id);
    storage.removeItem<Cliente>(STORAGE_KEYS.clientes, id);
    if (cliente) {
      historicoService.registrar({
        tipo: 'exclusao',
        titulo: 'Exclusão de cliente',
        descricao: `${nomeExibicaoCliente(cliente)} foi removido da base de clientes.`,
      });
    }
  },

  /** Remove vários clientes de uma vez, numa única gravação (evita corrida de sincronização em massa). */
  removerVarios(ids: string[]): void {
    const idsSet = new Set(ids);
    const removidos = this.listar().filter((c) => idsSet.has(c.id));
    const restantes = storage.list<Cliente>(STORAGE_KEYS.clientes).filter((c) => !idsSet.has(c.id));
    storage.save(STORAGE_KEYS.clientes, restantes);

    if (removidos.length > 0) {
      const historicoAtual = storage.list(STORAGE_KEYS.historico);
      const novosRegistros = removidos.map((cliente) => ({
        id: generateId('hist'),
        tipo: 'exclusao' as const,
        titulo: 'Exclusão de cliente',
        descricao: `${nomeExibicaoCliente(cliente)} foi removido da base de clientes.`,
        data: new Date().toISOString(),
      }));
      storage.save(STORAGE_KEYS.historico, [...novosRegistros, ...historicoAtual]);
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
