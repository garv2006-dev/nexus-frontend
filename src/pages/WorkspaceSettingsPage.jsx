import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Check
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
  const [maxMembers, setMaxMembers] = useState(5)
  const [dailyTokenLimit, setDailyTokenLimit] = useState(100000)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name || '')
      setMaxMembers(activeWorkspace.max_members || 5)
      setDailyTokenLimit(activeWorkspace.daily_token_limit || 100000)
    }
  }, [activeWorkspace])

  const isOwner = activeWorkspace?.user_role === 'owner'

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (!name.trim() || saving || !isOwner) return

    try {
      setSaving(true)
      setError(null)
      setSavedSuccess(false)
      const token = await getToken()
      await updateWorkspaceSettings(token, workspaceId, {
        name: name.trim(),
        max_members: Number(maxMembers),
        daily_token_limit: Number(dailyTokenLimit)
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

  return (
    <WorkspaceLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-400" /> Workspace Settings
          </h1>
          <p className="text-xs text-slate-400">
            Configure administrative preferences, member limits, and daily token budgets.
          </p>
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

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* General Section */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-white">General Information</h3>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                required
                disabled={!isOwner}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Members Capacity Configuration */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Member Limits</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Maximum Members
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                disabled={!isOwner}
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                Maximum allowed collaborators in this workspace.
              </span>
            </div>
          </div>

          {/* Daily Token Limit Configuration */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Token Budget Configuration</h3>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Daily Workspace Token Limit
              </label>
              <input
                type="number"
                min="1000"
                step="5000"
                required
                disabled={!isOwner}
                value={dailyTokenLimit}
                onChange={(e) => setDailyTokenLimit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                Total combined LLM token budget permitted per calendar day for this workspace.
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </form>

        {/* Danger Zone */}
        {isOwner && (
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
        )}
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
