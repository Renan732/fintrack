import { useState, type FormEvent } from 'react';
import { Download, KeyRound, Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ApiError, authApi, transactionsApi } from '../services/api';
import { exportTransactionsToCsv, formatDate } from '../utils/format';

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  // Perfil
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Exportação geral
  const [exportingAll, setExportingAll] = useState(false);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        email: email.trim(),
      });
      updateUser(res.user);
      showToast('Perfil atualizado com sucesso!');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Erro ao atualizar perfil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('A confirmação da nova senha não confere.', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Senha alterada com sucesso!');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Erro ao alterar senha.', 'error');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleExportAllTransactions() {
    setExportingAll(true);
    try {
      const res = await transactionsApi.list();
      if (res.transactions.length === 0) {
        showToast('Nenhuma transação encontrada para exportar.', 'info');
        return;
      }
      exportTransactionsToCsv(res.transactions, 'fintrack-historico-completo.csv');
      showToast(`${res.transactions.length} transação(ões) exportadas para CSV!`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Erro ao exportar dados.', 'error');
    } finally {
      setExportingAll(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Configurações</h1>
        <p className="text-sm text-slate-400">
          Gerencie seus dados pessoais, segurança da conta e exportação do histórico.
        </p>
      </div>

      {/* Dados do Perfil */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <UserIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Dados do perfil</h2>
            {user?.createdAt && (
              <p className="text-xs text-slate-400">
                Conta criada em {formatDate(user.createdAt)}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome</label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              {savingProfile ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </section>

      {/* Segurança / Alterar Senha */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Alterar senha</h2>
            <p className="text-xs text-slate-400">Mantenha sua conta protegida com uma senha forte.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Senha atual</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Nova senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirmar nova senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60 transition cursor-pointer"
            >
              {savingPassword ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </div>
        </form>
      </section>

      {/* Exportação de Dados */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Exportar histórico completo</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Baixe todas as suas transações registradas em formato CSV compatível com Excel.
          </p>
        </div>

        <button
          type="button"
          disabled={exportingAll}
          onClick={handleExportAllTransactions}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60 transition cursor-pointer"
        >
          <Download className="h-4 w-4" />
          {exportingAll ? 'Exportando...' : 'Baixar CSV completo'}
        </button>
      </section>
    </div>
  );
}
