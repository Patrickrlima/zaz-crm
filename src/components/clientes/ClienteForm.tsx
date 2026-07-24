import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { STATUS_CLIENTE_LABEL, KANBAN_COLUNAS } from '../../types';
import type { Cliente } from '../../types';
import { formatCNPJ, formatPhone } from '../../utils/format';

const schema = z.object({
  nomeFantasia: z.string().min(2, 'Informe o nome fantasia'),
  razaoSocial: z.string().min(2, 'Informe a razão social'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  telefone: z.string().min(8, 'Informe o telefone'),
  whatsapp: z.string(),
  email: z.string().email('E-mail inválido'),
  cidade: z.string().min(2, 'Informe a cidade'),
  estado: z.string().min(2, 'UF').max(2, 'UF'),
  endereco: z.string(),
  segmento: z.string().min(2, 'Informe o segmento'),
  status: z.enum(['novo_lead', 'em_contato', 'negociacao', 'proposta_enviada', 'fechado', 'perdido']),
  responsavel: z.string().min(2, 'Informe o responsável'),
  observacoes: z.string(),
  faturamentoEstimado: z.number().optional(),
  ticketMedio: z.number().optional(),
});

export type ClienteFormValues = z.infer<typeof schema>;

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (values: ClienteFormValues) => void;
  onCancel: () => void;
}

export function ClienteForm({ cliente, onSubmit, onCancel }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: cliente
      ? { ...cliente }
      : {
          nomeFantasia: '',
          razaoSocial: '',
          cnpj: '',
          telefone: '',
          whatsapp: '',
          email: '',
          cidade: '',
          estado: 'RS',
          endereco: '',
          segmento: '',
          status: 'novo_lead',
          responsavel: '',
          observacoes: '',
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Nome fantasia</label>
          <input className="input-base" {...register('nomeFantasia')} />
          {errors.nomeFantasia && <p className="mt-1 text-xs text-brand-red">{errors.nomeFantasia.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Razão social</label>
          <input className="input-base" {...register('razaoSocial')} />
          {errors.razaoSocial && <p className="mt-1 text-xs text-brand-red">{errors.razaoSocial.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">CNPJ</label>
          <Controller
            control={control}
            name="cnpj"
            render={({ field }) => (
              <input
                className="input-base"
                value={field.value}
                onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                placeholder="00.000.000/0000-00"
              />
            )}
          />
          {errors.cnpj && <p className="mt-1 text-xs text-brand-red">{errors.cnpj.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Segmento</label>
          <input className="input-base" placeholder="Supermercado, restaurante..." {...register('segmento')} />
          {errors.segmento && <p className="mt-1 text-xs text-brand-red">{errors.segmento.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Telefone</label>
          <Controller
            control={control}
            name="telefone"
            render={({ field }) => (
              <input
                className="input-base"
                value={field.value}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            )}
          />
          {errors.telefone && <p className="mt-1 text-xs text-brand-red">{errors.telefone.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">WhatsApp</label>
          <Controller
            control={control}
            name="whatsapp"
            render={({ field }) => (
              <input
                className="input-base"
                value={field.value}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
              />
            )}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
          <input className="input-base" type="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-brand-red">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Cidade</label>
          <input className="input-base" {...register('cidade')} />
          {errors.cidade && <p className="mt-1 text-xs text-brand-red">{errors.cidade.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Estado</label>
          <select className="input-base" {...register('estado')}>
            {ESTADOS_BR.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">Endereço</label>
          <input className="input-base" {...register('endereco')} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Status</label>
          <select className="input-base" {...register('status')}>
            {KANBAN_COLUNAS.map((s) => (
              <option key={s} value={s}>
                {STATUS_CLIENTE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Responsável</label>
          <input className="input-base" {...register('responsavel')} />
          {errors.responsavel && <p className="mt-1 text-xs text-brand-red">{errors.responsavel.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Faturamento estimado (R$)</label>
          <input
            type="number"
            step="0.01"
            className="input-base"
            {...register('faturamentoEstimado', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Ticket médio (R$)</label>
          <input
            type="number"
            step="0.01"
            className="input-base"
            {...register('ticketMedio', { valueAsNumber: true })}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">Observações</label>
          <textarea rows={3} className="input-base resize-none" {...register('observacoes')} />
        </div>
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
        </button>
      </div>
    </form>
  );
}
