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
  XCircle
} from 'lucide-react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import ConfirmModal from '../components/ConfirmModal'
import { useWorkspace } from '../context/WorkspaceContext'
import { updateWorkspaceSettings, deleteWorkspace, getPaymentStatus, cancelSubscription } from '../services/api'

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

  const isOwner = activeWorkspace?.user_role === 'owner'
  const isAdminOrOwner = activeWorkspace?.user_role === 'owner' || activeWorkspace?.user_role === 'admin'
  const planType = activeWorkspace?.plan_type || 'starter'
  const planName = planType.charAt(0).toUpperCase() + planType.slice(1)
  const userRole = activeWorkspace?.user_role
    ? activeWorkspace.user_role.charAt(0).toUpperCase() + activeWorkspace.user_role.slice(1)
    : 'Member'

  const maxPages = activeWorkspace?.max_pages ?? 50
  const dailyTokenLimit = activeWorkspace?.daily_token_limit ?? 50000
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
      await fetchWorkspaces()
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
      await fetchWorkspaces()
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
      await fetchWorkspaces()
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
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" /> Workspace Settings
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage workspace name, resource quotas, and plan tier.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 shrink-0" />
            <span>Workspace settings updated successfully!</span>
          </div>
        )}

        {/* Active Subscription Summary Banner */}
        <div className="p-5 sm:p-6 rounded-lg bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ACTIVE SUBSCRIPTION SUMMARY
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {paymentDetails?.plan_name || `${planName} Plan`}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  (paymentDetails?.subscription_status || activeWorkspace?.subscription_status) === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : (paymentDetails?.subscription_status || activeWorkspace?.subscription_status) === 'canceling'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  STATUS: {(paymentDetails?.subscription_status || activeWorkspace?.subscription_status || 'active').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => navigate(`/workspace/${workspaceId}/plan`)}
                className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" /> Upgrade Plan <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {planType !== 'starter' && (paymentDetails?.subscription_status || activeWorkspace?.subscription_status) === 'active' && isOwner && (
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  disabled={canceling}
                  className="px-3.5 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all inline-flex items-center gap-2"
                >
                  {canceling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-md bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Daily Token Budget:
              </span>
              <span className="font-mono font-bold text-white">{(paymentDetails?.daily_token_limit || dailyTokenLimit).toLocaleString()}</span>
            </div>
            <div className="p-3.5 rounded-md bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Page Capacity:
              </span>
              <span className="font-mono font-bold text-white">{paymentDetails?.max_pages || maxPages} Pages</span>
            </div>
            <div className="p-3.5 rounded-md bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Member Limit:
              </span>
              <span className="font-mono font-bold text-white">{paymentDetails?.max_members || activeWorkspace?.max_members || 5} Seats</span>
            </div>
          </div>
        </div>

        {/* General Information Form */}
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-5 space-y-3.5 shadow-lg">
            <h3 className="text-xs sm:text-sm font-semibold text-white">General Information</h3>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Workspace Name
            </button>
          </div>
        </form>

        {/* Danger Zone (Owner Only) */}
        {isOwner && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5 space-y-3.5 shadow-lg">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-xs sm:text-sm">
              <ShieldAlert className="w-4 h-4" /> Danger Zone
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
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
