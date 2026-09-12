import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  Settings,
  Save,
  Trash2,
  AlertTriangle,
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
  HardDrive
} from 'lucide-react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import ConfirmModal from '../components/ConfirmModal'
import { useWorkspace } from '../context/WorkspaceContext'
import { updateWorkspaceSettings, deleteWorkspace } from '../services/api'

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

  const isOwner = activeWorkspace?.user_role === 'owner'
  const planType = activeWorkspace?.plan_type || 'starter'
  const planName = planType.charAt(0).toUpperCase() + planType.slice(1)
  const userRole = activeWorkspace?.user_role
    ? activeWorkspace.user_role.charAt(0).toUpperCase() + activeWorkspace.user_role.slice(1)
    : 'Owner'

  const maxPages = activeWorkspace?.max_pages ?? 50
  const dailyTokenLimit = activeWorkspace?.daily_token_limit ?? 50000
  const pageCount = activeWorkspace?.page_count ?? 0
  const availablePages = Math.max(0, maxPages - pageCount)

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name || '')
    }
  }, [activeWorkspace])

  // Redirect non-owners away from Settings page
  useEffect(() => {
    if (activeWorkspace && activeWorkspace.user_role !== 'owner') {
      navigate(`/workspace/${workspaceId}/chat`, { replace: true })
    }
  }, [activeWorkspace, workspaceId, navigate])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (!name.trim() || saving || !isOwner) return

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

  if (!isOwner) {
    return null
  }

  return (
    <WorkspaceLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-400" /> Workspace Settings
            </h1>
            <p className="text-xs text-slate-400">
              Manage workspace name, resource quotas, and plan tier (Owner Only).
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 shrink-0" />
            <span>Workspace settings updated successfully!</span>
          </div>
        )}

        {/* Resource Quotas Banner matching screenshot */}
        <div className="rounded-3xl bg-[#0b0f19] border border-slate-800/90 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left Column: Plan Pill + Workspace Resource Quotas Title + Subtitle */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 text-xs font-semibold shadow-sm">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Active Plan: {planName}
                </span>
                <span className="text-slate-300 text-xs font-semibold">
                  (Role: <strong className="text-white">{userRole}</strong>)
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  <span className="text-white">{activeWorkspace?.name || 'Workspace'}</span> Resource Quotas
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed max-w-2xl">
                  Page Limit: <strong className="text-slate-200">{maxPages} Pages Total</strong>. Currently using <strong className="text-slate-200">{pageCount} pages</strong> ({availablePages} pages space available). Daily token budget is <strong className="text-slate-200">{dailyTokenLimit.toLocaleString()} tokens/day</strong>.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => navigate(`/workspace/${workspaceId}/plan`)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Upgrade Plan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Column: Quota Stats Box */}
            <div className="bg-[#070a12] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-inner flex items-center justify-around gap-6 sm:gap-8 shrink-0">
              <div className="text-center space-y-1">
                <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  DAILY TOKENS
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight">
                  {dailyTokenLimit.toLocaleString()}
                </span>
              </div>

              <div className="h-10 w-px bg-slate-800/80"></div>

              <div className="text-center space-y-1">
                <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  PAGE CAPACITY
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  {pageCount} / {maxPages} Used
                </span>
              </div>

              <div className="h-10 w-px bg-slate-800/80"></div>

              <div className="text-center space-y-1">
                <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  AVAILABLE SPACE
                </span>
                <span className="text-xl sm:text-2xl font-black text-indigo-400 font-mono tracking-tight">
                  {availablePages} Pages
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* General Information Form */}
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-white">General Information</h3>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Workspace Name
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <ShieldAlert className="w-5 h-5" /> Danger Zone
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Deleting this workspace will permanently erase all associated documents, vector embeddings, chunk indices, conversation history, and usage statistics. This action cannot be undone.
          </p>
          <div>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/20 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Workspace
            </button>
          </div>
        </div>
      </div>

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
