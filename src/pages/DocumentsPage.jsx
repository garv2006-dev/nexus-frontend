import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  X
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const valid = Array.from(e.dataTransfer.files).filter(f => {
        const ext = f.name.split('.').pop().toLowerCase()
        return ['pdf', 'doc', 'docx'].includes(ext)
      })
      setSelectedFiles(prev => [...prev, ...valid])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])
    }
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0 || uploading) return
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Indexed
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> {status}
          </span>
        )
    }
  }

  return (
    <WorkspaceLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" /> Documents Management
          </h1>
          <p className="text-xs text-slate-400">
            Upload PDF, DOC, or DOCX documents to populate your workspace vector index.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Multi-File Upload Drag & Drop Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-semibold text-white">
            Drag & Drop PDF, DOC, or DOCX files here
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Supports multiple document uploads at once (Max 15MB per file)
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors inline-flex items-center gap-2"
          >
            Browse Files
          </button>
        </div>

        {/* Selected Files Queue */}
        {selectedFiles.length > 0 && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">
                Selected Files for Processing ({selectedFiles.length})
              </span>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Chunking & Indexing...
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
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
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
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Workspace Documents</h3>
            <span className="text-xs text-slate-400">{documents.length} Total Documents</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No documents uploaded yet in this workspace.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-6">Document Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Chunks</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-white flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-xs">{doc.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {doc.file_type}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3.5 px-4 font-medium text-indigo-300">
                        {doc.chunk_count || 0} chunks
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteModalDoc(doc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        message={`Are you sure you want to delete "${deleteModalDoc?.name}"? All associated document chunks and vector embeddings will be permanently removed.`}
        confirmText="Delete Document"
        variant="danger"
        loading={deletingDoc}
        onConfirm={confirmDeleteDocument}
        onCancel={() => setDeleteModalDoc(null)}
      />
    </WorkspaceLayout>
  )
}
