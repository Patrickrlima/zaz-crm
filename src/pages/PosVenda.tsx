import { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { DashboardAnalitico } from '../components/dashboard/DashboardAnalitico';
import { ImportarClientesModal } from '../components/clientes/ImportarClientesModal';
import { EmptyState } from '../components/ui/EmptyState';
import { clienteService } from '../services/clienteService';
import { propostaService } from '../services/propostaService';
import { historicoService } from '../services/historicoService';
import type { Cliente, Proposta, RegistroHistorico } from '../types';

export default function PosVenda() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [modalImportar, setModalImportar] = useState(false);

  function carregar() {
    setClientes(clienteService.listar());
    setPropostas(propostaService.listar());
    setHistorico(historicoService.listar());
  }

  useCloudSyncRefresh(carregar);

  const clientesPosVenda = useMemo(() => clientes.filter((c) => c.posVenda), [clientes]);
  const idsPosVenda = useMemo(() => new Set(clientesPosVenda.map((c) => c.id)), [clientesPosVenda]);
  const propostasPosVenda = useMemo(() => propostas.filter((p) => idsPosVenda.has(p.clienteId)), [propostas, idsPosVenda]);
  const historicoPosVenda = useMemo(
    () => historico.filter((h) => h.clienteId && idsPosVenda.has(h.clienteId)),
    [historico, idsPosVenda]
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setModalImportar(true)} className="btn-primary">
          <Upload size={15} /> Importar planilha de pós-venda
        </button>
      </div>

      {clientesPosVenda.length === 0 ? (
        <EmptyState
          icon={<Upload size={20} />}
          title="Nenhum cliente de pós-venda ainda"
          description="Importe a planilha de pós-venda para começar a acompanhar MCV, TPV e desempenho desses clientes aqui."
          action={
            <button onClick={() => setModalImportar(true)} className="btn-primary">
              <Upload size={16} /> Importar planilha
            </button>
          }
        />
      ) : (
        <DashboardAnalitico clientes={clientesPosVenda} propostas={propostasPosVenda} historico={historicoPosVenda} />
      )}

      <ImportarClientesModal
        open={modalImportar}
        onClose={() => setModalImportar(false)}
        onImportado={carregar}
        modo="pos_venda"
      />
    </div>
  );
}
