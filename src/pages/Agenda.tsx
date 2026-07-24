import { useEffect, useMemo, useState } from 'react';
import { Plus, CalendarDays } from 'lucide-react';
import { AgendaCalendario } from '../components/agenda/AgendaCalendario';
import { AgendaCard } from '../components/agenda/AgendaCard';
import { EventoForm, type EventoFormValues } from '../components/agenda/EventoForm';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { agendaService } from '../services/agendaService';
import { clienteService } from '../services/clienteService';
import type { Cliente, EventoAgenda } from '../types';

type Visualizacao = 'dia' | 'semana' | 'mes';

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Agenda() {
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(hojeISO());
  const [visualizacao, setVisualizacao] = useState<Visualizacao>('dia');
  const [modalAberto, setModalAberto] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  function carregar() {
    setEventos(agendaService.listar());
    setClientes(clienteService.listar());
  }

  useEffect(() => {
    carregar();
  }, []);

  const eventosFiltrados = useMemo(() => {
    const base = new Date(`${dataSelecionada}T00:00:00`);

    if (visualizacao === 'dia') {
      return eventos.filter((e) => e.data === dataSelecionada);
    }

    if (visualizacao === 'semana') {
      const inicio = new Date(base);
      inicio.setDate(inicio.getDate() - inicio.getDay());
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + 6);
      return eventos.filter((e) => {
        const d = new Date(`${e.data}T00:00:00`);
        return d >= inicio && d <= fim;
      });
    }

    // mês
    return eventos.filter((e) => {
      const d = new Date(`${e.data}T00:00:00`);
      return d.getMonth() === base.getMonth() && d.getFullYear() === base.getFullYear();
    });
  }, [eventos, dataSelecionada, visualizacao]);

  function handleCriar(values: EventoFormValues) {
    const cliente = clientes.find((c) => c.id === values.clienteId);
    agendaService.criar({
      clienteId: values.clienteId,
      clienteNome: cliente?.nomeFantasia ?? '',
      tipo: values.tipo,
      data: values.data,
      hora: values.hora,
      observacoes: values.observacoes,
    });
    setModalAberto(false);
    carregar();
  }

  function handleConcluir(id: string) {
    agendaService.concluir(id);
    carregar();
  }

  function handleRemover() {
    if (removendoId) agendaService.remover(removendoId);
    setRemovendoId(null);
    carregar();
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <AgendaCalendario eventos={eventos} selecionado={dataSelecionada} onSelecionar={setDataSelecionada} />
          <button onClick={() => setModalAberto(true)} className="btn-primary w-full">
            <Plus size={16} /> Nova atividade
          </button>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-xl bg-surface-alt p-1">
              {(['dia', 'semana', 'mes'] as Visualizacao[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVisualizacao(v)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                    visualizacao === v ? 'bg-white text-zaz-purple shadow-sm' : 'text-ink-soft'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <span className="text-xs text-ink-faint">{eventosFiltrados.length} atividade(s)</span>
          </div>

          {eventosFiltrados.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={20} />}
              title="Nenhuma atividade neste período"
              description="Adicione uma nova atividade para começar a organizar sua agenda."
            />
          ) : (
            <div className="space-y-2">
              {eventosFiltrados.map((evento) => (
                <AgendaCard
                  key={evento.id}
                  evento={evento}
                  onConcluir={handleConcluir}
                  onRemover={(id) => setRemovendoId(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Nova atividade">
        <EventoForm
          clientes={clientes}
          defaultValues={{ data: dataSelecionada }}
          onSubmit={handleCriar}
          onCancel={() => setModalAberto(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!removendoId}
        title="Remover atividade"
        message="Tem certeza que deseja remover esta atividade da agenda?"
        confirmLabel="Remover"
        onConfirm={handleRemover}
        onCancel={() => setRemovendoId(null)}
      />
    </div>
  );
}
