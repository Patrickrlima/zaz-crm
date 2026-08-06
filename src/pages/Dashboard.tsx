import { useState } from 'react';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { useNavigate } from 'react-router-dom';
import { DashboardCards } from '../components/dashboard/DashboardCards';
import { AgendaHoje } from '../components/dashboard/AgendaHoje';
import { FunilVendas } from '../components/dashboard/FunilVendas';
import { UltimosClientes } from '../components/dashboard/UltimosClientes';
import { RetornosPendentes } from '../components/dashboard/RetornosPendentes';
import { DashboardAnalitico } from '../components/dashboard/DashboardAnalitico';
import { Modal } from '../components/ui/Modal';
import { EventoForm, type EventoFormValues } from '../components/agenda/EventoForm';
import { clienteService } from '../services/clienteService';
import { agendaService } from '../services/agendaService';
import { propostaService } from '../services/propostaService';
import { historicoService } from '../services/historicoService';
import { useTheme } from '../contexts/ThemeContext';
import type { Cliente, EventoAgenda, Proposta, RegistroHistorico } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { estiloDashboard } = useTheme();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [eventosHoje, setEventosHoje] = useState<EventoAgenda[]>([]);
  const [retornos, setRetornos] = useState<EventoAgenda[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [modalAberto, setModalAberto] = useState(false);

  function carregar() {
    setClientes(clienteService.listar());
    setEventosHoje(agendaService.listarHoje());
    setRetornos(agendaService.retornosPendentes());
    setPropostas(propostaService.listar());
    setHistorico(historicoService.listar());
  }

  useCloudSyncRefresh(carregar);

  function handleConcluir(id: string) {
    agendaService.concluir(id);
    carregar();
  }

  function handleNovaAtividade(values: EventoFormValues) {
    const cliente = clientes.find((c) => c.id === values.clienteId);
    agendaService.criar({
      clienteId: values.clienteId,
      clienteNome: cliente?.nomeFantasia ?? '',
      tipo: values.tipo,
      data: values.data,
      hora: values.hora,
      observacoes: values.observacoes,
    });
    setModalAberto(false);
    carregar();
  }

  if (estiloDashboard === 'analitico') {
    return <DashboardAnalitico clientes={clientes} propostas={propostas} historico={historico} />;
  }

  const negociacoes = clientes.filter((c) => c.status === 'negociacao').length;

  return (
    <div className="space-y-6">
      <DashboardCards
        clientesCadastrados={clienteService.contar()}
        clientesNovosSemana={clienteService.adicionadosNaSemana()}
        retornosHoje={eventosHoje.filter((e) => e.status === 'pendente').length}
        negociacoes={negociacoes}
        propostasEsteMes={propostaService.contarEsteMes()}
        onVerAgenda={() => navigate('/agenda')}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AgendaHoje eventos={eventosHoje} onConcluir={handleConcluir} onNovaAtividade={() => setModalAberto(true)} />
        <FunilVendas clientes={clientes} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <UltimosClientes clientes={clientes} />
        <RetornosPendentes retornos={retornos} />
      </div>

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Nova atividade">
        <EventoForm clientes={clientes} onSubmit={handleNovaAtividade} onCancel={() => setModalAberto(false)} />
      </Modal>
    </div>
  );
}
