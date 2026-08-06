import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { KANBAN_COLUNAS, STATUS_CLIENTE_LABEL, type Cliente } from '../../types';

const CORES: Record<string, string> = {
  novo_lead: '#3B82F6',
  em_contato: '#F59E0B',
  negociacao: '#0D9488',
  proposta_enviada: '#6366F1',
  fechado: '#16A34A',
  perdido: '#9CA3AF',
};

interface FunilVendasProps {
  clientes: Cliente[];
}

export function FunilVendas({ clientes }: FunilVendasProps) {
  const total = clientes.length;
  const dados = KANBAN_COLUNAS.map((status) => {
    const qtd = clientes.filter((c) => c.status === status).length;
    return {
      status,
      nome: STATUS_CLIENTE_LABEL[status],
      valor: qtd,
      percentual: total > 0 ? Math.round((qtd / total) * 100) : 0,
    };
  });

  return (
    <div className="card p-5">
      <h3 className="mb-4 font-semibold text-ink">Funil de vendas</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dados}
                dataKey="valor"
                nameKey="nome"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={dados.some((d) => d.valor > 0) ? 2 : 0}
                startAngle={90}
                endAngle={-270}
              >
                {dados.map((d) => (
                  <Cell key={d.status} fill={CORES[d.status]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, entry) => [`${value} clientes`, entry?.payload?.nome ?? '']}
                contentStyle={{ borderRadius: 12, border: '1px solid #EFF0F5', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-ink">{total}</span>
            <span className="text-[11px] text-ink-faint">clientes</span>
          </div>
        </div>

        <div className="w-full flex-1 space-y-2.5">
          {dados.map((d) => (
            <div key={d.status} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-ink-soft">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CORES[d.status] }} />
                {d.nome}
              </div>
              <span className="font-medium text-ink">
                {d.valor} <span className="text-ink-faint">({d.percentual}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-ink-faint">Total: {total} clientes</p>
    </div>
  );
}
