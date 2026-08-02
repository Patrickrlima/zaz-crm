import { useEffect, useMemo, useState } from 'react';
import { useCloudSyncRefresh } from '../hooks/useCloudSyncRefresh';
import { useSearchParams } from 'react-router-dom';
import { Calculator as CalcIcon, Save, FileDown, Trash2, Send } from 'lucide-react';
import { Calculadora } from '../components/simulador/Calculadora';
import { Resultado } from '../components/simulador/Resultado';
import { Resumo } from '../components/simulador/Resumo';
import { Taxas } from '../components/simulador/Taxas';
import { Modal } from '../components/ui/Modal';
import { calcular, simuladorService, type ResultadoSimulacao } from '../services/simuladorService';
import { clienteService } from '../services/clienteService';
import { propostaService } from '../services/propostaService';
import { formatCurrency, formatDate } from '../utils/format';
import type { Cliente, TaxasSimulador } from '../types';

export default function Simulador() {
  const [searchParams] = useSearchParams();
  const clienteIdParam = searchParams.get('clienteId') ?? '';

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState(clienteIdParam);
  const [valorVenda, setValorVenda] = useState(0);
  const [parcelas, setParcelas] = useState(1);
  const [formaPagamento, setFormaPagamento] = useState<keyof TaxasSimulador>('debito');
  const [taxas, setTaxas] = useState<TaxasSimulador>(simuladorService.obterTaxas());
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);
  const [modalTaxasAberto, setModalTaxasAberto] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useCloudSyncRefresh(() => setClientes(clienteService.listar()));

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(null), 3000);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  const clienteSelecionado = useMemo(() => clientes.find((c) => c.id === clienteId), [clientes, clienteId]);

  function handleCalcular() {
    if (!valorVenda) return;
    setResultado(calcular(valorVenda, parcelas, formaPagamento, taxas));
  }

  function handleLimpar() {
    setValorVenda(0);
    setParcelas(1);
    setFormaPagamento('debito');
    setResultado(null);
  }

  function handleSalvarTaxas() {
    simuladorService.salvarTaxas(taxas);
    setModalTaxasAberto(false);
    setMensagem('Taxas atualizadas com sucesso.');
  }

  function handleSalvarSimulacao() {
    if (!resultado) return;
    simuladorService.salvar({
      clienteId: clienteSelecionado?.id,
      clienteNome: clienteSelecionado?.nomeFantasia,
      valorVenda,
      parcelas,
      formaPagamento,
      taxas,
      valorLiquido: resultado.valorLiquido,
      economia: resultado.economiaVsCredito,
    });
    setMensagem('Simulação salva com sucesso.');
  }

  function handleEnviarParaProposta() {
    if (!resultado || !clienteSelecionado) {
      setMensagem('Selecione um cliente para gerar a proposta.');
      return;
    }
    propostaService.criar({
      clienteId: clienteSelecionado.id,
      clienteNome: clienteSelecionado.nomeFantasia,
      valor: valorVenda,
      parcelamento: parcelas,
      taxas,
    });
    setMensagem('Proposta criada a partir da simulação.');
  }

  async function handleGerarPdf() {
    if (!resultado) return;
    const { gerarPdfProposta } = await import('../services/pdfService');
    await gerarPdfProposta(
      {
        id: `sim_${Date.now()}`,
        clienteId: clienteSelecionado?.id ?? '',
        clienteNome: clienteSelecionado?.nomeFantasia ?? 'Cliente avulso',
        valor: valorVenda,
        parcelamento: parcelas,
        taxas,
        data: new Date().toISOString(),
        status: 'enviada',
      },
      clienteSelecionado
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Cliente (opcional)</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input-base sm:w-80">
            <option value="">Simulação avulsa</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomeFantasia}
              </option>
            ))}
          </select>
        </div>
        <button onClick={() => setModalTaxasAberto(true)} className="btn-secondary self-end">
          Configurar taxas
        </button>
      </div>

      {mensagem && (
        <div className="rounded-xl bg-orange-50 px-4 py-2.5 text-sm text-zaz-purple">{mensagem}</div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Calculadora
            valorVenda={valorVenda}
            parcelas={parcelas}
            formaPagamento={formaPagamento}
            onValorVendaChange={setValorVenda}
            onParcelasChange={setParcelas}
            onFormaPagamentoChange={setFormaPagamento}
          />

          <div className="flex flex-wrap gap-2">
            <button onClick={handleCalcular} className="btn-primary">
              <CalcIcon size={15} /> Calcular
            </button>
            <button onClick={handleSalvarSimulacao} disabled={!resultado} className="btn-secondary disabled:opacity-40">
              <Save size={15} /> Salvar
            </button>
            <button onClick={handleGerarPdf} disabled={!resultado} className="btn-secondary disabled:opacity-40">
              <FileDown size={15} /> Gerar PDF
            </button>
            <button onClick={handleEnviarParaProposta} disabled={!resultado} className="btn-secondary disabled:opacity-40">
              <Send size={15} /> Enviar para proposta
            </button>
            <button onClick={handleLimpar} className="btn-secondary text-brand-red hover:bg-red-50">
              <Trash2 size={15} /> Limpar
            </button>
          </div>

          {clienteSelecionado && (
            <div className="card p-4">
              <h4 className="mb-2 text-sm font-semibold text-ink">Histórico de simulações do cliente</h4>
              <SimulacoesCliente clienteId={clienteSelecionado.id} />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <Resultado resultado={resultado} />
          <Resumo valorVenda={valorVenda} taxas={taxas} formaSelecionada={formaPagamento} />
        </div>
      </div>

      <Modal open={modalTaxasAberto} onClose={() => setModalTaxasAberto(false)} title="Configurar taxas">
        <Taxas taxas={taxas} onChange={setTaxas} onSalvar={handleSalvarTaxas} />
      </Modal>
    </div>
  );
}

function SimulacoesCliente({ clienteId }: { clienteId: string }) {
  const simulacoes = simuladorService.listarPorCliente(clienteId).slice(0, 3);
  if (simulacoes.length === 0) return <p className="text-sm text-ink-faint">Nenhuma simulação salva ainda.</p>;
  return (
    <div className="space-y-2">
      {simulacoes.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2 text-sm">
          <span className="text-ink-soft">{formatDate(s.data)}</span>
          <span className="font-medium text-ink">{formatCurrency(s.valorLiquido)}</span>
        </div>
      ))}
    </div>
  );
}
