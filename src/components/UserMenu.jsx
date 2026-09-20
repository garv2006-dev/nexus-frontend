import React, { useState, useRef, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useNavigate, useParams } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'
import UserAvatar from './UserAvatar'

export default function UserMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const { workspaceId } = useParams()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (!user) return null

  const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User'
  const userEmail = user.primaryEmailAddress?.emailAddress || ''

  const handleSignOut = () => {
    setDropdownOpen(false)
    signOut(() => navigate('/login'))
  }

  const handleOpenProfile = () => {
    setDropdownOpen(false)
    if (workspaceId) {
      navigate(`/workspace/${workspaceId}/profile`)
    } else {
      navigate('/profile')
    }
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Avatar Trigger Button (Avatar ONLY, no chevron arrow) */}
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="p-0.5 rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex items-center justify-center"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        title="Account menu"
      >
        <UserAvatar user={user} size="md" />
      </button>

      {/* Dropdown Menu - Standardized to match project design system */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Profile Summary Header */}
          <div className="px-3.5 py-3 border-b border-slate-800 flex items-center gap-3">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {userName}
              </p>
              <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Menu Items (ONLY Profile & Sign out) */}
          <div className="p-1 space-y-0.5">
            {/* Profile */}
            <button
              onClick={handleOpenProfile}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-left group"
            >
              <User className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <span>Profile</span>
            </button>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-slate-800/60 transition-colors text-left group"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
