import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Lock,
  ArrowRight,
  X,
  Layers,
  HardDrive
} from 'lucide-react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import ConfirmModal from '../components/ConfirmModal'
import { useWorkspace } from '../context/WorkspaceContext'
import {
  listWorkspaceDocuments,
  uploadWorkspaceDocuments,
  deleteWorkspaceDocument
} from '../services/api'

export default function DocumentsPage() {
  const { workspaceId } = useParams()
  const { getToken } = useAuth()
  const { activeWorkspace, fetchWorkspaces } = useWorkspace()

  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState(null)
  
  // Delete document modal state
  const [deleteModalDoc, setDeleteModalDoc] = useState(null)
  const [deletingDoc, setDeletingDoc] = useState(false)

  const fileInputRef = useRef(null)

  const userRole = activeWorkspace?.user_role || 'member'
  const canUpload = userRole === 'owner' || userRole === 'admin'
  const maxPages = activeWorkspace?.max_pages || 25

  const docCount = documents.length
  const pageCount = activeWorkspace?.page_count ?? documents.reduce((sum, d) => sum + (d.page_count || 1), 0)
  const availablePages = Math.max(0, maxPages - pageCount)

  const isPageLimitReached = availablePages <= 0
  const capacityPercent = Math.min(100, Math.round((pageCount / maxPages) * 100))

  const fetchDocs = async () => {
    if (!workspaceId) return
    try {
      setLoading(true)
      const token = await getToken()
      const list = await listWorkspaceDocuments(token, workspaceId)
      setDocuments(list || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [workspaceId])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canUpload || isPageLimitReached) return
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (!canUpload || isPageLimitReached) return
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const valid = Array.from(e.dataTransfer.files).filter(f => {
        const ext = f.name.split('.').pop().toLowerCase()
        return ['pdf', 'doc', 'docx'].includes(ext)
      })
      setSelectedFiles(prev => [...prev, ...valid])
    }
  }

  const handleFileChange = (e) => {
    if (!canUpload || isPageLimitReached) return
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])
    }
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || uploading || !canUpload) return
    try {
      setUploading(true)
      setError(null)
      const token = await getToken()
      await uploadWorkspaceDocuments(token, workspaceId, selectedFiles)
      setSelectedFiles([])
      await fetchDocs()
      await fetchWorkspaces()
    } catch (err) {
      setError(err.message || 'Upload and indexing failed')
    } finally {
      setUploading(false)
    }
  }

  const confirmDeleteDocument = async () => {
    if (!deleteModalDoc) return
    try {
      setDeletingDoc(true)
      const token = await getToken()
      await deleteWorkspaceDocument(token, workspaceId, deleteModalDoc.id)
      setDeleteModalDoc(null)
      await fetchDocs()
      await fetchWorkspaces()
    } catch (err) {
      setError(err.message || 'Failed to delete document')
    } finally {
      setDeletingDoc(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'indexed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Indexed
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> {status}
          </span>
        )
    }
  }

  return (
    <WorkspaceLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Page Capacity Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" /> Documents & Vector Index
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Default Plan: <strong>25 Pages Max Capacity</strong> (No document count limit. Only Owners & Admins can add documents).
            </p>
          </div>

          {/* Available Page Space Card */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 space-y-2 w-full md:w-80 shadow-md">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> Page Capacity
              </span>
              <span className="font-mono text-white font-bold">{pageCount} / {maxPages} Used</span>
            </div>

            <div className="w-full bg-slate-950 rounded-md h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${capacityPercent >= 100 ? 'bg-red-500' : capacityPercent >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${capacityPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] pt-0.5">
              <span className="text-slate-400">Available Space:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[10px] ${
                availablePages > 0 ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {availablePages} {availablePages === 1 ? 'Page Space' : 'Pages Space'} Available
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Limit Warning Banner */}
        {isPageLimitReached && canUpload && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="block text-white">Workspace Page Capacity Reached ({pageCount}/{maxPages} Pages)</strong>
                <span>0 Pages space available on your current plan. Upgrade workspace plan to add more pages.</span>
              </div>
            </div>
            <Link
              to={`/workspace/${workspaceId}/plan`}
              className="px-3.5 py-2 rounded-md bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors inline-flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4" /> Upgrade Plan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Non-Admin/Owner Upload Restricted Notice */}
        {!canUpload ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6 text-center space-y-3 shadow-lg">
            <div className="w-11 h-11 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Document Uploads Restricted</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Only Workspace <strong>Owners</strong> and <strong>Admins</strong> are permitted to add or upload documents (Default plan: 25 total pages max).
            </p>
          </div>
        ) : (
          /* Multi-File Upload Drag & Drop Dropzone */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-7 text-center transition-all ${
              isPageLimitReached
                ? 'opacity-60 border-slate-800 bg-slate-950 cursor-not-allowed'
                : dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              disabled={isPageLimitReached}
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-11 h-11 rounded-md bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-semibold text-white">
              {isPageLimitReached
                ? '0 Pages Space Available (Upgrade Required)'
                : 'Drag & Drop PDF, DOC, or DOCX files here'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {isPageLimitReached
                ? `Limit of ${maxPages} total pages reached. Upgrade workspace plan to process more pages.`
                : `Available space: ${availablePages} pages. Uploaded documents exceeding ${availablePages} pages will be rejected.`}
            </p>

            {!isPageLimitReached && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors inline-flex items-center gap-2"
              >
                Browse Files
              </button>
            )}
          </div>
        )}

        {/* Selected Files Queue */}
        {selectedFiles.length > 0 && (
          <div className="rounded-lg bg-slate-900 border border-slate-800 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Selected Files for Processing ({selectedFiles.length})
              </span>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading}
                className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Extracting Pages & Storing Vectors...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Start Ingestion Pipeline
                  </>
                )}
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-md p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-slate-200 font-medium truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    onClick={() => removeSelectedFile(idx)}
                    disabled={uploading}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indexed Documents Table */}
        <div className="rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-semibold text-white">Indexed Documents ({docCount})</h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {pageCount}/{maxPages} Total Pages Used ({availablePages} Available)
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No documents uploaded yet in this workspace. Upload PDF/DOC files to start vector indexing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-5">Document Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Pages Extracted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-5 font-medium text-white flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-xs">{doc.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {doc.file_type}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-300 font-mono">
                        {doc.page_count || 1} {doc.page_count === 1 ? 'page' : 'pages'}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canUpload && (
                          <button
                            onClick={() => setDeleteModalDoc(doc)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Document Custom Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalDoc)}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteModalDoc?.name}"? All associated ${deleteModalDoc?.page_count || 1} pages of vector chunks will be removed, freeing up ${deleteModalDoc?.page_count || 1} pages of space.`}
        confirmText="Delete Document"
        variant="danger"
        loading={deletingDoc}
        onConfirm={confirmDeleteDocument}
        onCancel={() => setDeleteModalDoc(null)}
      />
    </WorkspaceLayout>
  )
}
