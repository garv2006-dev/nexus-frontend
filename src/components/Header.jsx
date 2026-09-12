import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import {
  ChevronDown,
  Check,
  Plus,
  Bell,
  Layers,
  Sparkles,
  LayoutDashboard
} from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import CreateWorkspaceModal from './CreateWorkspaceModal'

export default function Header() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { workspaces, activeWorkspace, pendingInvitations, switchWorkspace } = useWorkspace()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand + Workspace Switcher */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-white tracking-tight hidden sm:inline-block">
              Nexus <span className="text-indigo-400 font-normal">RAG</span>
            </span>
          </Link>

          {/* Workspace Switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-medium transition-colors"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="max-w-[140px] sm:max-w-[200px] truncate">
                {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  Workspaces
                </div>
                <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
                  {workspaces.map((ws) => {
                    const isActive = activeWorkspace && activeWorkspace.id === ws.id
                    return (
                      <button
                        key={ws.id}
                        onClick={() => {
                          switchWorkspace(ws.id)
                          setDropdownOpen(false)
                          navigate(`/workspace/${ws.id}/chat`)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                          isActive
                            ? 'bg-indigo-600/15 text-indigo-400 font-medium'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="truncate font-medium">{ws.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {ws.document_count || 0} docs • {ws.member_count || 1} members
                          </div>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </button>
                    )
                  })}

                  {workspaces.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-500 italic">No workspaces found</div>
                  )}
                </div>

                <div className="border-t border-slate-800 mt-2 pt-2 px-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      setCreateModalOpen(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-indigo-400 hover:bg-indigo-600/10 font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Nav Options & Clerk Auth */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline-block">Dashboard</span>
          </Link>

          {/* Pending Invitations */}
          <Link
            to="/invitations"
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Workspace Invitations"
          >
            <Bell className="w-4 h-4" />
            {pendingInvitations.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
            )}
          </Link>

          {/* User Button */}
          <div className="pl-1">
            <UserButton
              afterSignOutUrl="/login"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8 rounded-full ring-2 ring-indigo-500/30'
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  )
}
