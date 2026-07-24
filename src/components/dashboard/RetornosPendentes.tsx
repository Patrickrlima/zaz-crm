import { Link } from 'react-router-dom';
import { AlarmClock } from 'lucide-react';
import type { EventoAgenda } from '../../types';
import { formatDate } from '../../utils/format';

export function RetornosPendentes({ retornos }: { retornos: EventoAgenda[] }) {
  const lista = retornos.slice(0, 4);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-ink">Retornos pendentes</h3>
      </div>

      {lista.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-faint">Nenhum retorno pendente. 🎉</p>
      ) : (
        <div className="space-y-1">
          {lista.map((r) => (
            <Link
              key={r.id}
              to={`/clientes/${r.clienteId}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-alt"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-red">
                <AlarmClock size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{r.clienteNome}</p>
                <p className="truncate text-xs text-ink-faint">{r.observacoes || 'Retornar contato'}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-brand-red">{formatDate(r.data)}</span>
            </Link>
          ))}
        </div>
      )}

      <Link to="/agenda" className="mt-3 block text-center text-xs font-medium text-zaz-purple hover:underline">
        Ver todos os retornos →
      </Link>
    </div>
  );
}
