import { Link } from 'react-router-dom';
import { Phone, MapPin, Users, Send, CheckCircle2, Clock, GraduationCap, Plus } from 'lucide-react';
import type { EventoAgenda } from '../../types';
import { TIPO_EVENTO_LABEL } from '../../types';

const ICONS: Record<EventoAgenda['tipo'], React.ComponentType<{ size?: number; className?: string }>> = {
  visita: MapPin,
  ligacao: Phone,
  retorno: Clock,
  reuniao: Users,
  treinamento: GraduationCap,
  proposta: Send,
};

interface AgendaHojeProps {
  eventos: EventoAgenda[];
  onConcluir: (id: string) => void;
  onNovaAtividade: () => void;
}

export function AgendaHoje({ eventos, onConcluir, onNovaAtividade }: AgendaHojeProps) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-ink">Agenda de hoje</h3>
        <Link to="/agenda" className="text-xs font-medium text-zaz-purple hover:underline">
          Ver agenda completa →
        </Link>
      </div>

      {eventos.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-faint">Nenhuma atividade agendada para hoje.</p>
      ) : (
        <div className="space-y-1">
          {eventos.map((evento) => {
            const Icon = ICONS[evento.tipo];
            return (
              <div
                key={evento.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-alt"
              >
                <div className="flex w-14 shrink-0 flex-col items-center">
                  <span className="text-sm font-semibold text-ink">{evento.hora}</span>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-alt text-ink-soft">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-faint">{TIPO_EVENTO_LABEL[evento.tipo]}</p>
                  <p className="truncate text-sm font-medium text-ink">{evento.clienteNome}</p>
                </div>
                {evento.status === 'concluido' ? (
                  <span className="badge shrink-0 bg-green-50 text-green-600">
                    <CheckCircle2 size={12} className="mr-1" /> Concluído
                  </span>
                ) : (
                  <button
                    onClick={() => onConcluir(evento.id)}
                    className="badge shrink-0 bg-amber-50 text-amber-600 hover:bg-amber-100"
                  >
                    Pendente
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onNovaAtividade}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 py-2.5 text-sm font-medium text-zaz-purple hover:bg-accent-soft/50"
      >
        <Plus size={16} /> Adicionar atividade
      </button>
    </div>
  );
}
