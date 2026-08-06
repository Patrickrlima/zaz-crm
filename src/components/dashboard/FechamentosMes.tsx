import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Percent, Users, Trophy } from 'lucide-react';
import { STATUS_CLIENTE_PADRAO, type Cliente } from '../../types';

interface FechamentosMesProps {
  clientes: Cliente[];
}

/** Agrupa os fechamentos do mês por semana do mês corrente (semana 1 a 5), usando a data de fechamento. */
function evolucaoPorSemana(fechamentos: Cliente[]): { semana: string; qtd: number }[] {
  const semanas = [0, 0, 0, 0, 0];
  fechamentos.forEach((c) => {
    const dataRef = c.dataFechamento ?? c.dataCadastro;
    const dia = new Date(dataRef).getDate();
    const idx = Math.min(4, Math.floor((dia - 1) / 7));
    semanas[idx] += 1;
  });
  return semanas.map((qtd, i) => ({ semana: `Sem. ${i + 1}`, qtd }));
}

function porVendedor(fechamentos: Cliente[]): { nome: string; qtd: number }[] {
  const mapa = new Map<string, number>();
  fechamentos.forEach((c) => {
    const nome = c.responsavel?.trim() || 'Sem responsável';
    mapa.set(nome, (mapa.get(nome) ?? 0) + 1);
  });
  return Array.from(mapa.entries())
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd);
}

export function FechamentosMes({ clientes }: FechamentosMesProps) {
  const fechamentos = useMemo(
    () => clientes.filter((c) => c.status === STATUS_CLIENTE_PADRAO.fechamentoMes),
    [clientes]
  );

  const total = fechamentos.length;

  const conversao = useMemo(() => (clientes.length > 0 ? (total / clientes.length) * 100 : 0), [clientes.length, total]);

  const evolucao = useMemo(() => evolucaoPorSemana(fechamentos), [fechamentos]);
  const ranking = useMemo(() => porVendedor(fechamentos), [fechamentos]);
  const destaque = ranking[0];

  const nomeMes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm text-ink-soft">Fechados este mês</p>
              <p className="text-xl font-semibold text-ink">{total}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-zaz-purple">
              <Percent size={20} />
            </div>
            <div>
              <p className="text-sm text-ink-soft">Conversão em fechamentos</p>
              <p className="text-xl font-semibold text-ink">{conversao.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-ink-soft">Vendedores fechando</p>
              <p className="text-xl font-semibold text-ink">{ranking.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Trophy size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-ink-soft">Destaque do mês</p>
              <p className="truncate text-sm font-semibold text-ink">
                {destaque ? `${destaque.nome} (${destaque.qtd})` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-1 font-semibold text-ink">Evolução dos fechamentos</h3>
          <p className="mb-4 text-xs capitalize text-ink-faint">{nomeMes}</p>
          {total === 0 ? (
            <p className="text-sm text-ink-faint">Nenhum fechamento registrado neste mês ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFF0F5" />
                <XAxis dataKey="semana" tick={{ fontSize: 12 }} stroke="#8A8E9B" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#8A8E9B" />
                <Tooltip
                  formatter={(v) => [`${v} fechamento(s)`, '']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #EFF0F5', fontSize: 12 }}
                />
                <Bar dataKey="qtd" name="Fechamentos" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-semibold text-ink">Fechamentos por vendedor</h3>
          {ranking.length === 0 ? (
            <p className="text-sm text-ink-faint">Nenhum fechamento registrado neste mês ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {ranking.map((v) => (
                <div key={v.nome} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{v.nome}</span>
                  <span className="font-medium text-ink">{v.qtd}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
