import type { RegistroHistorico } from '../../types';
import { formatDateTime } from '../../utils/format';
import { EmptyState } from '../ui/EmptyState';
import { History } from 'lucide-react';

const CORES: Record<RegistroHistorico['tipo'], string> = {
  cadastro: 'bg-blue-500',
  edicao: 'bg-amber-500',
  ligacao: 'bg-green-500',
  visita: 'bg-accent-soft0',
  proposta: 'bg-indigo-500',
  simulacao: 'bg-cyan-500',
  conclusao: 'bg-emerald-500',
  exclusao: 'bg-red-500',
};

export function ClienteHistorico({ registros }: { registros: RegistroHistorico[] }) {
  if (registros.length === 0) {
    return (
      <EmptyState icon={<History size={20} />} title="Sem histórico" description="Nenhuma atividade registrada ainda para este cliente." />
    );
  }

  return (
    <div className="space-y-0">
      {registros.map((r, i) => (
        <div key={r.id} className="relative flex gap-3 pb-6">
          {i < registros.length - 1 && (
            <span className="absolute left-[5px] top-3 h-full w-px bg-gray-200" aria-hidden="true" />
          )}
          <span className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${CORES[r.tipo]}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm font-medium text-ink">{r.titulo}</p>
              <span className="text-xs text-ink-faint">{formatDateTime(r.data)}</span>
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{r.descricao}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
