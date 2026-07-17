import { Link } from 'react-router-dom'
import { Menu, Moon, Settings, Sun } from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { useTheme } from '../context/ThemeContext'
import CreditsBadge from './CreditsBadge'

export default function Header({ onMenuClick, credits }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="header">
      <button
        type="button"
        className="header__menu"
        onClick={onMenuClick}
        aria-label="Toggle chat list"
      >
        <Menu size={18} />
      </button>

      <div className="header__brand">
        <span className="header__mark">N</span>
        <span className="header__name">Nexus</span>
      </div>

      <div className="header__actions">
        <CreditsBadge credits={credits} />

        <Link to="/settings" className="header__icon-button" aria-label="Settings">
          <Settings size={16} />
        </Link>

        <button
          type="button"
          className="header__icon-button"
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
