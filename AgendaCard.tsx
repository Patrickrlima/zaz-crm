import { Phone, MapPin, Users, Send, Clock, GraduationCap, CheckCircle2, Trash2 } from 'lucide-react';
import type { EventoAgenda } from '../../types';
import { TIPO_EVENTO_LABEL } from '../../types';
import { formatDate } from '../../utils/format';

const ICONS: Record<EventoAgenda['tipo'], React.ComponentType<{ size?: number; className?: string }>> = {
  visita: MapPin,
  ligacao: Phone,
  retorno: Clock,
  reuniao: Users,
  treinamento: GraduationCap,
  proposta: Send,
};

const TIPO_COLOR: Record<EventoAgenda['tipo'], string> = {
  visita: 'bg-blue-50 text-brand-blue',
  ligacao: 'bg-green-50 text-brand-green',
  retorno: 'bg-red-50 text-brand-red',
  reuniao: 'bg-purple-50 text-zaz-purple',
  treinamento: 'bg-indigo-50 text-indigo-600',
  proposta: 'bg-orange-50 text-brand-orange',
};

interface AgendaCardProps {
  evento: EventoAgenda;
  onConcluir?: (id: string) => void;
  onRemover?: (id: string) => void;
}

export function AgendaCard({ evento, onConcluir, onRemover }: AgendaCardProps) {
  const Icon = ICONS[evento.tipo];
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TIPO_COLOR[evento.tipo]}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-ink">{TIPO_EVENTO_LABEL[evento.tipo]}</p>
          <span className="text-xs text-ink-faint">
            {formatDate(evento.data)} às {evento.hora}
          </span>
        </div>
        <p className="truncate text-sm text-ink-soft">{evento.clienteNome}</p>
        {evento.observacoes && <p className="mt-0.5 truncate text-xs text-ink-faint">{evento.observacoes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {evento.status === 'concluido' ? (
          <span className="badge bg-green-50 text-green-600">
            <CheckCircle2 size={12} className="mr-1" /> Concluído
          </span>
        ) : (
          onConcluir && (
            <button
              onClick={() => onConcluir(evento.id)}
              className="badge bg-amber-50 text-amber-600 hover:bg-amber-100"
            >
              Marcar concluído
            </button>
          )
        )}
        {onRemover && (
          <button
            onClick={() => onRemover(evento.id)}
            className="rounded-lg p-2 text-ink-faint hover:bg-red-50 hover:text-brand-red"
            aria-label="Remover"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
