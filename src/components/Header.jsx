import { Link } from 'react-router-dom'
import { Menu, Moon, Settings, Sun } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { useTheme } from '../context/ThemeContext'
import CreditsBadge from './CreditsBadge'

export default function Header({ onMenuClick, credits }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-[56px] shrink-0 flex items-center gap-3 px-5 border-b border-border-app bg-bg-app">
      <button
        type="button"
        className="hidden max-md:grid max-md:place-items-center bg-none border-none text-text-app p-[0.4rem] rounded-sm hover:bg-surface-alt-app transition-colors"
        onClick={onMenuClick}
        aria-label="Toggle chat list"
      >
        <Menu size={18} />
      </button>

      <div className="flex items-center gap-2 font-display">
        <span className="w-[26px] h-[26px] grid place-items-center rounded-[8px] bg-gradient-to-br from-accent-app to-[#b7a9ff] text-white font-bold text-[0.85rem]">N</span>
        <span className="font-semibold text-[1rem] tracking-tight">Nexus</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <CreditsBadge credits={credits} />

        <Link to="/settings" className="grid place-items-center w-8 h-8 rounded-sm border border-border-app bg-surface-app text-text-app hover:bg-surface-alt-app no-underline transition-colors" aria-label="Settings">
          <Settings size={16} />
        </Link>

        <button
          type="button"
          className="grid place-items-center w-8 h-8 rounded-sm border border-border-app bg-surface-app text-text-app hover:bg-surface-alt-app no-underline transition-colors"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  )
}
