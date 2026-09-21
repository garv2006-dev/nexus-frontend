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
      <div className="w-full max-w-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 relative space-y-3.5 text-slate-900 dark:text-slate-100">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-md flex items-center justify-center border font-bold ${
            variant === "danger"
              ? "bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400"
              : "bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
          }`}>
            {variant === "danger" ? <Trash2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Confirmation required</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3.5 py-2 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold text-white shadow-md transition-all flex items-center gap-1.5 ${buttonColors}`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
