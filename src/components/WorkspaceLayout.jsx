import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useParams, Navigate, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  FileText,
  Users,
  PieChart,
  Settings,
  Layers,
  Sparkles,
  Zap,
  ChevronDown,
  Check,
  Plus
} from 'lucide-react'
import Header from './Header'
import { useWorkspace } from '../context/WorkspaceContext'
import CreateWorkspaceModal from './CreateWorkspaceModal'

export default function WorkspaceLayout({ children }) {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const { activeWorkspace, switchWorkspace, workspaces, loading } = useWorkspace()
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

  // Ensure workspace context matches route param workspaceId
  useEffect(() => {
    if (workspaceId && (!activeWorkspace || activeWorkspace.id !== workspaceId)) {
      switchWorkspace(workspaceId)
    }
  }, [workspaceId, activeWorkspace, switchWorkspace])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-md border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading Workspace...</p>
        </div>
      </div>
    )
  }

  const currentWs = activeWorkspace || workspaces.find(w => w.id === workspaceId)
  if (!currentWs && workspaces.length > 0) {
    return <Navigate to={`/workspace/${workspaces[0].id}/chat`} replace />
  }

  const isOwner = currentWs?.user_role === 'owner'

  const navItems = [
    { label: 'Chat', icon: MessageSquare, path: `/workspace/${workspaceId}/chat` },
    { label: 'Documents', icon: FileText, path: `/workspace/${workspaceId}/documents` },
    { label: 'Members', icon: Users, path: `/workspace/${workspaceId}/members` },
    { label: 'Usage', icon: PieChart, path: `/workspace/${workspaceId}/usage` },
    { label: 'Plan & Upgrades', icon: Zap, path: `/workspace/${workspaceId}/plan` },
    ...(isOwner ? [{ label: 'Settings', icon: Settings, path: `/workspace/${workspaceId}/settings` }] : []),
  ]

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Non-Scrolling Navigation Sidebar */}
        <aside className="w-64 h-full bg-slate-900/60 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 hidden md:flex overflow-hidden">
          <div className="space-y-6 flex-1 flex flex-col min-h-0">
            {/* Interactive Workspace Switcher Header Card */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full p-3 rounded-md bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between text-left transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-md bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                      {currentWs?.name || 'Workspace'}
                    </h3>
                    <span className="text-[10px] text-slate-400 capitalize block truncate">
                      {currentWs?.user_role || 'member'} Access
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Workspace Switcher Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-md bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Switch Workspace
                  </div>
                  <div className="max-h-56 overflow-y-auto px-1.5 space-y-1">
                    {workspaces.map((ws) => {
                      const isActive = currentWs && currentWs.id === ws.id
                      return (
                        <button
                          key={ws.id}
                          onClick={() => {
                            switchWorkspace(ws.id)
                            setDropdownOpen(false)
                            navigate(`/workspace/${ws.id}/chat`)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left transition-colors ${
                            isActive
                              ? 'bg-indigo-600/15 text-indigo-400 font-medium border border-indigo-500/20'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate font-medium">{ws.name}</div>
                            <div className="text-[10px] text-slate-400">
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

                  <div className="border-t border-slate-800 mt-2 pt-2 px-1.5">
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        setCreateModalOpen(true)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-indigo-400 hover:bg-indigo-600/10 font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Navigation Menu */}
            <nav className="space-y-1 overflow-y-auto flex-1 pr-0.5">
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-1">
                Workspace Menu
              </div>
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Footer Badge */}
          <div className="p-3.5 rounded-md bg-indigo-950/30 border border-indigo-500/20 text-xs shrink-0 mt-4">
            <div className="flex items-center gap-2 text-indigo-300 font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> RAG Multi-Tenant Active
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Workspace level hybrid search & token isolation enabled.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-30 flex justify-around p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-2 rounded-md text-[10px] ${
                  isActive ? 'text-indigo-400 font-semibold bg-slate-800/60' : 'text-slate-400'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Main Workspace Content Area */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  )
}
