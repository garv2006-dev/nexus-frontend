import React from 'react'
import { NavLink, useParams, Navigate } from 'react-router-dom'
import {
  MessageSquare,
  FileText,
  Users,
  PieChart,
  Settings,
  Layers,
  Sparkles
} from 'lucide-react'
import Header from './Header'
import { useWorkspace } from '../context/WorkspaceContext'

export default function WorkspaceLayout({ children }) {
  const { workspaceId } = useParams()
  const { activeWorkspace, switchWorkspace, workspaces, loading } = useWorkspace()

  // Ensure workspace context matches route param workspaceId
  React.useEffect(() => {
    if (workspaceId && (!activeWorkspace || activeWorkspace.id !== workspaceId)) {
      switchWorkspace(workspaceId)
    }
  }, [workspaceId, activeWorkspace, switchWorkspace])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400">Loading Workspace...</p>
        </div>
      </div>
    )
  }

  const currentWs = activeWorkspace || workspaces.find(w => w.id === workspaceId)
  if (!currentWs && workspaces.length > 0) {
    return <Navigate to={`/workspace/${workspaces[0].id}/chat`} replace />
  }

  const navItems = [
    { label: 'Chat', icon: MessageSquare, path: `/workspace/${workspaceId}/chat` },
    { label: 'Documents', icon: FileText, path: `/workspace/${workspaceId}/documents` },
    { label: 'Members', icon: Users, path: `/workspace/${workspaceId}/members` },
    { label: 'Usage', icon: PieChart, path: `/workspace/${workspaceId}/usage` },
    { label: 'Settings', icon: Settings, path: `/workspace/${workspaceId}/settings` },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div className="space-y-6">
            {/* Workspace Header Info */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h3 className="text-xs font-semibold text-white truncate">
                    {currentWs?.name || 'Workspace'}
                  </h3>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {currentWs?.user_role || 'member'} access
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                Menu
              </div>
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
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

          {/* Footer badge */}
          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5" /> RAG Multi-Tenant Active
            </div>
            <p className="text-[11px] text-slate-400">
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
                `flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Main Workspace Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}
