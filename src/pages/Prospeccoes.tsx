import { useState } from 'react';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { KanbanBoard } from '../components/prospeccoes/KanbanBoard';
import { clienteService, type NovoClienteInput } from '../services/clienteService';
import type { ClienteFormValues } from '../components/clientes/ClienteForm';
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

  function handleExcluirClientes(ids: string[]) {
    clienteService.removerVarios(ids);
    carregar();
  }

  function handleCriarCliente(values: ClienteFormValues) {
    clienteService.criar(values as NovoClienteInput);
    carregar();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Arraste os cartões entre as colunas para atualizar o estágio de cada cliente no funil de vendas, ou use o
        botão "Adicionar Cliente" para cadastrar manualmente direto numa coluna.
      </p>
      <KanbanBoard
        clientes={clientes}
        onMudarStatus={handleMudarStatus}
        onExcluirClientes={handleExcluirClientes}
        onCriarCliente={handleCriarCliente}
      />
    </div>
  );
}
