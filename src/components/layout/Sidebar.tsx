import { useState, useEffect, type FormEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Target,
  FileText,
  History,
  BarChart3,
  Settings,
  Cloud,
  X,
  Calculator,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Search,
  LogOut,
  UserRound,
  ListChecks,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { authService } from '../../services/authService';
import { usuarioService } from '../../services/usuarioService';
import { agendaService } from '../../services/agendaService';
import { propostaService } from '../../services/propostaService';
import { clienteService } from '../../services/clienteService';
import { acoesService } from '../../services/acoesService';
import { STORAGE_KEYS } from '../../services/storage';
import { CLOUD_SYNC_EVENT } from '../../services/cloudSync';
import { initials } from '../../utils/format';

const URL_SIMULADOR_EXTERNO = 'https://patrickrlima.github.io/Simulador-Vero/';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: () => number;
  badgeCor?: string;
}

const NAV_PRINCIPAL: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    to: '/acoes',
    label: 'Ações',
    icon: ListChecks,
    badge: () =>
      acoesService.atividadesDeHoje().length + acoesService.clientesEsquecidos().length + acoesService.propostasParadas().length,
    badgeCor: 'bg-brand-red',
  },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: Calendar, badge: () => agendaService.retornosPendentes().length, badgeCor: 'bg-brand-red' },
  { to: '/prospeccoes', label: 'Prospecções', icon: Target, badge: () => clienteService.listar().filter((c) => c.status === 'novo_lead').length, badgeCor: 'bg-zaz-purple' },
  { to: '/pos-venda', label: 'Pós-venda', icon: Handshake },
  { to: '/propostas', label: 'Propostas', icon: FileText, badge: () => propostaService.listar().filter((p) => p.status === 'enviada').length, badgeCor: 'bg-amber-500' },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function Secao({ titulo, collapsed }: { titulo: string; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 h-px bg-white/10" />;
  return <p className="mb-1.5 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/35">{titulo}</p>;
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const sincronizando = authService.configurado;
  const [usuario, setUsuario] = useState(() => usuarioService.obter());
  const [busca, setBusca] = useState('');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (!detail || detail.key === STORAGE_KEYS.usuario || detail.key === '*') {
        setUsuario(usuarioService.obter());
      }
      forceUpdate((v) => v + 1); // recalcula os badges quando algo sincroniza
    }
    window.addEventListener(CLOUD_SYNC_EVENT, handler);
    window.addEventListener('zaz-usuario-atualizado', handler);
    return () => {
      window.removeEventListener(CLOUD_SYNC_EVENT, handler);
      window.removeEventListener('zaz-usuario-atualizado', handler);
    };
  }, []);

  function handleBuscar(e: FormEvent) {
    e.preventDefault();
    if (!busca.trim()) return;
    navigate(`/clientes?q=${encodeURIComponent(busca.trim())}`);
    onClose();
  }

  const classeLink = ({ isActive }: { isActive: boolean }) =>
    `sidebar-navlink group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? 'sidebar-navlink-active' : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
    }`;

  return (
    <>
      {/* overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 84 : 264 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={`sidebar-shell fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-sidebar-border text-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-9 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-zaz-purple text-white shadow-lg transition-transform hover:scale-105 lg:flex"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-white/70 hover:bg-sidebar-hover hover:text-white lg:hidden"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>

        {/* Cartão de perfil */}
        <div className={`flex flex-col items-center gap-2 px-4 pb-4 pt-6 text-center ${collapsed ? 'px-2' : ''}`}>
          <div className="relative">
            {usuario.fotoUrl ? (
              <img src={usuario.fotoUrl} alt={usuario.nome} className="h-20 w-20 rounded-full object-cover ring-2 ring-white/15" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white ring-2 ring-white/15">
                {initials(usuario.nome) || <UserRound size={26} className="text-white/50" />}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-sidebar ${
                sincronizando ? 'bg-brand-green' : 'bg-amber-400'
              }`}
              title={sincronizando ? 'Sincronizado' : 'Offline'}
            />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold leading-tight text-white">{usuario.nome}</p>
              <p className="text-xs text-white/50">{usuario.cargo}</p>
              <p className={`mt-1 flex items-center justify-center gap-1 text-[11px] font-medium ${sincronizando ? 'text-brand-green' : 'text-amber-400'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${sincronizando ? 'bg-brand-green' : 'bg-amber-400'}`} />
                {sincronizando ? 'Online' : 'Offline'}
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <form onSubmit={handleBuscar} className="px-4 pb-2">
            <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
              <Search size={15} className="shrink-0 text-white/40" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>
          </form>
        )}

        <nav className="flex-1 overflow-y-auto px-3 pb-2">
          <Secao titulo="Menu principal" collapsed={collapsed} />
          <div className="space-y-1">
            {NAV_PRINCIPAL.map((item) => {
              const contagem = item.badge?.();
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={classeLink}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={19} className="shrink-0" />
                  {!collapsed && (
                    <span className="flex flex-1 items-center justify-between truncate">
                      {item.label}
                      {!!contagem && (
                        <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white ${item.badgeCor}`}>
                          {contagem}
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          <Secao titulo="Preferências" collapsed={collapsed} />
          <div className="space-y-1">
            <a
              href={URL_SIMULADOR_EXTERNO}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-navlink group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-sidebar-hover hover:text-white"
              title={collapsed ? 'Simulador' : undefined}
            >
              <Calculator size={19} className="shrink-0" />
              {!collapsed && (
                <span className="flex flex-1 items-center justify-between truncate">
                  Simulador
                  <ExternalLink size={13} className="opacity-50" />
                </span>
              )}
            </a>
          </div>
        </nav>

        {!collapsed && (
          <div className="sidebar-footer-card m-3 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-ink">
              <Cloud size={14} className={sincronizando ? 'text-brand-green' : 'text-amber-500'} />
              {sincronizando ? 'Sincronizado com a nuvem' : 'Somente neste dispositivo'}
            </div>
          </div>
        )}

        <div className={`flex items-center gap-1 border-t border-white/10 px-3 py-2.5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <NavLink to="/configuracoes" onClick={onClose} className="rounded-lg p-2 text-white/60 hover:bg-sidebar-hover hover:text-white" title="Configurações">
            <Settings size={17} />
          </NavLink>
          {authService.configurado && (
            <button onClick={() => authService.sair()} className="rounded-lg p-2 text-white/60 hover:bg-sidebar-hover hover:text-brand-red" title="Sair">
              <LogOut size={17} />
            </button>
          )}
        </div>
      </motion.aside>
    </>
  );
}
