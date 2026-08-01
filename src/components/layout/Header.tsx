import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { initials } from '../../utils/format';
import { authService } from '../../services/authService';
import type { Usuario } from '../../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  usuario: Usuario;
  notificationCount?: number;
  onMenuClick: () => void;
}

export function Header({ title, subtitle, usuario, notificationCount = 0, onMenuClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-gray-100 bg-white/90 px-4 py-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-ink-soft hover:bg-surface-alt"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-soft">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-ink-soft md:flex">
          <span className="capitalize">{dataAtual}</span>
        </div>

        <button
          className="relative rounded-xl border border-gray-200 p-2.5 text-ink-soft hover:bg-surface-alt"
          aria-label="Notificações"
        >
          <Bell size={18} />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-semibold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 py-1.5 pl-1.5 pr-2 hover:bg-surface-alt"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zaz-purple text-xs font-semibold text-white">
              {initials(usuario.nome)}
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-sm font-medium text-ink">{usuario.nome}</p>
              <p className="text-xs text-ink-soft">{usuario.cargo}</p>
            </div>
            <ChevronDown size={16} className="hidden text-ink-faint sm:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg">
                <Link
                  to="/configuracoes"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-surface-alt"
                >
                  <UserCircle size={16} /> Meu perfil
                </Link>
                {authService.configurado && (
                  <button
                    onClick={() => authService.sair()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-brand-red hover:bg-red-50"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
