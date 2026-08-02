import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { History, Search } from 'lucide-react';
import { historicoService } from '../services/historicoService';
import { EmptyState } from '../components/ui/EmptyState';
import { TIPO_HISTORICO_LABEL } from '../types';
import type { RegistroHistorico, TipoHistorico } from '../types';
import { formatDateTime } from '../utils/format';

const CORES: Record<TipoHistorico, string> = {
  cadastro: 'bg-blue-500',
  edicao: 'bg-amber-500',
  ligacao: 'bg-green-500',
  visita: 'bg-orange-500',
  proposta: 'bg-indigo-500',
  simulacao: 'bg-cyan-500',
  conclusao: 'bg-emerald-500',
  exclusao: 'bg-red-500',
};

export default function Historico() {
  const [registros, setRegistros] = useState<RegistroHistorico[]>([]);
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<TipoHistorico | 'todos'>('todos');

  useCloudSyncRefresh(() => setRegistros(historicoService.listar()));

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      const matchBusca =
        !busca ||
        r.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        r.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        (r.clienteNome ?? '').toLowerCase().includes(busca.toLowerCase());
      const matchTipo = tipo === 'todos' || r.tipo === tipo;
      return matchBusca && matchTipo;
    });
  }, [registros, busca, tipo]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente, título ou descrição..."
            className="input-base pl-10"
          />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoHistorico | 'todos')} className="input-base sm:w-56">
          <option value="todos">Todos os tipos</option>
          {Object.entries(TIPO_HISTORICO_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icon={<History size={20} />} title="Nenhum registro encontrado" description="Ajuste os filtros ou aguarde novas atividades." />
      ) : (
        <div className="card p-5">
          <div className="space-y-0">
            {filtrados.map((r, i) => (
              <div key={r.id} className="relative flex gap-3 pb-6">
                {i < filtrados.length - 1 && (
                  <span className="absolute left-[5px] top-3 h-full w-px bg-gray-200" aria-hidden="true" />
                )}
                <span className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${CORES[r.tipo]}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-sm font-medium text-ink">
                      {r.titulo}
                      {r.clienteNome && (
                        <span className="ml-1.5 font-normal text-ink-faint">
                          ·{' '}
                          {r.clienteId ? (
                            <Link to={`/clientes/${r.clienteId}`} className="text-zaz-purple hover:underline">
                              {r.clienteNome}
                            </Link>
                          ) : (
                            r.clienteNome
                          )}
                        </span>
                      )}
                    </p>
                    <span className="text-xs text-ink-faint">{formatDateTime(r.data)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">{r.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
