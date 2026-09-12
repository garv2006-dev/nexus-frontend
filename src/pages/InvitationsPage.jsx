import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, X, Layers, ArrowLeft, AlertCircle } from 'lucide-react'
import Header from '../components/Header'
import { useWorkspace } from '../context/WorkspaceContext'

export default function InvitationsPage() {
  const navigate = useNavigate()
  const { pendingInvitations, acceptInvitation, rejectInvitation } = useWorkspace()
  const [actioningId, setActioningId] = useState(null)
  const [error, setError] = useState(null)

  const handleAccept = async (id) => {
    try {
      setActioningId(id)
      setError(null)
      await acceptInvitation(id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to accept invitation')
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (id) => {
    try {
      setActioningId(id)
      setError(null)
      await rejectInvitation(id)
    } catch (err) {
      setError(err.message || 'Failed to reject invitation')
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-400" /> Workspace Invitations
          </h1>
          <p className="text-xs text-slate-400">
            Accept invitations to gain member access to workspaces shared with you.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {pendingInvitations.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No Pending Invitations</h3>
            <p className="text-xs text-slate-400">
              You do not have any pending workspace invitations right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 font-bold shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-white">
                        {inv.workspace_name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[10px] font-semibold uppercase tracking-wider">
                        Role: {inv.role || 'member'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Invited by <span className="text-slate-200">{inv.inviter_name || inv.inviter_email}</span>
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Received {new Date(inv.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <button
                    onClick={() => handleReject(inv.id)}
                    disabled={actioningId === inv.id}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(inv.id)}
                    disabled={actioningId === inv.id}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Accept Invitation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
