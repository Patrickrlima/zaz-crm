import { storage, STORAGE_KEYS } from './storage';
import { generateId } from '../utils/id';
import type { RegistroHistorico, TipoHistorico } from '../types';

export const historicoService = {
  listar(): RegistroHistorico[] {
    return storage
      .list<RegistroHistorico>(STORAGE_KEYS.historico)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  },

  listarPorCliente(clienteId: string): RegistroHistorico[] {
    return this.listar().filter((h) => h.clienteId === clienteId);
  },

  registrar(entrada: {
    tipo: TipoHistorico;
    titulo: string;
    descricao: string;
    clienteId?: string;
    clienteNome?: string;
  }): RegistroHistorico {
    const registro: RegistroHistorico = {
      id: generateId('hist'),
      data: new Date().toISOString(),
      ...entrada,
    };
    return storage.addItem(STORAGE_KEYS.historico, registro);
  },

  remover(id: string): void {
    storage.removeItem<RegistroHistorico>(STORAGE_KEYS.historico, id);
  },
};
