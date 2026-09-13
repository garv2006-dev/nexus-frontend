import React from 'react'
import { Link } from 'react-router-dom'
import UserMenu from './UserMenu'
import {
  Bell,
  Sparkles,
  LayoutDashboard
} from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'

export default function Header() {
  const { pendingInvitations } = useWorkspace()

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Brand Logo */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white tracking-tight text-sm sm:text-base">
            Nexus <span className="text-indigo-400 font-normal">RAG</span>
          </span>
        </Link>
      </div>

      {/* Right Nav Options & Auth */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline-block">Dashboard</span>
        </Link>

        {/* Pending Invitations */}
        <Link
          to="/invitations"
          className="relative p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Workspace Invitations"
        >
          <Bell className="w-4 h-4" />
          {pendingInvitations.length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
          )}
        </Link>

        {/* User Avatar Menu */}
        <div className="pl-1">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
