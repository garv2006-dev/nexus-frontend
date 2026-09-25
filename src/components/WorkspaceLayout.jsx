import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useParams, Navigate, useNavigate, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const { activeWorkspace, switchWorkspace, workspaces, loading } = useWorkspace()
  
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  
  const mobileDropdownRef = useRef(null)
  const desktopDropdownRef = useRef(null)

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target)) {
        setMobileDropdownOpen(false)
      }
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target)) {
        setDesktopDropdownOpen(false)
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-md border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading Workspace...</p>
        </div>
      </div>
    )
  }

  const currentWs = activeWorkspace || workspaces.find(w => w.id === workspaceId)
  if (!currentWs && workspaces.length > 0) {
    return <Navigate to={`/workspace/${workspaces[0].id}/chat`} replace />
  }

  const isOwnerOrAdmin = currentWs?.user_role === 'owner' || currentWs?.user_role === 'admin'

  const handleSelectWorkspace = (targetWsId) => {
    switchWorkspace(targetWsId)
    setMobileDropdownOpen(false)
    setDesktopDropdownOpen(false)
    
    // Preserve current sub-section (e.g. documents, members, usage, plan) if valid
    const parts = location.pathname.split('/')
    const currentSubPath = parts[3] || 'chat'
    const validSubPaths = ['chat', 'documents', 'members', 'usage', 'plan', 'settings', 'profile']
    const nextSubPath = validSubPaths.includes(currentSubPath) ? currentSubPath : 'chat'
    
    navigate(`/workspace/${targetWsId}/${nextSubPath}`)
  }

  const navItems = [
    { label: 'Chat', shortLabel: 'Chat', icon: MessageSquare, path: `/workspace/${workspaceId}/chat` },
    { label: 'Documents', shortLabel: 'Docs', icon: FileText, path: `/workspace/${workspaceId}/documents` },
    { label: 'Members', shortLabel: 'Members', icon: Users, path: `/workspace/${workspaceId}/members` },
    { label: 'Usage', shortLabel: 'Usage', icon: PieChart, path: `/workspace/${workspaceId}/usage` },
    { label: 'Plan & Upgrades', shortLabel: 'Plan', icon: Zap, path: `/workspace/${workspaceId}/plan` },
    ...(isOwnerOrAdmin ? [{ label: 'Settings', shortLabel: 'Settings', icon: Settings, path: `/workspace/${workspaceId}/settings` }] : []),
  ]

  return (
    <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased overflow-hidden transition-colors">
      <Header />

      {/* Mobile Workspace Switcher Bar */}
      <div className="md:hidden bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between z-30 shrink-0">
        <div className="relative flex-1" ref={mobileDropdownRef}>
          <button
            onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
            className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-left transition-all min-h-[40px]"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <div className="w-5 h-5 rounded bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-200 dark:border-indigo-500/20">
                <Layers className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {currentWs?.name || 'Workspace'}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${mobileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {mobileDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Workspace</div>
              <div className="max-h-52 overflow-y-auto px-1 space-y-0.5">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                      currentWs?.id === ws.id ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate pr-2">{ws.name}</span>
                    {currentWs?.id === ws.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 mt-1.5 pt-1.5 px-1">
                <button
                  onClick={() => {
                    setMobileDropdownOpen(false)
                    setCreateModalOpen(true)
                  }}
                  className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Fixed Desktop Navigation Sidebar */}
        <aside className="w-64 h-full bg-slate-100/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800/80 p-4 flex flex-col justify-between shrink-0 hidden md:flex overflow-hidden transition-colors">
          <div className="space-y-6 flex-1 flex flex-col min-h-0">
            {/* Interactive Workspace Switcher Header Card */}
            <div className="relative shrink-0" ref={desktopDropdownRef}>
              <button
                onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}
                className="w-full p-3 rounded-md bg-white dark:bg-slate-950/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between text-left transition-all group shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-200 dark:border-indigo-500/20 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {currentWs?.name || 'Workspace'}
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize block truncate">
                      {currentWs?.user_role || 'member'} Access
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${desktopDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Workspace Switcher Dropdown Menu */}
              {desktopDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                    Switch Workspace
                  </div>
                  <div className="max-h-56 overflow-y-auto px-1.5 space-y-1">
                    {workspaces.map((ws) => {
                      const isActive = currentWs && currentWs.id === ws.id
                      return (
                        <button
                          key={ws.id}
                          onClick={() => handleSelectWorkspace(ws.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs text-left transition-colors ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-200 dark:border-indigo-500/20'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate font-medium">{ws.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {ws.document_count || 0} docs • {ws.member_count || 1} members
                            </div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 mt-2 pt-2 px-1.5">
                    <button
                      onClick={() => {
                        setDesktopDropdownOpen(false)
                        setCreateModalOpen(true)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 font-medium transition-colors"
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
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-1">
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
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
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
          <div className="p-3.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-xs shrink-0 mt-4">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> RAG Multi-Tenant Active
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Workspace level hybrid search & token isolation enabled.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Bottom Bar */}
        <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-1 py-1 flex items-center justify-around shadow-lg pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 rounded-lg text-[10px] flex-1 text-center min-h-[44px] transition-all ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/80 dark:bg-indigo-950/60' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate leading-tight max-w-[56px]">{item.shortLabel}</span>
            </NavLink>
          ))}
        </nav>

        {/* Main Workspace Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 pb-16 md:pb-8 min-w-0">
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
