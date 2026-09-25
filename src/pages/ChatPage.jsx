import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Send,
  Plus,
  MessageSquare,
  FileText,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  Trash2,
  BookOpen,
  Info
} from 'lucide-react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import ConfirmModal from '../components/ConfirmModal'
import { useWorkspace } from '../context/WorkspaceContext'
import {
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  sendChatQuery
} from '../services/api'

export default function ChatPage() {
  const { workspaceId } = useParams()
  const { getToken } = useAuth()
  const { activeWorkspace } = useWorkspace()

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputQuery, setInputQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleteModalConv, setDeleteModalConv] = useState(null)
  const [deletingConv, setDeletingConv] = useState(false)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Load conversations list for workspace
  const fetchConvs = async () => {
    if (!workspaceId) return
    try {
      const token = await getToken()
      const list = await listConversations(token, workspaceId)
      setConversations(list || [])

      if (list && list.length > 0) {
        if (!activeConvId || !list.some(c => c.id === activeConvId)) {
          setActiveConvId(list[0].id)
        }
      } else {
        // Auto-create initial conversation if none exist
        const newConv = await createConversation(token, workspaceId, 'General Chat')
        setConversations([newConv])
        setActiveConvId(newConv.id)
      }
    } catch (err) {
      console.error('Failed to list conversations:', err)
    }
  }

  useEffect(() => {
    fetchConvs()
  }, [workspaceId])

  // Load messages for active conversation
  useEffect(() => {
    if (!workspaceId || !activeConvId) {
      setMessages([])
      return
    }
    const loadConvDetail = async () => {
      try {
        const token = await getToken()
        const detail = await getConversation(token, workspaceId, activeConvId)
        setMessages(detail.messages || [])
        setError(null)
      } catch (err) {
        console.error('Failed to load conversation messages:', err)
      }
    }
    loadConvDetail()
  }, [workspaceId, activeConvId])

  const handleCreateNewChat = async () => {
    try {
      const token = await getToken()
      const newConv = await createConversation(token, workspaceId, `Chat ${conversations.length + 1}`)
      setConversations([newConv, ...conversations])
      setActiveConvId(newConv.id)
      setMessages([])
    } catch (err) {
      setError(err.message || 'Failed to create chat')
    }
  }

  const triggerDeleteConv = (conv, e) => {
    e.stopPropagation()
    setDeleteModalConv(conv)
  }

  const confirmDeleteConv = async () => {
    if (!deleteModalConv) return
    try {
      setDeletingConv(true)
      const token = await getToken()
      await deleteConversation(token, workspaceId, deleteModalConv.id)
      const updated = conversations.filter(c => c.id !== deleteModalConv.id)
      setConversations(updated)
      if (activeConvId === deleteModalConv.id) {
        setActiveConvId(updated.length > 0 ? updated[0].id : null)
      }
      setDeleteModalConv(null)
    } catch (err) {
      setError(err.message || 'Failed to delete conversation')
    } finally {
      setDeletingConv(false)
    }
  }

  const handleSendQuery = async (e) => {
    e.preventDefault()
    const query = inputQuery.trim()
    if (!query || loading || !activeConvId) return

    if (query.length > 4000) {
      setError(`Query exceeds character limit of 4000 characters (${query.length} / 4000). Please shorten your question.`)
      return
    }

    setInputQuery('')
    setError(null)

    // Add optimistic user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMsg])
    setLoading(true)

    try {
      const token = await getToken()
      const result = await sendChatQuery(token, workspaceId, activeConvId, query)

      setMessages(prev => [
        ...prev,
        {
          id: result.message_id,
          role: 'assistant',
          content: result.content,
          sources: result.sources || [],
          created_at: new Date().toISOString()
        }
      ])
    } catch (err) {
      setError(err.message || 'Failed to generate response')
    } finally {
      setLoading(false)
    }
  }

  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false)

  return (
    <WorkspaceLayout>
      <div className="h-[calc(100dvh-8rem)] md:h-[calc(100vh-6.5rem)] flex flex-col md:flex-row gap-3 sm:gap-4 overflow-hidden min-h-0">
        
        {/* Mobile Header Threads Bar & Drawer */}
        <div className="md:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex flex-col shrink-0 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileThreadsOpen(!mobileThreadsOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 min-h-[36px]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="truncate max-w-[160px]">
                {conversations.find(c => c.id === activeConvId)?.title || 'Threads'}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                {conversations.length}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${mobileThreadsOpen ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={handleCreateNewChat}
              className="px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs flex items-center gap-1 font-semibold shadow-sm min-h-[36px]"
              title="New Chat"
            >
              <Plus className="w-3.5 h-3.5" /> New Chat
            </button>
          </div>

          {/* Expandable Mobile Threads List Sheet */}
          {mobileThreadsOpen && (
            <div className="max-h-48 overflow-y-auto space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
              {conversations.map(conv => {
                const isActive = activeConvId === conv.id
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id)
                      setMobileThreadsOpen(false)
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-all ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span className="truncate">{conv.title}</span>
                    </div>
                    <button
                      onClick={(e) => triggerDeleteConv(conv, e)}
                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Desktop Sidebar: Conversation Threads */}
        <div className="hidden md:flex w-64 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex-col shrink-0 shadow-sm">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Conversations ({conversations.length})
            </span>
            <button
              onClick={handleCreateNewChat}
              className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white transition-all text-xs flex items-center gap-1 font-medium border border-indigo-200 dark:border-indigo-500/20"
              title="New Chat"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
            {conversations.map(conv => {
              const isActive = activeConvId === conv.id
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`group flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer text-xs transition-all ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => triggerDeleteConv(conv, e)}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-opacity shrink-0"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Main Chat Window */}
        <div className="flex-1 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col overflow-hidden shadow-sm dark:shadow-xl min-w-0 min-h-0">
          {/* Header Banner */}
          <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                RAG Assistant — {activeWorkspace?.name || 'Workspace'}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">Hybrid Search Enabled</span>
              <span className="sm:hidden">Hybrid RAG</span>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-3 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold block">Execution Notice</span>
                {error}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50/40 dark:bg-transparent min-h-0">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-4 max-w-md mx-auto my-auto text-slate-500 dark:text-slate-400">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Ask your workspace documents</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Type a question below to query your workspace's indexed PDF, DOC, and DOCX files.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'user'

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-3xl rounded-xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-sm break-words overflow-hidden ${isUser
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/70 text-slate-800 dark:text-slate-100 rounded-bl-none'
                      }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex items-center gap-2.5 text-xs text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 rounded-lg w-fit shadow-sm animate-pulse max-w-full">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin shrink-0" />
                <span className="truncate">Searching chunks & generating response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Form */}
          <form onSubmit={handleSendQuery} className="p-2.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 space-y-2 shrink-0">
            {inputQuery.length > 4000 && (
              <div className="text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                <span>Query exceeds limit ({inputQuery.length} / 4000). Please shorten.</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={loading || !activeConvId}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border ${inputQuery.length > 4000 ? 'border-red-500 text-red-600 dark:text-red-200' : 'border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                    } placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all min-h-[40px] sm:min-h-[44px]`}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !inputQuery.trim() || inputQuery.length > 4000 || !activeConvId}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 shrink-0 min-h-[40px] sm:min-h-[44px]"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Custom Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalConv)}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${deleteModalConv?.title || 'this conversation'}"? All chat message history will be permanently deleted.`}
        confirmText="Delete"
        variant="danger"
        loading={deletingConv}
        onConfirm={confirmDeleteConv}
        onCancel={() => setDeleteModalConv(null)}
      />
    </WorkspaceLayout>
  )
}
