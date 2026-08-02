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
  CloudOff,
  X,
  Calculator,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import zazLogo from '../../assets/zaz-logo.jpg';

const URL_SIMULADOR_EXTERNO = 'https://patrickrlima.github.io/Simulador-Vero/';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/prospeccoes', label: 'Prospecções', icon: Target },
  { to: '/propostas', label: 'Propostas', icon: FileText },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
}

export function Sidebar({ open, onClose, collapsed }: SidebarProps) {
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
        className={`fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-sidebar-border bg-sidebar text-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={zazLogo} alt="ZAZ Vendas" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
            {!collapsed && (
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">Central do</p>
                <p className="text-sm font-semibold text-white">Vendedor</p>
              </div>
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zaz-purple text-white'
                    : 'text-white/70 hover:bg-sidebar-hover hover:text-white'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={19} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}

          <a
            href={URL_SIMULADOR_EXTERNO}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-sidebar-hover hover:text-white"
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
        </nav>

        {!collapsed && (
          <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-hover px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white/80">
              <CloudOff size={14} className="text-amber-400" />
              Sincronização
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Offline
            </p>
            <p className="mt-1.5 text-[11px] leading-snug text-white/40">
              Seus dados estão salvos localmente neste dispositivo.
            </p>
          </div>
        )}
      </motion.aside>
    </>
  );
}
