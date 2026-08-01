import { Search } from 'lucide-react';
import { KANBAN_COLUNAS, STATUS_CLIENTE_LABEL } from '../../types';
import type { StatusCliente } from '../../types';

interface ClienteFiltroProps {
  busca: string;
  onBuscaChange: (v: string) => void;
  status: StatusCliente | 'todos';
  onStatusChange: (v: StatusCliente | 'todos') => void;
}

export function ClienteFiltro({ busca, onBuscaChange, status, onStatusChange }: ClienteFiltroProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          placeholder="Buscar cliente por nome, cidade ou CNPJ..."
          className="input-base pl-10"
        />
      </div>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as StatusCliente | 'todos')}
        className="input-base sm:w-56"
      >
        <option value="todos">Todos os status</option>
        {KANBAN_COLUNAS.map((s) => (
          <option key={s} value={s}>
            {STATUS_CLIENTE_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}
