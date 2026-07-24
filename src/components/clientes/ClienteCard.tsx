import { Link } from 'react-router-dom';
import { Store, Phone, MapPin } from 'lucide-react';
import type { Cliente } from '../../types';
import { ClienteStatusBadge } from '../ui/StatusBadge';
import { initials } from '../../utils/format';

export function ClienteCard({ cliente }: { cliente: Cliente }) {
  return (
    <Link
      to={`/clientes/${cliente.id}`}
      className="card group flex flex-col gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-sm font-semibold text-zaz-purple">
          {initials(cliente.nomeFantasia) || <Store size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink group-hover:text-zaz-purple">{cliente.nomeFantasia}</p>
          <p className="truncate text-xs text-ink-faint">{cliente.segmento}</p>
        </div>
        <ClienteStatusBadge status={cliente.status} />
      </div>

      <div className="space-y-1.5 border-t border-gray-100 pt-3 text-xs text-ink-soft">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="shrink-0 text-ink-faint" />
          <span className="truncate">
            {cliente.cidade} - {cliente.estado}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone size={13} className="shrink-0 text-ink-faint" />
          <span className="truncate">{cliente.telefone}</span>
        </div>
      </div>
    </Link>
  );
}
