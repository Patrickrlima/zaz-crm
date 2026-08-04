import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { UserPlus, Loader2, X } from 'lucide-react';
import type { Cliente, TipoEvento } from '../../types';
import { TIPO_EVENTO_LABEL } from '../../types';
import { clienteService } from '../../services/clienteService';
import { formatPhone } from '../../utils/format';

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

  // Clientes criados na hora, direto por aqui — somados à lista recebida por fora
  // pra aparecerem no seletor imediatamente, sem depender de recarregar a tela.
  const [clientesNovos, setClientesNovos] = useState<Cliente[]>([]);
  const [criandoCliente, setCriandoCliente] = useState(false);
  const [nomeNovoCliente, setNomeNovoCliente] = useState('');
  const [telefoneNovoCliente, setTelefoneNovoCliente] = useState('');
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const listaClientes = [...clientesNovos, ...clientes];

  useEffect(() => {
    if (clienteFixoId) setValue('clienteId', clienteFixoId);
  }, [clienteFixoId, setValue]);

  function handleCriarClienteRapido() {
    if (!nomeNovoCliente.trim()) return;
    setSalvandoCliente(true);
    try {
      const novo = clienteService.criar({
        nomeFantasia: nomeNovoCliente.trim(),
        razaoSocial: '',
        cnpj: '',
        telefone: telefoneNovoCliente.trim(),
        whatsapp: telefoneNovoCliente.trim(),
        email: '',
        cidade: '',
        estado: '',
        endereco: '',
        segmento: '',
        status: 'novo_lead',
        responsavel: '',
        observacoes: '',
      });
      setClientesNovos((atual) => [novo, ...atual]);
      setValue('clienteId', novo.id, { shouldValidate: true });
      setCriandoCliente(false);
      setNomeNovoCliente('');
      setTelefoneNovoCliente('');
    } finally {
      setSalvandoCliente(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!clienteFixoId && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-ink">Cliente</label>
            {!criandoCliente && (
              <button
                type="button"
                onClick={() => setCriandoCliente(true)}
                className="flex items-center gap-1 text-xs font-medium text-zaz-purple hover:underline"
              >
                <UserPlus size={13} /> Novo cliente
              </button>
            )}
          </div>

          {criandoCliente ? (
            <div className="space-y-2 rounded-xl border border-dashed border-gray-200 bg-surface-alt/50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-ink-soft">Cadastro rápido</p>
                <button type="button" onClick={() => setCriandoCliente(false)} className="text-ink-faint hover:text-ink">
                  <X size={14} />
                </button>
              </div>
              <input
                className="input-base"
                placeholder="Nome do cliente"
                value={nomeNovoCliente}
                onChange={(e) => setNomeNovoCliente(e.target.value)}
                autoFocus
              />
              <input
                className="input-base"
                placeholder="Telefone (opcional)"
                value={telefoneNovoCliente}
                onChange={(e) => setTelefoneNovoCliente(formatPhone(e.target.value))}
              />
              <button
                type="button"
                onClick={handleCriarClienteRapido}
                disabled={!nomeNovoCliente.trim() || salvandoCliente}
                className="btn-primary w-full justify-center"
              >
                {salvandoCliente ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Criar e usar este cliente
              </button>
              <p className="text-[11px] text-ink-faint">
                Cria o cliente com os dados mínimos — dá pra completar o cadastro depois na ficha dele.
              </p>
            </div>
          ) : (
            <>
              <select className="input-base" {...register('clienteId')}>
                <option value="">Selecione um cliente</option>
                {listaClientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeFantasia || c.razaoSocial || 'Cliente sem nome'}
                  </option>
                ))}
              </select>
              {errors.clienteId && <p className="mt-1 text-xs text-brand-red">{errors.clienteId.message}</p>}
            </>
          )}
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
