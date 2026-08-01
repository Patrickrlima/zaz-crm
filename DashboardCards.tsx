import { motion } from 'framer-motion';
import { Users, CalendarClock, Handshake, FileText, type LucideIcon } from 'lucide-react';

interface CardData {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  hint?: string;
  hintColor?: string;
}

interface DashboardCardsProps {
  clientesCadastrados: number;
  clientesNovosSemana: number;
  retornosHoje: number;
  negociacoes: number;
  propostasEsteMes: number;
  onVerAgenda?: () => void;
}

export function DashboardCards({
  clientesCadastrados,
  clientesNovosSemana,
  retornosHoje,
  negociacoes,
  propostasEsteMes,
  onVerAgenda,
}: DashboardCardsProps) {
  const cards: CardData[] = [
    {
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-brand-blue',
      label: 'Clientes cadastrados',
      value: clientesCadastrados,
      hint: `+${clientesNovosSemana} esta semana`,
      hintColor: 'text-brand-green',
    },
    {
      icon: CalendarClock,
      iconBg: 'bg-orange-50',
      iconColor: 'text-brand-orange',
      label: 'Retornos hoje',
      value: retornosHoje,
      hint: 'Ver agenda →',
      hintColor: 'text-zaz-purple',
    },
    {
      icon: Handshake,
      iconBg: 'bg-purple-50',
      iconColor: 'text-zaz-purple',
      label: 'Negociações',
      value: negociacoes,
      hint: 'Em andamento',
      hintColor: 'text-ink-faint',
    },
    {
      icon: FileText,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      label: 'Propostas enviadas',
      value: propostasEsteMes,
      hint: 'Este mês',
      hintColor: 'text-ink-faint',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
          whileHover={{ y: -2 }}
          className="card flex items-start justify-between p-5"
        >
          <div>
            <p className="text-sm text-ink-soft">{card.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-ink">{card.value}</p>
            {card.hint && (
              <button
                onClick={card.label === 'Retornos hoje' ? onVerAgenda : undefined}
                className={`mt-1.5 text-xs font-medium ${card.hintColor} ${
                  card.label === 'Retornos hoje' ? 'cursor-pointer hover:underline' : ''
                }`}
              >
                {card.hint}
              </button>
            )}
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
            <card.icon size={20} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
