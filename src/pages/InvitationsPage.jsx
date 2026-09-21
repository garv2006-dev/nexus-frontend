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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Workspace Invitations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Accept invitations to gain member access to workspaces shared with you.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {pendingInvitations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-10 text-center space-y-3 shadow-sm">
            <div className="w-11 h-11 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">No Pending Invitations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You do not have any pending workspace invitations right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {pendingInvitations.map((inv) => {
              const rawInviterName = [inv.inviter_first_name, inv.inviter_last_name].filter(Boolean).join(' ') || inv.inviter_name || ''
              const inviterDisplayName =
                rawInviterName.includes(' ') && !rawInviterName.toLowerCase().startsWith('user user_')
                  ? rawInviterName
                  : (rawInviterName.toLowerCase().includes('garvvariya') || (inv.inviter_email && inv.inviter_email.toLowerCase().includes('garvvariya'))
                      ? 'Garv Variya'
                      : (rawInviterName || (inv.inviter_email ? inv.inviter_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Workspace Admin')))

              return (
                <div
                  key={inv.id}
                  className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:shadow-lg"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30 font-bold shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {inv.workspace_name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-semibold uppercase tracking-wider">
                          Role: {inv.role || 'member'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Invited by <span className="text-slate-800 dark:text-slate-200 font-medium">{inviterDisplayName}</span>
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Received {new Date(inv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleReject(inv.id)}
                    disabled={actioningId === inv.id}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAccept(inv.id)}
                    disabled={actioningId === inv.id}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Accept Invitation
                  </button>
                </div>
              </div>
            )
          })}
          </div>
        )}
      </main>
    </div>
  )
}
