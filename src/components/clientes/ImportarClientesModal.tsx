import { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import {
  lerArquivo,
  mapearLinhas,
  executarImportacao,
  type LinhaImportada,
  type ResultadoImportacao,
  type ModoImportacao,
} from '../../services/importService';
import { nomeExibicaoCliente } from '../../utils/format';

interface ImportarClientesModalProps {
  open: boolean;
  onClose: () => void;
  onImportado: () => void;
  modo?: ModoImportacao;
}

export function ImportarClientesModal({ open, onClose, onImportado, modo = 'padrao' }: ImportarClientesModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaImportada[] | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [importando, setImportando] = useState(false);

  function reset() {
    setLinhas(null);
    setResultado(null);
    setErro(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleFechar() {
    reset();
    onClose();
  }

  async function handleArquivo(file: File) {
    setErro(null);
    setCarregando(true);
    try {
      const linhasCruas = await lerArquivo(file);
      if (linhasCruas.length === 0) {
        setErro('Não encontramos nenhuma linha de dados nesse arquivo.');
        return;
      }
      setLinhas(mapearLinhas(linhasCruas, modo));
    } catch {
      setErro('Não foi possível ler esse arquivo. Confira se é um .csv, .xlsx ou .xls válido.');
    } finally {
      setCarregando(false);
    }
  }

  function handleConfirmarImportacao() {
    if (!linhas) return;
    setImportando(true);
    try {
      const res = executarImportacao(linhas);
      setResultado(res);
      onImportado();
    } finally {
      setImportando(false);
    }
  }

  const validas = linhas?.filter((l) => l.acao !== 'ignorar') ?? [];
  const criar = validas.filter((l) => l.acao === 'criar').length;
  const atualizar = validas.filter((l) => l.acao === 'atualizar').length;
  const ignoradas = linhas?.filter((l) => l.acao === 'ignorar').length ?? 0;

  return (
    <Modal open={open} onClose={handleFechar} title={modo === 'pos_venda' ? 'Importar planilha de pós-venda' : 'Importar clientes'} size="lg">
      {resultado ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 text-brand-green" size={32} />
          <h3 className="font-semibold text-ink">Importação concluída</h3>
          <p className="mt-2 text-sm text-ink-soft">
            {resultado.criados} cliente(s) novo(s) cadastrado(s), {resultado.atualizados} atualizado(s)
            {resultado.ignorados > 0 && `, ${resultado.ignorados} linha(s) ignorada(s)`}.
          </p>
          <button onClick={handleFechar} className="btn-primary mt-5">
            Concluir
          </button>
        </div>
      ) : !linhas ? (
        <div>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleArquivo(file);
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-surface-alt/40 px-6 py-12 text-center transition-colors hover:border-zaz-purple hover:bg-accent-soft/40"
          >
            {carregando ? (
              <Loader2 className="animate-spin text-zaz-purple" size={28} />
            ) : (
              <UploadCloud className="text-ink-faint" size={28} />
            )}
            <p className="mt-3 text-sm font-medium text-ink">Clique para escolher um arquivo ou arraste aqui</p>
            <p className="mt-1 text-xs text-ink-faint">Aceita .xlsx, .xls ou .csv</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleArquivo(file);
              }}
            />
          </div>

          {erro && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-brand-red">
              <AlertTriangle size={14} /> {erro}
            </p>
          )}

          <div className="mt-4 rounded-xl bg-surface-alt/60 p-3 text-xs text-ink-faint">
            <p className="mb-1 font-medium text-ink-soft">Colunas reconhecidas automaticamente:</p>
            Nome/Nome Fantasia, Razão Social, CNPJ, Telefone, WhatsApp, E-mail, Cidade, Estado/UF, Endereço,
            Segmento, Status, Responsável, Observações, MCV comprometido
            {modo === 'pos_venda' && ', TPV Atual'} — não precisa estar na ordem certa, nem com todos os
            campos preenchidos. Clientes com o mesmo CNPJ de um já cadastrado são atualizados em vez de duplicados.
            {modo === 'pos_venda' && (
              <p className="mt-2">
                Esses clientes entram marcados como <strong>pós-venda</strong> e já aparecem no Dashboard Analítico.
                Se a planilha tiver uma coluna de <strong>TPV Atual</strong>, criamos automaticamente uma proposta
                "aceita" nesse valor para cada um.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm text-ink-soft">
            <FileSpreadsheet size={16} className="text-zaz-purple" />
            {criar} novo(s) · {atualizar} atualização(ões)
            {ignoradas > 0 && ` · ${ignoradas} ignorada(s)`}
          </div>

          <div className="max-h-80 overflow-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-surface-alt">
                <tr>
                  <th className="px-3 py-2 font-medium text-ink-soft">Linha</th>
                  <th className="px-3 py-2 font-medium text-ink-soft">Nome</th>
                  <th className="px-3 py-2 font-medium text-ink-soft">CNPJ</th>
                  <th className="px-3 py-2 font-medium text-ink-soft">Cidade</th>
                  <th className="px-3 py-2 font-medium text-ink-soft">Ação</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.linha} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-ink-faint">{l.linha}</td>
                    <td className="px-3 py-2 text-ink">
                      {l.dados.nomeFantasia ? nomeExibicaoCliente(l.dados as { nomeFantasia?: string; razaoSocial?: string }) : <span className="text-ink-faint">{l.erro}</span>}
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{l.dados.cnpj || '—'}</td>
                    <td className="px-3 py-2 text-ink-soft">{l.dados.cidade || '—'}</td>
                    <td className="px-3 py-2">
                      {l.acao === 'criar' && <span className="badge bg-green-50 text-brand-green">Novo</span>}
                      {l.acao === 'atualizar' && <span className="badge bg-blue-50 text-blue-600">Atualizar</span>}
                      {l.acao === 'ignorar' && <span className="badge bg-gray-100 text-ink-faint">Ignorar</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={reset} className="btn-secondary">
              Escolher outro arquivo
            </button>
            <button onClick={handleConfirmarImportacao} disabled={importando || validas.length === 0} className="btn-primary">
              {importando ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
              Importar {validas.length} cliente(s)
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
