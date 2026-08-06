import { useMemo, useRef, useState } from 'react';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Download, Loader2 } from 'lucide-react';
import { clienteService } from '../services/clienteService';
import { agendaService } from '../services/agendaService';
import { propostaService } from '../services/propostaService';
import { exportarElementoParaPdf } from '../services/exportPdfService';
import { KANBAN_COLUNAS, STATUS_CLIENTE_LABEL, STATUS_PROPOSTA_LABEL } from '../types';
import type { Cliente, EventoAgenda, Proposta } from '../types';
import { formatCurrency } from '../utils/format';

const CORES_STATUS: Record<string, string> = {
  novo_lead: '#3B82F6',
  em_contato: '#F59E0B',
  negociacao: '#0D9488',
  proposta_enviada: '#6366F1',
  fechamento_mes: '#10B981',
  fechado: '#16A34A',
  perdido: '#9CA3AF',
};

const CORES_PROPOSTA: Record<string, string> = {
  enviada: '#3B82F6',
  aceita: '#16A34A',
  recusada: '#EF4444',
  expirada: '#9CA3AF',
};

function ultimosMeses(qtd: number): { chave: string; label: string }[] {
  const meses = [];
  const agora = new Date();
  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    meses.push({
      chave: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }),
    });
  }
  return meses;
}

export default function Relatorios() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [exportando, setExportando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  async function handleExportarPdf() {
    if (!conteudoRef.current) return;
    setExportando(true);
    try {
      await exportarElementoParaPdf(conteudoRef.current, `relatorios-zaz-${new Date().toISOString().slice(0, 10)}.pdf`, 'Relatórios — Central do Vendedor');
    } finally {
      setExportando(false);
    }
  }

  useCloudSyncRefresh(() => {
    setClientes(clienteService.listar());
    setEventos(agendaService.listar());
    setPropostas(propostaService.listar());
  });

  const funilData = useMemo(
    () =>
      KANBAN_COLUNAS.map((s) => ({
        nome: STATUS_CLIENTE_LABEL[s],
        valor: clientes.filter((c) => c.status === s).length,
        status: s,
      })),
    [clientes]
  );

  const clientesPorMes = useMemo(() => {
    const meses = ultimosMeses(6);
    return meses.map(({ chave, label }) => {
      const [ano, mes] = chave.split('-').map(Number);
      const qtd = clientes.filter((c) => {
        const d = new Date(c.dataCadastro);
        return d.getFullYear() === ano && d.getMonth() === mes;
      }).length;
      return { mes: label, clientes: qtd };
    });
  }, [clientes]);

  const visitasPorMes = useMemo(() => {
    const meses = ultimosMeses(6);
    return meses.map(({ chave, label }) => {
      const [ano, mes] = chave.split('-').map(Number);
      const qtd = eventos.filter((e) => {
        if (e.tipo !== 'visita') return false;
        const d = new Date(`${e.data}T00:00:00`);
        return d.getFullYear() === ano && d.getMonth() === mes;
      }).length;
      return { mes: label, visitas: qtd };
    });
  }, [eventos]);

  const propostasPorStatus = useMemo(
    () =>
      (['enviada', 'aceita', 'recusada', 'expirada'] as const).map((s) => ({
        nome: STATUS_PROPOSTA_LABEL[s],
        valor: propostas.filter((p) => p.status === s).length,
        status: s,
      })),
    [propostas]
  );

  const taxaConversao = useMemo(() => {
    // Conta tanto os fechamentos do mês corrente quanto o pós-venda (fechados de meses anteriores).
    const fechados = clientes.filter((c) => c.status === 'fechado' || c.status === 'fechamento_mes').length;
    return clientes.length > 0 ? ((fechados / clientes.length) * 100).toFixed(1) : '0.0';
  }, [clientes]);

  const valorTotalPropostas = useMemo(
    () => propostas.filter((p) => p.status === 'aceita').reduce((acc, p) => acc + p.valor, 0),
    [propostas]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={handleExportarPdf} disabled={exportando} className="btn-secondary">
          {exportando ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          Exportar PDF
        </button>
      </div>

      <div ref={conteudoRef} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-ink-soft">Taxa de conversão</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink">{taxaConversao}%</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-ink-soft">Valor em propostas aceitas</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink">{formatCurrency(valorTotalPropostas)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-ink-soft">Total de clientes</p>
          <p className="mt-1.5 text-2xl font-semibold text-ink">{clientes.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-ink">Novos clientes por mês</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={clientesPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFF0F5" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#8A8E9B" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#8A8E9B" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EFF0F5', fontSize: 12 }} />
              <Line type="monotone" dataKey="clientes" stroke="#2F6FED" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-ink">Visitas realizadas por mês</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={visitasPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFF0F5" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#8A8E9B" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#8A8E9B" />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EFF0F5', fontSize: 12 }} />
              <Bar dataKey="visitas" fill="#2F6FED" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-ink">Clientes por estágio (negociações)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={funilData} dataKey="valor" nameKey="nome" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {funilData.map((d) => (
                  <Cell key={d.status} fill={CORES_STATUS[d.status]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EFF0F5', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-ink">Propostas por status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={propostasPorStatus} dataKey="valor" nameKey="nome" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {propostasPorStatus.map((d) => (
                  <Cell key={d.status} fill={CORES_PROPOSTA[d.status]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EFF0F5', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
    </div>
  );
}
