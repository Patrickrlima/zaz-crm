import { useState } from 'react';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { KanbanBoard } from '../components/prospeccoes/KanbanBoard';
import { clienteService } from '../services/clienteService';
import type { Cliente, StatusCliente } from '../types';

export default function Prospeccoes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  function carregar() {
    setClientes(clienteService.listar());
  }

  useCloudSyncRefresh(carregar);

  function handleMudarStatus(clienteId: string, status: StatusCliente) {
    clienteService.atualizarStatus(clienteId, status);
    carregar();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Arraste os cartões entre as colunas para atualizar o estágio de cada cliente no funil de vendas.
      </p>
      <KanbanBoard clientes={clientes} onMudarStatus={handleMudarStatus} />
    </div>
  );
}
