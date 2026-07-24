import { useState } from 'react';
import { KANBAN_COLUNAS, STATUS_CLIENTE_LABEL, STATUS_CLIENTE_COLOR } from '../../types';
import type { Cliente, StatusCliente } from '../../types';
import { Link } from 'react-router-dom';
import { Phone, MapPin } from 'lucide-react';

interface KanbanBoardProps {
  clientes: Cliente[];
  onMudarStatus: (clienteId: string, status: StatusCliente) => void;
}

export function KanbanBoard({ clientes, onMudarStatus }: KanbanBoardProps) {
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaSobre, setColunaSobre] = useState<StatusCliente | null>(null);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUNAS.map((coluna) => {
        const itens = clientes.filter((c) => c.status === coluna);
        const cor = STATUS_CLIENTE_COLOR[coluna];
        const isDropTarget = colunaSobre === coluna;

        return (
          <div
            key={coluna}
            onDragOver={(e) => {
              e.preventDefault();
              setColunaSobre(coluna);
            }}
            onDragLeave={() => setColunaSobre((c) => (c === coluna ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              if (arrastandoId) onMudarStatus(arrastandoId, coluna);
              setArrastandoId(null);
              setColunaSobre(null);
            }}
            className={`flex w-72 shrink-0 flex-col rounded-2xl border-2 border-dashed p-3 transition-colors ${
              isDropTarget ? 'border-zaz-purple bg-purple-50/40' : 'border-transparent bg-surface-alt/60'
            }`}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${cor.dot}`} />
                <p className="text-sm font-semibold text-ink">{STATUS_CLIENTE_LABEL[coluna]}</p>
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-soft shadow-sm">
                {itens.length}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 min-h-[80px]">
              {itens.map((cliente) => (
                <div
                  key={cliente.id}
                  draggable
                  onDragStart={() => setArrastandoId(cliente.id)}
                  onDragEnd={() => setArrastandoId(null)}
                  className={`card cursor-grab p-3 active:cursor-grabbing ${
                    arrastandoId === cliente.id ? 'opacity-40' : ''
                  }`}
                >
                  <Link to={`/clientes/${cliente.id}`} className="block">
                    <p className="text-sm font-medium text-ink hover:text-zaz-purple">{cliente.nomeFantasia}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                      <MapPin size={11} /> {cliente.cidade} - {cliente.estado}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                      <Phone size={11} /> {cliente.telefone}
                    </p>
                  </Link>
                </div>
              ))}
              {itens.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-ink-faint">
                  Arraste um cliente para cá
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
