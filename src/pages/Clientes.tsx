import { useMemo, useState } from 'react';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { Plus, Users, Upload } from 'lucide-react';
import { ClienteCard } from '../components/clientes/ClienteCard';
import { ClienteFiltro } from '../components/clientes/ClienteFiltro';
import { ClienteForm, type ClienteFormValues } from '../components/clientes/ClienteForm';
import { ImportarClientesModal } from '../components/clientes/ImportarClientesModal';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { clienteService } from '../services/clienteService';
import type { Cliente, StatusCliente } from '../types';

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<StatusCliente | 'todos'>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);

  function carregar() {
    setClientes(clienteService.listar());
  }

  useCloudSyncRefresh(carregar);

  const filtrados = useMemo(() => {
    return clientes.filter((c) => {
      const buscaLower = busca.toLowerCase();
      const matchBusca =
        !busca ||
        c.nomeFantasia.toLowerCase().includes(buscaLower) ||
        c.cidade.toLowerCase().includes(buscaLower) ||
        c.cnpj.includes(busca);
      const matchStatus = status === 'todos' || c.status === status;
      return matchBusca && matchStatus;
    });
  }, [clientes, busca, status]);

  function handleCriar(values: ClienteFormValues) {
    clienteService.criar({ ...values, whatsapp: values.whatsapp ?? '', endereco: values.endereco ?? '', observacoes: values.observacoes ?? '' });
    setModalAberto(false);
    carregar();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ClienteFiltro busca={busca} onBuscaChange={setBusca} status={status} onStatusChange={setStatus} />
        <div className="flex shrink-0 gap-2">
          <button onClick={() => setModalImportar(true)} className="btn-secondary">
            <Upload size={16} /> Importar
          </button>
          <button onClick={() => setModalAberto(true)} className="btn-primary">
            <Plus size={16} /> Novo cliente
          </button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title="Nenhum cliente encontrado"
          description={
            clientes.length === 0
              ? 'Cadastre seu primeiro cliente para começar a acompanhar sua carteira.'
              : 'Tente ajustar os filtros de busca.'
          }
          action={
            clientes.length === 0 ? (
              <button onClick={() => setModalAberto(true)} className="btn-primary">
                <Plus size={16} /> Novo cliente
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((cliente) => (
            <ClienteCard key={cliente.id} cliente={cliente} />
          ))}
        </div>
      )}

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Novo cliente" size="lg">
        <ClienteForm onSubmit={handleCriar} onCancel={() => setModalAberto(false)} />
      </Modal>

      <ImportarClientesModal
        open={modalImportar}
        onClose={() => setModalImportar(false)}
        onImportado={carregar}
      />
    </div>
  );
}
