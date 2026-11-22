import { NavLink, Outlet } from 'react-router-dom';
import {
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Settings,
  Target,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MonthSelector } from './MonthSelector';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transações', icon: ArrowLeftRight, end: false },
  { to: '/budgets', label: 'Metas & Categorias', icon: Target, end: false },
  { to: '/goals', label: 'Objetivos', icon: PiggyBank, end: false },
  { to: '/settings', label: 'Configurações', icon: Settings, end: false },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">FinTrack</span>
            <p className="text-xs text-slate-400">Finanças Pessoais</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/70 px-3 py-2.5 border border-slate-800/80">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sair"
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Logo mobile */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
              <span className="font-bold text-white">FinTrack</span>
            </div>

            <div className="hidden lg:block">
              <p className="text-sm text-slate-400">
                Olá, <span className="font-medium text-slate-100">{user?.name}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <MonthSelector />
              <button
                type="button"
                onClick={logout}
                title="Sair"
                className="lg:hidden rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-rose-400 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Navegação Mobile */}
          <nav className="mt-3 flex lg:hidden gap-1.5 overflow-x-auto pb-0.5">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
