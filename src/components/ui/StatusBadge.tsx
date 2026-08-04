import { STATUS_CLIENTE_COLOR, STATUS_CLIENTE_LABEL, STATUS_CLIENTE_COLOR_PADRAO, STATUS_PROPOSTA_COLOR, STATUS_PROPOSTA_LABEL } from '../../types';
import type { StatusCliente, StatusProposta } from '../../types';

export function ClienteStatusBadge({ status }: { status: StatusCliente }) {
  const c = STATUS_CLIENTE_COLOR[status] ?? STATUS_CLIENTE_COLOR_PADRAO;
  return (
    <span className={`badge ${c.bg} ${c.text}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {STATUS_CLIENTE_LABEL[status] ?? status}
    </span>
  );
}

export function PropostaStatusBadge({ status }: { status: StatusProposta }) {
  const c = STATUS_PROPOSTA_COLOR[status];
  return <span className={`badge ${c.bg} ${c.text}`}>{STATUS_PROPOSTA_LABEL[status]}</span>;
}
