import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Loader2 } from 'lucide-react';
import { STATUS_CLIENTE_LABEL, KANBAN_COLUNAS } from '../../types';
import type { Cliente } from '../../types';
import { formatCNPJ, formatPhone } from '../../utils/format';
import { cnpjService, cnpjValido, CNPJNaoEncontradoError, type DadosCNPJ } from '../../services/cnpjService';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { ColunaKanban } from '../../services/kanbanColunaService';

// Todos os campos são opcionais na prática: nenhum tem validação de
// obrigatoriedade (sem .min()), então o cadastro pode ser salvo mesmo
// parcialmente preenchido (ex.: só o nome). Validações de formato (e-mail)
// só entram em ação quando o campo tiver algum valor.
const schema = z.object({
  nomeFantasia: z.string(),
  razaoSocial: z.string(),
  cnpj: z.string(),
  telefone: z.string(),
  whatsapp: z.string(),
  email: z.union([z.literal(''), z.string().email('E-mail inválido')]),
  cidade: z.string(),
  estado: z.string(),
  endereco: z.string(),
  numero: z.string(),
  bairro: z.string(),
  cep: z.string(),
  segmento: z.string(),
  status: z.string(),
  responsavel: z.string(),
  observacoes: z.string(),
  faturamentoEstimado: z.number().optional(),
  ticketMedio: z.number().optional(),
  mcvComprometido: z.number().optional(),
  tpvAtual: z.number().optional(),
});

export type ClienteFormValues = z.infer<typeof schema>;

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (values: ClienteFormValues) => void;
  onCancel: () => void;
  /** Colunas do Kanban a exibir no seletor de status (inclui colunas personalizadas). Se omitido, usa as 7 colunas padrão. */
  colunas?: ColunaKanban[];
  /** Coluna pré-selecionada ao abrir o formulário (ex.: ao clicar em "Adicionar cliente" numa coluna específica). */
  statusInicial?: string;
}

export function ClienteForm({ cliente, onSubmit, onCancel, colunas, statusInicial }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
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
          numero: '',
          bairro: '',
          cep: '',
          segmento: '',
          status: statusInicial ?? colunas?.[0]?.id ?? 'novo_lead',
          responsavel: '',
          observacoes: '',
        },
  });

  const opcoesStatus: { id: string; label: string }[] =
    colunas ?? KANBAN_COLUNAS.map((s) => ({ id: s, label: STATUS_CLIENTE_LABEL[s] }));

  const [confirmandoBusca, setConfirmandoBusca] = useState(false);
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [erroCNPJ, setErroCNPJ] = useState<string | null>(null);

  function handleClickBuscarCNPJ() {
    setErroCNPJ(null);
    const cnpjAtual = getValues('cnpj');
    if (!cnpjValido(cnpjAtual)) {
      setErroCNPJ('Informe um CNPJ completo (14 dígitos) para buscar.');
      return;
    }
    setConfirmandoBusca(true);
  }

  async function confirmarBusca() {
    setConfirmandoBusca(false);
    setBuscandoCNPJ(true);
    setErroCNPJ(null);
    try {
      const dados: DadosCNPJ = await cnpjService.consultar(getValues('cnpj'));
      if (dados.razaoSocial) setValue('razaoSocial', dados.razaoSocial, { shouldDirty: true });
      if (dados.nomeFantasia) setValue('nomeFantasia', dados.nomeFantasia, { shouldDirty: true });
      if (dados.endereco) setValue('endereco', dados.endereco, { shouldDirty: true });
      if (dados.numero) setValue('numero', dados.numero, { shouldDirty: true });
      if (dados.bairro) setValue('bairro', dados.bairro, { shouldDirty: true });
      if (dados.cidade) setValue('cidade', dados.cidade, { shouldDirty: true });
      if (dados.estado) setValue('estado', dados.estado, { shouldDirty: true });
      if (dados.cep) setValue('cep', dados.cep, { shouldDirty: true });
      if (dados.telefone) setValue('telefone', formatPhone(dados.telefone), { shouldDirty: true });
      if (dados.email) setValue('email', dados.email, { shouldDirty: true });
    } catch (e) {
      if (e instanceof CNPJNaoEncontradoError) {
        setErroCNPJ('Não foi possível localizar um cadastro para este CNPJ. Você pode preencher os dados manualmente.');
      } else {
        setErroCNPJ('Não foi possível consultar o CNPJ agora. Tente novamente em instantes ou preencha manualmente.');
      }
    } finally {
      setBuscandoCNPJ(false);
    }
  }

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

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">CNPJ</label>
          <div className="flex gap-2">
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
            <button
              type="button"
              onClick={handleClickBuscarCNPJ}
              disabled={buscandoCNPJ}
              className="btn-secondary shrink-0 whitespace-nowrap"
              title="Buscar dados automaticamente pelo CNPJ"
            >
              {buscandoCNPJ ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              Buscar dados
            </button>
          </div>
          {errors.cnpj && <p className="mt-1 text-xs text-brand-red">{errors.cnpj.message}</p>}
          {erroCNPJ && <p className="mt-1 text-xs text-brand-orange">{erroCNPJ}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Segmento</label>
          <input className="input-base" placeholder="Supermercado, restaurante..." {...register('segmento')} />
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
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
          <input className="input-base" type="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-brand-red">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Cidade</label>
          <input className="input-base" {...register('cidade')} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Estado</label>
          <select className="input-base" {...register('estado')}>
            <option value="">-</option>
            {ESTADOS_BR.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Endereço</label>
          <input className="input-base" {...register('endereco')} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Número</label>
          <input className="input-base" {...register('numero')} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Bairro</label>
          <input className="input-base" {...register('bairro')} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">CEP</label>
          <input className="input-base" {...register('cep')} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Coluna do Kanban</label>
          <select className="input-base" {...register('status')}>
            {opcoesStatus.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Responsável</label>
          <input className="input-base" {...register('responsavel')} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Faturamento estimado (R$)</label>
          <input
            type="number"
            step="0.01"
            className="input-base"
            {...register('faturamentoEstimado', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Ticket médio (R$)</label>
          <input
            type="number"
            step="0.01"
            className="input-base"
            {...register('ticketMedio', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">MCV comprometido (R$/mês)</label>
          <input
            type="number"
            step="0.01"
            className="input-base"
            placeholder="Valor que o cliente se comprometeu a transacionar"
            {...register('mcvComprometido', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">TPV atual (R$)</label>
          <input
            type="number"
            step="0.01"
            className="input-base"
            placeholder="Valor já transacionado na maquininha"
            {...register('tpvAtual', { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) })}
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

      <ConfirmDialog
        open={confirmandoBusca}
        title="Buscar dados pelo CNPJ"
        message="Deseja preencher automaticamente os dados deste cliente utilizando o CNPJ informado?"
        confirmLabel="Sim, buscar"
        danger={false}
        onConfirm={confirmarBusca}
        onCancel={() => setConfirmandoBusca(false)}
      />
    </form>
  );
}
