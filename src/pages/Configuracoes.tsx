import { useEffect, useState } from 'react';
import { Download, Upload, Trash2, Save, Moon, Sun, LogOut, Cloud, CloudOff } from 'lucide-react';
import { usuarioService } from '../services/usuarioService';
import { storage } from '../services/storage';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../services/authService';
import { limparDadosDoUsuarioAtual } from '../services/cloudSync';
import type { Usuario } from '../types';

export default function Configuracoes() {
  const [usuario, setUsuario] = useState<Usuario>(usuarioService.obter());
  const { tema, setTema } = useTheme();
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [confirmandoLimpeza, setConfirmandoLimpeza] = useState(false);

  useEffect(() => {
    if (mensagem) {
      const t = setTimeout(() => setMensagem(null), 3000);
      return () => clearTimeout(t);
    }
  }, [mensagem]);

  function handleSalvarUsuario() {
    usuarioService.salvar(usuario);
    setMensagem('Dados do usuário atualizados.');
  }

  function handleExportar() {
    const dados = storage.exportAll();
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zaz-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMensagem('Backup exportado com sucesso.');
  }

  function handleImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dados = JSON.parse(reader.result as string);
        storage.importAll(dados);
        setMensagem('Dados importados com sucesso. Recarregue a página para ver as mudanças.');
      } catch {
        setMensagem('Arquivo inválido. Verifique o backup e tente novamente.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleLimparDados() {
    setConfirmandoLimpeza(false);
    setMensagem('Apagando dados...');
    try {
      if (authService.configurado) {
        await limparDadosDoUsuarioAtual();
      } else {
        storage.clear();
      }
      setMensagem('Todos os dados foram apagados.');
    } catch {
      setMensagem('Não foi possível apagar os dados na nuvem. Verifique sua conexão e tente novamente.');
      return;
    }
    setTimeout(() => window.location.reload(), 1200);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {mensagem && <div className="rounded-xl bg-orange-50 px-4 py-2.5 text-sm text-zaz-purple">{mensagem}</div>}

      <div className="card p-5">
        <h3 className="mb-4 font-semibold text-ink">Dados do usuário</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Nome</label>
            <input
              className="input-base"
              value={usuario.nome}
              onChange={(e) => setUsuario({ ...usuario, nome: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Cargo</label>
            <input
              className="input-base"
              value={usuario.cargo}
              onChange={(e) => setUsuario({ ...usuario, cargo: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">E-mail</label>
            <input
              type="email"
              className="input-base"
              value={usuario.email}
              onChange={(e) => setUsuario({ ...usuario, email: e.target.value })}
            />
          </div>
        </div>
        <button onClick={handleSalvarUsuario} className="btn-primary mt-4">
          <Save size={15} /> Salvar alterações
        </button>
      </div>

      <div className="card p-5">
        <h3 className="mb-4 font-semibold text-ink">Aparência</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTema('claro')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
              tema === 'claro' ? 'border-zaz-purple bg-orange-50 text-zaz-purple' : 'border-gray-200 text-ink-soft'
            }`}
          >
            <Sun size={16} /> Claro
          </button>
          <button
            onClick={() => setTema('escuro')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
              tema === 'escuro' ? 'border-zaz-purple bg-orange-50 text-zaz-purple' : 'border-gray-200 text-ink-soft'
            }`}
          >
            <Moon size={16} /> Escuro
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">O tema escolhido é salvo neste dispositivo e aplicado imediatamente em todas as telas.</p>
      </div>

      <div className="card p-5">
        <h3 className="mb-4 font-semibold text-ink">Backup e dados locais</h3>
        <div className="space-y-3">
          <button onClick={handleExportar} className="btn-secondary w-full justify-start">
            <Download size={16} /> Exportar backup (JSON)
          </button>

          <label className="btn-secondary w-full cursor-pointer justify-start">
            <Upload size={16} /> Importar backup
            <input type="file" accept="application/json" onChange={handleImportar} className="hidden" />
          </label>

          <button
            onClick={() => setConfirmandoLimpeza(true)}
            className="btn-secondary w-full justify-start text-brand-red hover:bg-red-50"
          >
            <Trash2 size={16} /> Limpar todos os dados
          </button>
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          {authService.configurado
            ? 'Seus dados ficam salvos na nuvem (Supabase) e sincronizados entre seus dispositivos. "Limpar todos os dados" apaga em definitivo, na nuvem e em todos os aparelhos.'
            : 'Todos os dados são armazenados apenas neste dispositivo (LocalStorage). Faça backups regulares para não perder informações.'}
        </p>
      </div>

      {authService.configurado && (
        <div className="card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink">
            <Cloud size={16} className="text-brand-green" /> Sincronização em nuvem
          </h3>
          <p className="mb-4 text-sm text-ink-soft">
            Seus dados estão sincronizados em tempo real entre todos os dispositivos onde você fizer login com a
            mesma conta.
          </p>
          <button
            onClick={() => authService.sair()}
            className="btn-secondary w-full justify-start text-brand-red hover:bg-red-50"
          >
            <LogOut size={16} /> Sair da conta
          </button>
        </div>
      )}

      {!authService.configurado && (
        <div className="card flex items-center gap-3 p-5 text-sm text-ink-soft">
          <CloudOff size={16} className="shrink-0 text-ink-faint" />
          Sincronização em nuvem não configurada neste momento — os dados ficam salvos apenas neste dispositivo.
        </div>
      )}

      <ConfirmDialog
        open={confirmandoLimpeza}
        title="Limpar todos os dados"
        message="Esta ação apagará permanentemente todos os clientes, agendas, propostas, simulações e histórico salvos neste dispositivo. Deseja continuar?"
        confirmLabel="Apagar tudo"
        onConfirm={handleLimparDados}
        onCancel={() => setConfirmandoLimpeza(false)}
      />
    </div>
  );
}
