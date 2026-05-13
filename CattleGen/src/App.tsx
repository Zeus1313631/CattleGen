import { useState } from 'react'
import {
  LayoutDashboard,
  Home,
  List,
  GitMerge,
  Database,
  Dna,
  Settings as SettingsIcon,
  type LucideIcon
} from 'lucide-react'
import DashboardPage from './pages/DashboardPage'
import MyRanchPage from './pages/MyRanchPage'
import AnimalRegistryPage from './pages/AnimalRegistryPage'
import PredictionsPage from './pages/PredictionsPage'
import PublicDatabasePage from './pages/PublicDatabasePage'
import GenomicsPage from './pages/GenomicsPage'
import SettingsPage from './pages/SettingsPage'

type NavKey =
  | 'dashboard'
  | 'myranch'
  | 'animals'
  | 'predictions'
  | 'public'
  | 'genomics'
  | 'settings'

type NavItem = { key: NavKey; label: string; icon: LucideIcon }

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'myranch', label: 'My Ranch', icon: Home },
  { key: 'animals', label: 'Animal Registry', icon: List },
  { key: 'predictions', label: 'Breeding Predictions', icon: GitMerge },
  { key: 'public', label: 'Public Database', icon: Database },
  { key: 'genomics', label: 'Genomics', icon: Dna },
  { key: 'settings', label: 'Settings', icon: SettingsIcon }
]

export default function App() {
  const [active, setActive] = useState<NavKey>('dashboard')

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-60 shrink-0 bg-ranch-900 text-ranch-100 flex flex-col">
        <div className="px-5 py-5 border-b border-ranch-800">
          <div className="text-xl font-bold tracking-tight text-ranch-50">CattleGen</div>
          <div className="text-[11px] uppercase tracking-widest text-ranch-300 mt-1">
            Breeding · Genetics · Ranch
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-4 ${
                  isActive
                    ? 'bg-ranch-800 text-white border-ranch-400'
                    : 'text-ranch-200 hover:bg-ranch-800/60 border-transparent'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="px-5 py-3 border-t border-ranch-800 text-[11px] text-ranch-400">
          v0.1.0 · Local-first · SQLite
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {active === 'dashboard' && <DashboardPage onNavigate={setActive} />}
        {active === 'myranch' && <MyRanchPage />}
        {active === 'animals' && <AnimalRegistryPage />}
        {active === 'predictions' && <PredictionsPage />}
        {active === 'public' && <PublicDatabasePage />}
        {active === 'genomics' && <GenomicsPage />}
        {active === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}

export type { NavKey }
