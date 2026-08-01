import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import type { Cliente } from '../../types';
import { ClienteStatusBadge } from '../ui/StatusBadge';
import { formatDate, nomeExibicaoCliente } from '../../utils/format';

export function UltimosClientes({ clientes }: { clientes: Cliente[] }) {
  const recentes = clientes.slice(0, 4);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-ink">Últimos clientes adicionados</h3>
      </div>

      {recentes.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-faint">Nenhum cliente cadastrado ainda.</p>
      ) : (
        <div className="space-y-1">
          {recentes.map((cliente) => (
            <Link
              key={cliente.id}
              to={`/clientes/${cliente.id}`}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-alt"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
                <Store size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{nomeExibicaoCliente(cliente)}</p>
                <p className="truncate text-xs text-ink-faint">
                  {cliente.cidade} - {cliente.estado}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <ClienteStatusBadge status={cliente.status} />
                <span className="text-[11px] text-ink-faint">{formatDate(cliente.dataCadastro)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        to="/clientes"
        className="mt-3 block text-center text-xs font-medium text-zaz-purple hover:underline"
      >
        Ver todos os clientes →
      </Link>
    </div>
  );
}
