import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, History, MoreHorizontal } from 'lucide-react';

const MOBILE_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/configuracoes', label: 'Mais', icon: MoreHorizontal },
];

export function Footer() {
  return (
    <nav className="sticky bottom-0 z-20 flex items-center justify-around border-t border-gray-100 bg-white px-2 py-2 lg:hidden">
      {MOBILE_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium ${
              isActive ? 'text-zaz-purple' : 'text-ink-faint'
            }`
          }
        >
          <item.icon size={20} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
