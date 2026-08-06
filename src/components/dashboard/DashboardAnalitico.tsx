import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Building2, DollarSign, TrendingUp, Target, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { Cliente, Proposta, RegistroHistorico } from '../../types';
import { formatCurrency, formatDate, nomeExibicaoCliente } from '../../utils/format';
import { FechamentosMes } from './FechamentosMes';

interface DashboardAnaliticoProps {
  clientes: Cliente[];
  propostas: Proposta[];
  historico: RegistroHistorico[];
}

function ultimosMeses(qtd: number): { chave: string; label: string }[] {
  const meses = [];
  const agora = new Date();
  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    meses.push({
      chave: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    });
  }
  return meses;
}

/** TPV atual de um cliente: usa o valor cadastrado/importado; se não tiver, soma as propostas aceitas (compatibilidade). */
function tpvDoCliente(cliente: Cliente, propostas: Proposta[]): number {
  if (cliente.tpvAtual !== undefined) return cliente.tpvAtual;
  return propostas.filter((p) => p.clienteId === cliente.id && p.status === 'aceita').reduce((acc, p) => acc + p.valor, 0);
}

/** Projeta o TPV do mês inteiro com base no ritmo até hoje: (TPV atual ÷ dia do mês) × dias no mês. */
function projetarTpv(tpvAtual: number, dataReferencia: Date = new Date()): number {
  if (tpvAtual <= 0) return 0;
  const dia = dataReferencia.getDate();
  const diasNoMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0).getDate();
  return (tpvAtual / dia) * diasNoMes;
}

function CardMetrica({
  icone,
  label,
  valor,
  variacao,
  corIcone,
}: {
  icone: React.ReactNode;
  label: string;
  valor: string;
  variacao?: number;
  corIcone: string;
}) {
  return (
    <div className="card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${corIcone}`}>{icone}</div>
        <div>
          <p className="text-sm text-ink-soft">{label}</p>
          <p className="text-xl font-semibold text-ink">{valor}</p>
        </div>
      </div>
      {variacao !== undefined && (
        <p className={`mt-2 text-xs font-medium ${variacao >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
          {variacao >= 0 ? '▲' : '▼'} {Math.abs(variacao).toFixed(0)}% <span className="font-normal text-ink-faint">vs. período anterior</span>
        </p>
      )}
    </div>
  );
}

export function DashboardAnalitico({ clientes, propostas, historico }: DashboardAnaliticoProps) {
  const mcvComprometidoTotal = useMemo(
    () => clientes.reduce((acc, c) => acc + (c.mcvComprometido ?? 0), 0),
    [clientes]
  );

  const tpvAtual = useMemo(() => clientes.reduce((acc, c) => acc + tpvDoCliente(c, propostas), 0), [clientes, propostas]);

  // "Projetado" = ritmo atual extrapolado pro mês inteiro (TPV atual ÷ dia do mês × dias no mês).
  const tpvProjetado = useMemo(() => projetarTpv(tpvAtual), [tpvAtual]);

  const performance = mcvComprometidoTotal > 0 ? Math.min(100, (tpvAtual / mcvComprometidoTotal) * 100) : 0;

  const evolucao = useMemo(() => {
    const meses = ultimosMeses(6);
    let acumuladoAtual = 0;
    return meses.map(({ chave, label }, idx) => {
      const [ano, mes] = chave.split('-').map(Number);
      const doMes = propostas.filter((p) => {
        const d = new Date(p.data);
        return d.getFullYear() === ano && d.getMonth() === mes && p.status === 'aceita';
      });
      acumuladoAtual += doMes.reduce((acc, p) => acc + p.valor, 0);
      const ehMesAtual = idx === meses.length - 1;
      const valorAtualMes = ehMesAtual ? tpvAtual : acumuladoAtual;
      return { mes: label, atual: Math.round(valorAtualMes), projetado: Math.round(ehMesAtual ? tpvProjetado : valorAtualMes) };
    });
  }, [propostas, tpvAtual, tpvProjetado]);

  const ranking = useMemo(() => {
    return clientes
      .map((c) => {
        const mcv = c.mcvComprometido ?? 0;
        const tpvAtualCliente = tpvDoCliente(c, propostas);
        const percentual = mcv > 0 ? (tpvAtualCliente / mcv) * 100 : 0;
        return { cliente: c, mcv, tpvAtual: tpvAtualCliente, tpvProjetado: projetarTpv(tpvAtualCliente), percentual };
      })
      .filter((r) => r.mcv > 0)
      .sort((a, b) => b.mcv - a.mcv);
  }, [clientes, propostas]);

  const atencao = useMemo(() => {
    return ranking
      .filter((r) => r.percentual < 80)
      .sort((a, b) => a.percentual - b.percentual)
      .slice(0, 6);
  }, [ranking]);

  function situacao(percentual: number): { label: string; cor: string; icone: React.ReactNode } {
    if (percentual < 50) return { label: 'Muito abaixo do MCV', cor: 'bg-red-50 text-red-600', icone: <AlertTriangle size={13} /> };
    if (percentual < 80) return { label: 'Abaixo do combinado', cor: 'bg-amber-50 text-amber-600', icone: <Clock size={13} /> };
    return { label: 'Meta atingida', cor: 'bg-green-50 text-green-600', icone: <CheckCircle2 size={13} /> };
  }

  const ultimosMovimentos = historico.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardMetrica
          icone={<Building2 size={20} className="text-blue-600" />}
          corIcone="bg-blue-50"
          label="Total de clientes"
          valor={String(clientes.length)}
        />
        <CardMetrica
          icone={<DollarSign size={20} className="text-brand-green" />}
          corIcone="bg-green-50"
          label="MCV comprometido"
          valor={formatCurrency(mcvComprometidoTotal)}
        />
        <CardMetrica
          icone={<TrendingUp size={20} className="text-zaz-purple" />}
          corIcone="bg-accent-soft"
          label="TPV atual"
          valor={formatCurrency(tpvAtual)}
        />
        <CardMetrica
          icone={<Target size={20} className="text-blue-600" />}
          corIcone="bg-blue-50"
          label="TPV projetado"
          valor={formatCurrency(tpvProjetado)}
        />
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-ink">Fechamentos do mês</h3>
        <FechamentosMes clientes={clientes} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-ink">Evolução do TPV atual x projetado</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={evolucao}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFF0F5" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#8A8E9B" />
              <YAxis tick={{ fontSize: 12 }} stroke="#8A8E9B" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v ?? 0))}
                contentStyle={{ borderRadius: 12, border: '1px solid #EFF0F5', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="atual" name="TPV atual" stroke="#2F6FED" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="projetado" name="TPV projetado" stroke="#D9622F" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card flex flex-col items-center justify-center p-5 text-center">
          <h3 className="mb-2 self-start font-semibold text-ink">Performance</h3>
          <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#EEF0F6" strokeWidth={16} strokeLinecap="round" />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={performance >= 80 ? '#16A34A' : performance >= 50 ? '#F59E0B' : '#EF4444'}
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={`${(performance / 100) * 251} 251`}
            />
          </svg>
          <p className="-mt-6 text-3xl font-semibold text-ink">{performance.toFixed(0)}%</p>
          <p className="text-xs text-ink-soft">do MCV comprometido</p>
          <div
            className={`mt-4 w-full rounded-xl px-3 py-2 text-xs font-medium ${
              performance >= 80 ? 'bg-green-50 text-brand-green' : performance >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-brand-red'
            }`}
          >
            {performance >= 80 ? 'Em boa evolução!' : performance >= 50 ? 'Evolução moderada' : 'Precisa de atenção'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card overflow-hidden p-5">
          <h3 className="mb-4 font-semibold text-ink">Desempenho por cliente</h3>
          {ranking.length === 0 ? (
            <p className="text-sm text-ink-faint">Cadastre o MCV comprometido nos clientes para ver o ranking aqui.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-ink-faint">
                    <th className="pb-2 font-medium">Cliente</th>
                    <th className="pb-2 font-medium">MCV</th>
                    <th className="pb-2 font-medium">TPV atual</th>
                    <th className="pb-2 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.slice(0, 8).map((r) => (
                    <tr key={r.cliente.id} className="border-t border-gray-100">
                      <td className="py-2 pr-2">
                        <Link to={`/clientes/${r.cliente.id}`} className="text-ink hover:text-zaz-purple">
                          {nomeExibicaoCliente(r.cliente)}
                        </Link>
                      </td>
                      <td className="py-2 text-ink-soft">{formatCurrency(r.mcv)}</td>
                      <td className="py-2 text-ink-soft">{formatCurrency(r.tpvAtual)}</td>
                      <td className="py-2">
                        <span
                          className={`badge ${
                            r.percentual >= 80 ? 'bg-green-50 text-brand-green' : r.percentual >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-brand-red'
                          }`}
                        >
                          {r.percentual.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-ink">Clientes que precisam de atenção</h3>
          {atencao.length === 0 ? (
            <p className="text-sm text-ink-faint">Nenhum cliente abaixo do MCV combinado no momento.</p>
          ) : (
            <div className="space-y-2">
              {atencao.map((r) => {
                const s = situacao(r.percentual);
                return (
                  <Link
                    key={r.cliente.id}
                    to={`/clientes/${r.cliente.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-surface-alt"
                  >
                    <span className="truncate text-sm text-ink">{nomeExibicaoCliente(r.cliente)}</span>
                    <span className={`badge shrink-0 ${s.cor}`}>
                      {s.icone} {s.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-4 font-semibold text-ink">Últimos movimentos</h3>
        {ultimosMovimentos.length === 0 ? (
          <p className="text-sm text-ink-faint">Nenhum movimento registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-ink-faint">
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Movimento</th>
                </tr>
              </thead>
              <tbody>
                {ultimosMovimentos.map((h) => (
                  <tr key={h.id} className="border-t border-gray-100">
                    <td className="py-2 text-ink-soft">{formatDate(h.data)}</td>
                    <td className="py-2 text-ink">
                      {h.clienteId ? (
                        <Link to={`/clientes/${h.clienteId}`} className="hover:text-zaz-purple">
                          {h.clienteNome}
                        </Link>
                      ) : (
                        h.clienteNome || '—'
                      )}
                    </td>
                    <td className="py-2 text-ink-soft">{h.titulo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
