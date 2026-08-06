import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  MapPin,
  ArrowLeftRight,
  Plus,
  Pencil,
  Check,
  X,
  CheckSquare,
  Square,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type { Cliente, StatusCliente } from '../../types';
import { nomeExibicaoCliente } from '../../utils/format';
import { kanbanColunaService, type ColunaKanban } from '../../services/kanbanColunaService';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Modal } from '../ui/Modal';
import { ClienteForm, type ClienteFormValues } from '../clientes/ClienteForm';

interface KanbanBoardProps {
  clientes: Cliente[];
  onMudarStatus: (clienteId: string, status: StatusCliente) => void;
  onExcluirClientes: (ids: string[]) => void;
  onCriarCliente: (values: ClienteFormValues) => void;
}

const LARGURA_STORAGE_KEY = 'zaz_crm_kanban_compacto';

export function KanbanBoard({ clientes, onMudarStatus, onExcluirClientes, onCriarCliente }: KanbanBoardProps) {
  const [colunas, setColunas] = useState<ColunaKanban[]>(() => kanbanColunaService.listar());
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaSobre, setColunaSobre] = useState<string | null>(null);
  const [compacto, setCompacto] = useState<boolean>(() => window.localStorage.getItem(LARGURA_STORAGE_KEY) === '1');
  const [colunaRenomeando, setColunaRenomeando] = useState<string | null>(null);
  const [nomeRenomeio, setNomeRenomeio] = useState('');
  const [criandoColuna, setCriandoColuna] = useState(false);
  const [nomeNovaColuna, setNomeNovaColuna] = useState('');
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [statusNovoCliente, setStatusNovoCliente] = useState<string | null>(null);
  const trilhoRef = useRef<HTMLDivElement>(null);
  const barraTopoRef = useRef<HTMLDivElement>(null);
  const [larguraConteudo, setLarguraConteudo] = useState(0);
  const sincronizandoRef = useRef<'trilho' | 'topo' | null>(null);

  // Rolagem horizontal fluida com a roda do mouse (sem precisar segurar Shift),
  // além do scroll nativo com Shift e da barra de rolagem inferior.
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = trilhoRef.current;
    if (!el || e.shiftKey) return; // Shift+scroll já é tratado nativamente pelo navegador.
    const deltaHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (deltaHorizontal === 0) return;
    el.scrollLeft += deltaHorizontal;
    e.preventDefault();
  }

  // Mantém a barra de rolagem de cima do mesmo "tamanho" que o conteúdo real
  // do quadro (colunas + botão de nova coluna), para que arrastá-la corresponda
  // exatamente à rolagem do quadro logo abaixo.
  useEffect(() => {
    const el = trilhoRef.current;
    if (!el) return;
    const atualizarLargura = () => setLarguraConteudo(el.scrollWidth);
    atualizarLargura();
    const observer = new ResizeObserver(atualizarLargura);
    observer.observe(el);
    Array.from(el.children).forEach((filho) => observer.observe(filho));
    return () => observer.disconnect();
  }, [colunas, criandoColuna, compacto]);

  // Sincroniza a rolagem nos dois sentidos (barra de cima <-> quadro),
  // usando uma flag para não entrar em loop de "onScroll" chamando "onScroll".
  function handleScrollTopo() {
    if (sincronizandoRef.current === 'trilho') {
      sincronizandoRef.current = null;
      return;
    }
    if (!trilhoRef.current || !barraTopoRef.current) return;
    sincronizandoRef.current = 'topo';
    trilhoRef.current.scrollLeft = barraTopoRef.current.scrollLeft;
  }

  function handleScrollTrilho() {
    if (sincronizandoRef.current === 'topo') {
      sincronizandoRef.current = null;
      return;
    }
    if (!trilhoRef.current || !barraTopoRef.current) return;
    sincronizandoRef.current = 'trilho';
    barraTopoRef.current.scrollLeft = trilhoRef.current.scrollLeft;
  }

  function alternarCompacto() {
    setCompacto((atual) => {
      const novo = !atual;
      window.localStorage.setItem(LARGURA_STORAGE_KEY, novo ? '1' : '0');
      return novo;
    });
  }

  function salvarColunas(novas: ColunaKanban[]) {
    setColunas(novas);
    kanbanColunaService.salvar(novas);
  }

  function iniciarRenomear(coluna: ColunaKanban) {
    setColunaRenomeando(coluna.id);
    setNomeRenomeio(coluna.label);
  }

  function confirmarRenomear() {
    if (!colunaRenomeando || !nomeRenomeio.trim()) return;
    salvarColunas(colunas.map((c) => (c.id === colunaRenomeando ? { ...c, label: nomeRenomeio.trim() } : c)));
    setColunaRenomeando(null);
  }

  function confirmarNovaColuna() {
    if (!nomeNovaColuna.trim()) return;
    const nova = kanbanColunaService.adicionar(nomeNovaColuna.trim());
    setColunas(kanbanColunaService.listar());
    setNomeNovaColuna('');
    setCriandoColuna(false);
    void nova;
  }

  function alternarSelecao(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function sairDoModoSelecao() {
    setModoSelecao(false);
    setSelecionados(new Set());
  }

  function confirmarExclusaoSelecionados() {
    onExcluirClientes(Array.from(selecionados));
    setConfirmandoExclusao(false);
    sairDoModoSelecao();
  }

  function handleCriarCliente(values: ClienteFormValues) {
    onCriarCliente(values);
    setStatusNovoCliente(null);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        {modoSelecao ? (
          <>
            <span className="text-xs text-ink-soft">{selecionados.size} selecionado(s)</span>
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(true)}
              disabled={selecionados.size === 0}
              className="btn-secondary text-xs text-brand-red hover:bg-red-50 disabled:opacity-40"
            >
              <Trash2 size={13} /> Apagar selecionados
            </button>
            <button type="button" onClick={sairDoModoSelecao} className="btn-secondary text-xs">
              <X size={13} /> Cancelar
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setModoSelecao(true)} className="btn-secondary text-xs">
            <CheckSquare size={13} /> Selecionar clientes
          </button>
        )}
        <button type="button" onClick={alternarCompacto} className="btn-secondary text-xs" title="Estreitar ou alargar as colunas">
          <ArrowLeftRight size={13} />
          {compacto ? 'Colunas normais' : 'Colunas mais juntas'}
        </button>
        <button
          type="button"
          onClick={() => setStatusNovoCliente(colunas[0]?.id ?? 'novo_lead')}
          className="btn-primary text-xs"
        >
          <UserPlus size={13} /> Adicionar Cliente
        </button>
      </div>

      {/* Barra de rolagem de cima: mesma largura do conteúdo do quadro, permitindo
          arrastar com o mouse sem precisar descer até a barra nativa embaixo. */}
      <div
        ref={barraTopoRef}
        onScroll={handleScrollTopo}
        className="kanban-barra-topo mb-1.5 overflow-x-auto overflow-y-hidden"
        style={{ height: 14 }}
        aria-hidden="true"
      >
        <div style={{ width: larguraConteudo, height: 1 }} />
      </div>

      <div
        ref={trilhoRef}
        onWheel={handleWheel}
        onScroll={handleScrollTrilho}
        className="kanban-trilho flex gap-3 overflow-x-auto pb-4"
      >
        {colunas.map((coluna) => {
          const itens = clientes.filter((c) => c.status === coluna.id);
          const isDropTarget = colunaSobre === coluna.id;
          const renomeandoEsta = colunaRenomeando === coluna.id;

          return (
            <div
              key={coluna.id}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaSobre(coluna.id);
              }}
              onDragLeave={() => setColunaSobre((c) => (c === coluna.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                if (arrastandoId) onMudarStatus(arrastandoId, coluna.id);
                setArrastandoId(null);
                setColunaSobre(null);
              }}
              className={`flex shrink-0 flex-col rounded-2xl border-2 border-dashed p-3 transition-[width,colors] duration-150 ${
                compacto ? 'w-52' : 'w-72'
              } ${isDropTarget ? 'border-zaz-purple bg-accent-soft/40' : 'border-transparent bg-surface-alt/60'}`}
            >
              <div className="mb-3 flex items-center justify-between gap-1 px-1">
                {renomeandoEsta ? (
                  <div className="flex flex-1 items-center gap-1">
                    <input
                      autoFocus
                      value={nomeRenomeio}
                      onChange={(e) => setNomeRenomeio(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmarRenomear();
                        if (e.key === 'Escape') setColunaRenomeando(null);
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                    <button onClick={confirmarRenomear} className="shrink-0 text-brand-green" title="Salvar">
                      <Check size={15} />
                    </button>
                    <button onClick={() => setColunaRenomeando(null)} className="shrink-0 text-ink-faint" title="Cancelar">
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${coluna.cor.dot}`} />
                      <p className="truncate text-sm font-semibold text-ink">{coluna.label}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setStatusNovoCliente(coluna.id)}
                        className="rounded p-1 text-ink-faint hover:bg-white hover:text-zaz-purple"
                        title="Adicionar cliente nesta coluna"
                      >
                        <UserPlus size={12} />
                      </button>
                      <button
                        onClick={() => iniciarRenomear(coluna)}
                        className="rounded p-1 text-ink-faint hover:bg-white hover:text-ink-soft"
                        title="Renomear coluna"
                      >
                        <Pencil size={12} />
                      </button>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-soft shadow-sm">
                        {itens.length}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 min-h-[80px]">
                {itens.map((cliente) => {
                  const selecionado = selecionados.has(cliente.id);
                  return (
                    <div
                      key={cliente.id}
                      draggable={!modoSelecao}
                      onDragStart={() => setArrastandoId(cliente.id)}
                      onDragEnd={() => setArrastandoId(null)}
                      className={`card flex items-start gap-2 p-3 ${modoSelecao ? '' : 'cursor-grab active:cursor-grabbing'} ${
                        arrastandoId === cliente.id ? 'opacity-40' : ''
                      } ${selecionado ? 'ring-2 ring-zaz-purple' : ''}`}
                    >
                      {modoSelecao && (
                        <button onClick={() => alternarSelecao(cliente.id)} className="mt-0.5 shrink-0 text-zaz-purple" aria-label="Selecionar cliente">
                          {selecionado ? <CheckSquare size={16} /> : <Square size={16} className="text-ink-faint" />}
                        </button>
                      )}
                      {modoSelecao ? (
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{nomeExibicaoCliente(cliente)}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                            <MapPin size={11} className="shrink-0" /> <span className="truncate">{cliente.cidade} - {cliente.estado}</span>
                          </p>
                        </div>
                      ) : (
                        <Link to={`/clientes/${cliente.id}`} className="block min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink hover:text-zaz-purple">
                            {nomeExibicaoCliente(cliente)}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                            <MapPin size={11} className="shrink-0" /> <span className="truncate">{cliente.cidade} - {cliente.estado}</span>
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                            <Phone size={11} className="shrink-0" /> <span className="truncate">{cliente.telefone}</span>
                          </p>
                        </Link>
                      )}
                    </div>
                  );
                })}
                {itens.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 py-6 text-center text-xs text-ink-faint">
                    Arraste um cliente para cá
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Adicionar nova coluna */}
        <div className="flex w-52 shrink-0 flex-col rounded-2xl border-2 border-dashed border-gray-200 bg-surface-alt/30 p-3">
          {criandoColuna ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={nomeNovaColuna}
                onChange={(e) => setNomeNovaColuna(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmarNovaColuna();
                  if (e.key === 'Escape') setCriandoColuna(false);
                }}
                placeholder="Nome da coluna"
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              />
              <div className="flex gap-1.5">
                <button onClick={confirmarNovaColuna} className="btn-primary flex-1 justify-center text-xs">
                  <Check size={13} /> Criar
                </button>
                <button onClick={() => setCriandoColuna(false)} className="btn-secondary text-xs">
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCriandoColuna(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-6 text-sm font-medium text-ink-faint hover:bg-white hover:text-zaz-purple"
            >
              <Plus size={16} /> Nova coluna
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmandoExclusao}
        title="Apagar clientes selecionados"
        message={`Tem certeza que deseja apagar ${selecionados.size} cliente(s) selecionado(s)? Essa ação não pode ser desfeita.`}
        confirmLabel="Apagar"
        onConfirm={confirmarExclusaoSelecionados}
        onCancel={() => setConfirmandoExclusao(false)}
      />

      <Modal open={statusNovoCliente !== null} onClose={() => setStatusNovoCliente(null)} title="Adicionar cliente" size="lg">
        <ClienteForm
          colunas={colunas}
          statusInicial={statusNovoCliente ?? undefined}
          onSubmit={handleCriarCliente}
          onCancel={() => setStatusNovoCliente(null)}
        />
      </Modal>
    </div>
  );
}
