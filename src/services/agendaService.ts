import { storage, STORAGE_KEYS } from './storage';
import { generateId } from '../utils/id';
import { historicoService } from './historicoService';
import type { EventoAgenda, StatusEvento } from '../types';
import { TIPO_EVENTO_LABEL } from '../types';

export type NovoEventoInput = Omit<EventoAgenda, 'id' | 'status'> & { status?: StatusEvento };

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const agendaService = {
  listar(): EventoAgenda[] {
    return storage
      .list<EventoAgenda>(STORAGE_KEYS.agenda)
      .sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`));
  },

  listarPorCliente(clienteId: string): EventoAgenda[] {
    return this.listar().filter((e) => e.clienteId === clienteId);
  },

  listarPorData(dataISO: string): EventoAgenda[] {
    return this.listar().filter((e) => e.data === dataISO);
  },

  listarHoje(): EventoAgenda[] {
    return this.listarPorData(hojeISO());
  },

  retornosPendentes(): EventoAgenda[] {
    return this.listar().filter((e) => e.tipo === 'retorno' && e.status === 'pendente');
  },

  criar(input: NovoEventoInput): EventoAgenda {
    const evento: EventoAgenda = {
      ...input,
      id: generateId('evt'),
      status: input.status ?? 'pendente',
    };
    storage.addItem(STORAGE_KEYS.agenda, evento);
    historicoService.registrar({
      tipo: evento.tipo === 'visita' ? 'visita' : evento.tipo === 'ligacao' ? 'ligacao' : 'cadastro',
      titulo: `${TIPO_EVENTO_LABEL[evento.tipo]} agendada`,
      descricao: `${TIPO_EVENTO_LABEL[evento.tipo]} com ${evento.clienteNome} agendada para ${evento.data} às ${evento.hora}.`,
      clienteId: evento.clienteId,
      clienteNome: evento.clienteNome,
    });
    return evento;
  },

  atualizar(id: string, partial: Partial<EventoAgenda>): EventoAgenda | null {
    return storage.updateItem<EventoAgenda>(STORAGE_KEYS.agenda, id, partial);
  },

  concluir(id: string): EventoAgenda | null {
    const evento = this.atualizar(id, { status: 'concluido' });
    if (evento) {
      historicoService.registrar({
        tipo: 'conclusao',
        titulo: `${TIPO_EVENTO_LABEL[evento.tipo]} concluída`,
        descricao: `${TIPO_EVENTO_LABEL[evento.tipo]} com ${evento.clienteNome} foi marcada como concluída.`,
        clienteId: evento.clienteId,
        clienteNome: evento.clienteNome,
      });
    }
    return evento;
  },

  remover(id: string): void {
    storage.removeItem<EventoAgenda>(STORAGE_KEYS.agenda, id);
  },
};
