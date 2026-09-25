import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Layers,
  Plus,
  FileText,
  Users,
  ArrowRight,
  Bell,
  Check,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import Header from '../components/Header'
import { useWorkspace } from '../context/WorkspaceContext'
import CreateWorkspaceModal from '../components/CreateWorkspaceModal'

export default function DashboardPage() {
  const navigate = useNavigate()
  const {
    workspaces,
    pendingInvitations,
    loading,
    switchWorkspace,
    acceptInvitation,
    rejectInvitation
  } = useWorkspace()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [actioningInv, setActioningInv] = useState(null)
  const [error, setError] = useState(null)

  const handleAccept = async (invId) => {
    try {
      setActioningInv(invId)
      setError(null)
      await acceptInvitation(invId)
    } catch (err) {
      setError(err.message || 'Failed to accept invitation')
    } finally {
      setActioningInv(null)
    }
  }

  const handleReject = async (invId) => {
    try {
      setActioningInv(invId)
      setError(null)
      await rejectInvitation(invId)
    } catch (err) {
      setError(err.message || 'Failed to reject invitation')
    } finally {
      setActioningInv(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 dark:from-indigo-950 dark:via-slate-900 dark:to-slate-900 border border-indigo-500/20 p-5 sm:p-7 shadow-xl text-white">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 dark:bg-indigo-500/10 border border-white/20 dark:border-indigo-500/20 text-indigo-100 dark:text-indigo-300 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Multi-User RAG Workspaces
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Welcome back to Nexus RAG
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 dark:text-slate-300 leading-relaxed">
              Manage your document knowledge bases, collaborate with workspace members, perform hybrid vector search, and query Gemini LLM securely.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 dark:from-indigo-500/10 to-transparent pointer-events-none hidden md:block" />
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pending Invitations Alert Section */}
        {pendingInvitations.length > 0 && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs sm:text-sm">
                <Bell className="w-4 h-4 animate-bounce shrink-0" />
                <span>Pending Invitations ({pendingInvitations.length})</span>
              </div>
              <Link to="/invitations" className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold">
                View All
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="truncate w-full sm:w-auto">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                      <span className="truncate">{inv.workspace_name}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-semibold uppercase shrink-0">
                        {inv.role || 'member'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Invited by {inv.inviter_name || inv.inviter_email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleAccept(inv.id)}
                      disabled={actioningInv === inv.id}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 min-h-[36px]"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(inv.id)}
                      disabled={actioningInv === inv.id}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors min-h-[36px] flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workspaces Grid Header */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">My Workspaces</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Select a workspace to open chat or manage docs</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-3 sm:px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1 shrink-0 min-h-[38px]"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Create Workspace</span><span className="sm:hidden">Create</span>
          </button>
        </div>

        {/* Workspaces Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 sm:p-10 text-center space-y-4">
            <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Workspaces Available</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Create your first workspace to start uploading documents and querying Gemini LLM with RAG.
              </p>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="group rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 p-4 sm:p-5 shadow-sm dark:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20 font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      {ws.user_role || 'member'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {ws.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Created {new Date(ws.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{ws.document_count || 0} Docs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      <span>{ws.member_count || 1} Members</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      switchWorkspace(ws.id)
                      navigate(`/workspace/${ws.id}/chat`)
                    }}
                    className="w-full py-2.5 px-3.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 min-h-[40px] group-hover:shadow-md group-hover:shadow-indigo-600/20"
                  >
                    Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateWorkspaceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  )
}
