import React from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "indigo"
  onConfirm,
  onCancel,
  loading = false
}) {
  if (!isOpen) return null

  const buttonColors = variant === "danger"
    ? "bg-red-600 hover:bg-red-500 shadow-red-600/20"
    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 relative space-y-4 text-slate-100">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${
            variant === "danger"
              ? "bg-red-500/15 border-red-500/30 text-red-400"
              : "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
          }`}>
            {variant === "danger" ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-slate-400">Confirmation required</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all flex items-center gap-1.5 ${buttonColors}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
