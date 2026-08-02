import { NavLink } from 'react-router-dom';
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
  CloudOff,
  X,
  Calculator,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import zazLogo from '../../assets/zaz-logo.jpg';
import { authService } from '../../services/authService';

const URL_SIMULADOR_EXTERNO = 'https://patrickrlima.github.io/Simulador-Vero/';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_PRINCIPAL: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/prospeccoes', label: 'Prospecções', icon: Target },
  { to: '/propostas', label: 'Propostas', icon: FileText },
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
  const sincronizando = authService.configurado;

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
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={zazLogo} alt="ZAZ Vendas" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
            {!collapsed && (
              <p className="text-xs font-semibold leading-tight text-white">Gestão de Clientes e Prospecções</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/70 hover:bg-sidebar-hover hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-2">
          <Secao titulo="Menu principal" collapsed={collapsed} />
          <div className="space-y-1">
            {NAV_PRINCIPAL.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={classeLink}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={19} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
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
            <NavLink to="/configuracoes" onClick={onClose} className={classeLink} title={collapsed ? 'Configurações' : undefined}>
              <Settings size={19} className="shrink-0" />
              {!collapsed && <span className="truncate">Configurações</span>}
            </NavLink>
          </div>
        </nav>

        {!collapsed && (
          <div className="sidebar-footer-card m-3 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-ink">
              {sincronizando ? (
                <Cloud size={14} className="text-brand-green" />
              ) : (
                <CloudOff size={14} className="text-amber-500" />
              )}
              Sincronização
            </div>
            <p
              className={`mt-1 flex items-center gap-1.5 text-xs font-medium ${
                sincronizando ? 'text-brand-green' : 'text-amber-500'
              }`}
            >
              <span className={`sync-dot h-1.5 w-1.5 rounded-full ${sincronizando ? 'bg-brand-green' : 'bg-amber-500'}`} />
              {sincronizando ? 'Em nuvem' : 'Offline'}
            </p>
            <p className="mt-1.5 text-[11px] leading-snug text-ink-faint">
              {sincronizando
                ? 'Seus dados sincronizam automaticamente entre seus dispositivos.'
                : 'Seus dados estão salvos localmente neste dispositivo.'}
            </p>
          </div>
        )}
      </motion.aside>
    </>
  );
}
