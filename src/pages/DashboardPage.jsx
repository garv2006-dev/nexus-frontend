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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Multi-User RAG Workspaces
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Welcome back to Nexus RAG
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Manage your document knowledge bases, collaborate with workspace members, perform hybrid vector search, and query Gemini LLM securely.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none hidden md:block" />
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pending Invitations Alert Section */}
        {pendingInvitations.length > 0 && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Bell className="w-4 h-4 animate-bounce" />
                Pending Workspace Invitations ({pendingInvitations.length})
              </div>
              <Link to="/invitations" className="text-xs text-amber-400 hover:underline font-medium">
                View All
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="truncate">
                    <div className="text-sm font-semibold text-white truncate flex items-center gap-2">
                      <span>{inv.workspace_name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold uppercase">
                        {inv.role || 'member'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      Invited by {inv.inviter_name || inv.inviter_email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(inv.id)}
                      disabled={actioningInv === inv.id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(inv.id)}
                      disabled={actioningInv === inv.id}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
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
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">My Workspaces</h2>
            <p className="text-xs text-slate-400">Select a workspace to open chat, manage documents, or adjust settings</p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Workspace
          </button>
        </div>

        {/* Workspaces Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">No Workspaces Available</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first workspace to start uploading documents and querying Gemini LLM with RAG.
              </p>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Workspace
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="group rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 p-5 shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20 font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                      {ws.user_role || 'member'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Created {new Date(ws.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{ws.document_count || 0} Documents</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-violet-400" />
                      <span>{ws.member_count || 1} Members</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5">
                  <button
                    onClick={() => {
                      switchWorkspace(ws.id)
                      navigate(`/workspace/${ws.id}/chat`)
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-600/20"
                  >
                    Open Workspace <ArrowRight className="w-4 h-4" />
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
