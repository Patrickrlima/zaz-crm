import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventoAgenda } from '../../types';

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface AgendaCalendarioProps {
  eventos: EventoAgenda[];
  selecionado: string;
  onSelecionar: (dataISO: string) => void;
}

export function AgendaCalendario({ eventos, selecionado, onSelecionar }: AgendaCalendarioProps) {
  const [mesAtual, setMesAtual] = useState(() => {
    const d = new Date(`${selecionado}T00:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, number>();
    eventos.forEach((e) => map.set(e.data, (map.get(e.data) ?? 0) + 1));
    return map;
  }, [eventos]);

  const dias = useMemo(() => {
    const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
    const fimMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
    const inicioGrade = new Date(inicioMes);
    inicioGrade.setDate(inicioGrade.getDate() - inicioMes.getDay());
    const fimGrade = new Date(fimMes);
    fimGrade.setDate(fimGrade.getDate() + (6 - fimMes.getDay()));

    const arr: Date[] = [];
    const cursor = new Date(inicioGrade);
    while (cursor <= fimGrade) {
      arr.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return arr;
  }, [mesAtual]);

  const hojeISO = toISODate(new Date());

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">
          {MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1))}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-alt"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMesAtual(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1))}
            className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-alt"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink-faint">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dias.map((dia) => {
          const iso = toISODate(dia);
          const noMes = dia.getMonth() === mesAtual.getMonth();
          const isSelecionado = iso === selecionado;
          const isHoje = iso === hojeISO;
          const qtdEventos = eventosPorDia.get(iso) ?? 0;

          return (
            <button
              key={iso}
              onClick={() => onSelecionar(iso)}
              className={`relative flex h-10 flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                !noMes ? 'text-ink-faint/50' : 'text-ink'
              } ${isSelecionado ? 'bg-zaz-purple text-white' : 'hover:bg-surface-alt'} ${
                isHoje && !isSelecionado ? 'font-bold text-zaz-purple' : ''
              }`}
            >
              {dia.getDate()}
              {qtdEventos > 0 && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    isSelecionado ? 'bg-white' : 'bg-zaz-purple'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
