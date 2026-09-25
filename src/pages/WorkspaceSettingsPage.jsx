import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  Settings,
  Save,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Users,
  Zap,
  ShieldAlert,
  Loader2,
  Check,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
  Crown,
  CheckCircle2,
  Layers,
  HardDrive,
  XCircle,
  Calendar,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import ConfirmModal from '../components/ConfirmModal'
import { useWorkspace } from '../context/WorkspaceContext'
import { updateWorkspaceSettings, deleteWorkspace, getPaymentStatus, cancelSubscription } from '../services/api'

function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { activeWorkspace, fetchWorkspaces } = useWorkspace()

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [paymentDetails, setPaymentDetails] = useState(null)
  const [canceling, setCanceling] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  // Transaction history pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  const paymentHistory = paymentDetails?.payment_history || []
  const totalPages = Math.ceil(paymentHistory.length / ITEMS_PER_PAGE) || 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentTransactions = paymentHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const isOwner = activeWorkspace?.user_role === 'owner'
  const isAdminOrOwner = activeWorkspace?.user_role === 'owner' || activeWorkspace?.user_role === 'admin'
  const planType = paymentDetails?.plan_type || activeWorkspace?.plan_type || 'starter'
  const planName = paymentDetails?.plan_name || (planType.charAt(0).toUpperCase() + planType.slice(1) + ' Plan')
  const userRole = activeWorkspace?.user_role
    ? activeWorkspace.user_role.charAt(0).toUpperCase() + activeWorkspace.user_role.slice(1)
    : 'Member'

  const maxPages = paymentDetails?.max_pages ?? activeWorkspace?.max_pages ?? 25
  const dailyTokenLimit = paymentDetails?.daily_token_limit ?? activeWorkspace?.daily_token_limit ?? 25000
  const pageCount = activeWorkspace?.page_count ?? 0
  const availablePages = Math.max(0, maxPages - pageCount)

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name || '')
    }
  }, [activeWorkspace])

  // Load active subscription status details
  useEffect(() => {
    let isMounted = true
    async function loadStatus() {
      try {
        const token = await getToken()
        const res = await getPaymentStatus(token, workspaceId)
        if (isMounted && res?.data) {
          setPaymentDetails(res.data)
        }
      } catch (err) {
        console.error('Failed to load workspace subscription status:', err)
      }
    }
    if (workspaceId) {
      setPaymentDetails(null)
      setCurrentPage(1)
      loadStatus()
    }
    return () => {
      isMounted = false
    }
  }, [workspaceId])

  // Redirect non-owners/non-admins away from Settings page
  useEffect(() => {
    if (activeWorkspace && activeWorkspace.user_role !== 'owner' && activeWorkspace.user_role !== 'admin') {
      navigate(`/workspace/${workspaceId}/chat`, { replace: true })
    }
  }, [activeWorkspace, workspaceId, navigate])

  const handleCancelSubscription = async () => {
    if (!isAdminOrOwner || canceling) return
    try {
      setCanceling(true)
      setError(null)
      const token = await getToken()
      await cancelSubscription(token, workspaceId)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)

      const res = await getPaymentStatus(token, workspaceId)
      if (res?.data) setPaymentDetails(res.data)
      await fetchWorkspaces(true)
    } catch (err) {
      if (!err.message?.includes('No active Stripe subscription found')) {
        setError(err.message || 'Failed to cancel subscription.')
      }
    } finally {
      setCanceling(false)
      setCancelModalOpen(false)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (!name.trim() || saving || !isAdminOrOwner) return

    try {
      setSaving(true)
      setError(null)
      setSavedSuccess(false)
      const token = await getToken()
      await updateWorkspaceSettings(token, workspaceId, {
        name: name.trim()
      })
      await fetchWorkspaces(true)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update workspace settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!isOwner || deleting) return
    try {
      setDeleting(true)
      setError(null)
      const token = await getToken()
      await deleteWorkspace(token, workspaceId)
      await fetchWorkspaces(true)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Failed to delete workspace')
      setDeleteModalOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (!isAdminOrOwner) {
    return null
  }

  return (
    <WorkspaceLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Workspace Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage workspace name, resource quotas, and plan tier.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 shrink-0" />
            <span>Workspace settings updated successfully!</span>
          </div>
        )}

        {/* Active Subscription Summary Banner */}
        <div className="p-4 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                ACTIVE SUBSCRIPTION FOR: <span className="text-slate-900 dark:text-white font-extrabold">{activeWorkspace?.name}</span>
              </span>
              <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {paymentDetails?.plan_name || `${planName} Plan`}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${(paymentDetails?.subscription_status || activeWorkspace?.subscription_status) === 'active'
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : (paymentDetails?.subscription_status || activeWorkspace?.subscription_status) === 'canceling'
                      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                  STATUS: {(paymentDetails?.subscription_status || activeWorkspace?.subscription_status || 'active').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate(`/workspace/${workspaceId}/plan`)}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center justify-center gap-1.5 flex-1 sm:flex-initial min-h-[38px]"
              >
                <Sparkles className="w-4 h-4" /> Manage Plan & Billing <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {planType !== 'starter' && (paymentDetails?.subscription_status || activeWorkspace?.subscription_status) === 'active' && isOwner && (
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  disabled={canceling}
                  className="px-3.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all inline-flex items-center justify-center gap-2 min-h-[38px]"
                >
                  {canceling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Start Date:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white block text-xs truncate">
                {formatDate(paymentDetails?.purchased_at) ||
                 formatDate(paymentHistory.find(p => p.payment_status === 'succeeded')?.completed_at) ||
                 formatDate(paymentHistory.find(p => p.payment_status === 'succeeded')?.created_at) ||
                 formatDate(activeWorkspace?.created_at) ||
                 'Free Tier'}
              </span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Renewal Date:
              </span>
              <span className={`font-mono font-bold block text-xs truncate ${(paymentDetails?.subscription_status || activeWorkspace?.subscription_status) === 'canceling' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {planType === 'starter'
                  ? 'No Expiration'
                  : formatDate(paymentDetails?.current_period_end || activeWorkspace?.current_period_end) || '30 Days'}
              </span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" /> Daily Tokens:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white block text-xs font-mono">{(paymentDetails?.daily_token_limit || dailyTokenLimit).toLocaleString()}</span>
            </div>

            <div className="p-3 sm:p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/60 space-y-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Page Limit:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white block text-xs font-mono">{paymentDetails?.max_pages || maxPages} Pages</span>
            </div>
          </div>
        </div>

        {/* General Information Form */}
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-3 shadow-sm dark:shadow-lg">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">General Information</h3>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 min-h-[40px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Workspace Name
            </button>
          </div>
        </form>

        {/* Payment & Transaction History Table with Pagination */}
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Payment & Transaction History
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Past subscription payments and invoice receipts logged for {activeWorkspace?.name || 'this workspace'}.
              </p>
            </div>
            {paymentHistory.length > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold self-start sm:self-auto border border-slate-200 dark:border-slate-700">
                {paymentHistory.length} Total {paymentHistory.length === 1 ? 'Transaction' : 'Transactions'}
              </span>
            )}
          </div>

          {paymentHistory.length > 0 ? (
            <div className="space-y-4">
              {/* Mobile Card List View (< sm screens) */}
              <div className="block sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {currentTransactions.map((tx) => (
                  <div key={tx.id} className="py-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                      <span>{(tx.plan_id ? tx.plan_id.charAt(0).toUpperCase() + tx.plan_id.slice(1) : 'Pro')} Plan</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">${((tx.amount || 0) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                      <span>{formatDate(tx.completed_at || tx.created_at)}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        tx.payment_status === 'succeeded'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                      }`}>
                        {tx.payment_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= sm screens) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider bg-slate-50/50 dark:bg-slate-950/40">
                      <th className="py-2.5 px-3">Date Paid</th>
                      <th className="py-2.5 px-3">Plan Tier</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Payment Status</th>
                      <th className="py-2.5 px-3">Subscription Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {currentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-900 dark:text-slate-200">
                          {formatDate(tx.completed_at || tx.created_at)}
                        </td>
                        <td className="py-3 px-3 text-slate-900 dark:text-white capitalize font-semibold">
                          {(tx.plan_id ? tx.plan_id.charAt(0).toUpperCase() + tx.plan_id.slice(1) : 'Pro')} Plan
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-900 dark:text-slate-200">
                          ${((tx.amount || 0) / 100).toFixed(2)} {(tx.currency || 'usd').toUpperCase()}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            tx.payment_status === 'succeeded'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                          }`}>
                            {tx.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {tx.subscription_status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Clean Pagination Controls Bar */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] text-center sm:text-left">
                    Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {Math.min(startIndex + ITEMS_PER_PAGE, paymentHistory.length)}
                    </span>{' '}
                    of <span className="font-semibold text-slate-900 dark:text-white">{paymentHistory.length}</span> transactions
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 transition-all text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 min-h-[32px]"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          type="button"
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all flex items-center justify-center ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-300 transition-all text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700 min-h-[32px]"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
              <span>No payment transactions logged for <strong>{activeWorkspace?.name || 'this workspace'}</strong> yet.</span>
            </div>
          )}
        </div>

        {/* Danger Zone (Owner Only) */}
        {isOwner && (
          <div className="rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-5 space-y-3.5 shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs sm:text-sm">
              <ShieldAlert className="w-4 h-4" /> Danger Zone
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Deleting this workspace will permanently erase all associated documents, vector embeddings, chunk indices, conversation history, and usage statistics. This action cannot be undone.
            </p>
            <div>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="px-3.5 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Cancel Subscription Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        title="Cancel Active Subscription"
        message="Are you sure you want to cancel your subscription? Your workspace plan access will remain active until the end of the current billing period."
        confirmText="Cancel Subscription"
        cancelText="Keep Subscription"
        variant="danger"
        loading={canceling}
        onConfirm={handleCancelSubscription}
        onCancel={() => setCancelModalOpen(false)}
      />

      {/* Custom Delete Workspace Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Workspace"
        message={`Are you sure you want to delete "${activeWorkspace?.name}"? All vector database records, documents, embeddings, and chat histories will be deleted immediately.`}
        confirmText="Delete Permanently"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteWorkspace}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </WorkspaceLayout>
  )
}
