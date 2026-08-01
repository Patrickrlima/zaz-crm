import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import type { Cliente, TipoEvento } from '../../types';
import { TIPO_EVENTO_LABEL } from '../../types';

const schema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente'),
  tipo: z.enum(['visita', 'ligacao', 'retorno', 'reuniao', 'treinamento', 'proposta']),
  data: z.string().min(1, 'Informe a data'),
  hora: z.string().min(1, 'Informe o horário'),
  observacoes: z.string().optional(),
});

export type EventoFormValues = z.infer<typeof schema>;

interface EventoFormProps {
  clientes: Cliente[];
  clienteFixoId?: string;
  tipoPadrao?: TipoEvento;
  defaultValues?: Partial<EventoFormValues>;
  onSubmit: (values: EventoFormValues) => void;
  onCancel: () => void;
}

const TIPOS: TipoEvento[] = ['visita', 'ligacao', 'retorno', 'reuniao', 'treinamento', 'proposta'];

export function EventoForm({ clientes, clienteFixoId, tipoPadrao, defaultValues, onSubmit, onCancel }: EventoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      clienteId: clienteFixoId ?? '',
      tipo: tipoPadrao ?? 'visita',
      data: new Date().toISOString().slice(0, 10),
      hora: '09:00',
      observacoes: '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (clienteFixoId) setValue('clienteId', clienteFixoId);
  }, [clienteFixoId, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!clienteFixoId && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Cliente</label>
          <select className="input-base" {...register('clienteId')}>
            <option value="">Selecione um cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomeFantasia}
              </option>
            ))}
          </select>
          {errors.clienteId && <p className="mt-1 text-xs text-brand-red">{errors.clienteId.message}</p>}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Tipo de atividade</label>
        <select className="input-base" {...register('tipo')}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {TIPO_EVENTO_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Data</label>
          <input type="date" className="input-base" {...register('data')} />
          {errors.data && <p className="mt-1 text-xs text-brand-red">{errors.data.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Horário</label>
          <input type="time" className="input-base" {...register('hora')} />
          {errors.hora && <p className="mt-1 text-xs text-brand-red">{errors.hora.message}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Observações</label>
        <textarea rows={3} className="input-base resize-none" {...register('observacoes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          Salvar atividade
        </button>
      </div>
    </form>
  );
}
