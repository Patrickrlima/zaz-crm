import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  MapPin,
  Users,
  Send,
  Clock,
  GraduationCap,
  UserX,
  FileClock,
  CheckCircle2,
  PhoneCall,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { acoesService, obterDiasSemContato, salvarDiasSemContato } from '../services/acoesService';
import { agendaService } from '../services/agendaService';
import { TIPO_EVENTO_LABEL } from '../types';
import type { EventoAgenda } from '../types';
import { ClienteStatusBadge, PropostaStatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, nomeExibicaoCliente } from '../utils/format';

const ICONES_EVENTO: Record<EventoAgenda['tipo'], React.ComponentType<{ size?: number; className?: string }>> = {
  visita: MapPin,
  ligacao: Phone,
  retorno: Clock,
  reuniao: Users,
  treinamento: GraduationCap,
  proposta: Send,
};

export default function Acoes() {
  const [, forceUpdate] = useState(0);
  const [editandoPrazo, setEditandoPrazo] = useState(false);
  const [prazoInput, setPrazoInput] = useState(() => String(obterDiasSemContato()));

  function recarregar() {
    forceUpdate((v) => v + 1);
  }

  useCloudSyncRefresh(recarregar);

  const atividadesHoje = useMemo(() => acoesService.atividadesDeHoje(), [recarregar]); // eslint-disable-line react-hooks/exhaustive-deps
  const esquecidos = useMemo(() => acoesService.clientesEsquecidos(), [recarregar]); // eslint-disable-line react-hooks/exhaustive-deps
  const propostasParadas = useMemo(() => acoesService.propostasParadas(), [recarregar]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalAcoes = atividadesHoje.length + esquecidos.length + propostasParadas.length;
  const diasAtual = obterDiasSemContato();

  function handleConcluirAtividade(id: string) {
    agendaService.concluir(id);
    recarregar();
  }

  function handleSalvarPrazo() {
    const numero = Number(prazoInput);
    if (Number.isFinite(numero) && numero > 0) {
      salvarDiasSemContato(numero);
    }
    setPrazoInput(String(obterDiasSemContato()));
    setEditandoPrazo(false);
    recarregar();
  }

  return (
    <div className="space-y-6">
      {/* Resumo + configuração do prazo de "esquecido" */}
      <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-zaz-purple">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="font-semibold text-ink">
              {totalAcoes === 0 ? 'Tudo em dia! 🎉' : `${totalAcoes} ${totalAcoes === 1 ? 'ação pendente' : 'ações pendentes'}`}
            </p>
            <p className="text-sm text-ink-soft">Ligações de hoje, clientes esquecidos e propostas paradas, tudo num só lugar.</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {editandoPrazo ? (
            <>
              <label className="text-xs text-ink-soft whitespace-nowrap">Dias sem contato:</label>
              <input
                type="number"
                min={1}
                value={prazoInput}
                onChange={(e) => setPrazoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSalvarPrazo()}
                className="input-base w-20 py-1.5 text-sm"
                autoFocus
              />
              <button onClick={handleSalvarPrazo} className="btn-primary py-1.5 text-xs">
                Salvar
              </button>
            </>
          ) : (
            <button onClick={() => setEditandoPrazo(true)} className="btn-secondary text-xs">
              <Settings2 size={13} /> Esquecido após {diasAtual} {diasAtual === 1 ? 'dia' : 'dias'}
            </button>
          )}
        </div>
      </div>

      {/* Agenda de hoje */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <PhoneCall size={16} className="text-zaz-purple" /> Pendentes na agenda de hoje
        </h2>
        {atividadesHoje.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={20} />} title="Nada pendente na agenda pra hoje" />
        ) : (
          <div className="space-y-2">
            {atividadesHoje.map((evento) => {
              const Icon = ICONES_EVENTO[evento.tipo];
              return (
                <div key={evento.id} className="card flex items-center gap-3 p-4">
                  <div className="flex w-14 shrink-0 flex-col items-center">
                    <span className="text-sm font-semibold text-ink">{evento.hora}</span>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt text-ink-soft">
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-faint">{TIPO_EVENTO_LABEL[evento.tipo]}</p>
                    <Link to={`/clientes/${evento.clienteId}`} className="truncate text-sm font-medium text-ink hover:text-zaz-purple">
                      {evento.clienteNome}
                    </Link>
                  </div>
                  <button
                    onClick={() => handleConcluirAtividade(evento.id)}
                    className="badge shrink-0 bg-amber-50 text-amber-600 hover:bg-amber-100"
                  >
                    Marcar concluído
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Clientes esquecidos */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <UserX size={16} className="text-brand-red" /> Clientes sem contato há {diasAtual}+ dias
        </h2>
        {esquecidos.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={20} />} title="Nenhum cliente esquecido no momento" />
        ) : (
          <div className="space-y-2">
            {esquecidos.map(({ cliente, diasSemContato }) => (
              <div key={cliente.id} className="card flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-brand-red">
                  <UserX size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/clientes/${cliente.id}`} className="truncate text-sm font-medium text-ink hover:text-zaz-purple">
                      {nomeExibicaoCliente(cliente)}
                    </Link>
                    <ClienteStatusBadge status={cliente.status} />
                  </div>
                  <p className="text-xs text-ink-faint">
                    {diasSemContato} {diasSemContato === 1 ? 'dia' : 'dias'} sem nenhum contato registrado
                  </p>
                </div>
                <button
                  onClick={() => {
                    acoesService.registrarContatoRapido(cliente);
                    recarregar();
                  }}
                  className="badge shrink-0 bg-green-50 text-green-600 hover:bg-green-100"
                  title="Registra um contato agora e remove daqui"
                >
                  Marquei contato
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Propostas paradas */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <FileClock size={16} className="text-brand-orange" /> Propostas sem resposta
        </h2>
        {propostasParadas.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={20} />} title="Nenhuma proposta parada no momento" />
        ) : (
          <div className="space-y-2">
            {propostasParadas.map(({ proposta, dias }) => (
              <Link
                key={proposta.id}
                to={`/clientes/${proposta.clienteId}`}
                className="card flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-brand-orange">
                  <FileClock size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink hover:text-zaz-purple">{proposta.clienteNome}</p>
                  <p className="text-xs text-ink-faint">
                    {formatCurrency(proposta.valor)} · enviada há {dias} {dias === 1 ? 'dia' : 'dias'}
                  </p>
                </div>
                <PropostaStatusBadge status={proposta.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
