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
  const [openSources, setOpenSources] = useState({})
  
  // Custom Delete Modal State
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

  const toggleSourceView = (msgId) => {
    setOpenSources(prev => ({ ...prev, [msgId]: !prev[msgId] }))
  }

  return (
    <WorkspaceLayout>
      <div className="h-[calc(100vh-6.5rem)] flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left Drawer: Conversation Threads */}
        <div className="w-full md:w-64 bg-slate-900/70 border border-slate-800 rounded-lg p-3.5 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Conversations
            </span>
            <button
              onClick={handleCreateNewChat}
              className="px-2.5 py-1 rounded-md bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all text-xs flex items-center gap-1 font-medium border border-indigo-500/20"
              title="New Chat"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {conversations.map(conv => {
              const isActive = activeConvId === conv.id
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => triggerDeleteConv(conv, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
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
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col overflow-hidden shadow-xl">
          {/* Header Banner */}
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-white">
                RAG Assistant — {activeWorkspace?.name || 'Workspace'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Hybrid Search Enabled
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-4 p-3.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Execution Notice</span>
                {error}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.length === 0 && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto my-auto text-slate-400">
                <div className="w-11 h-11 rounded-md bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-white">Ask your workspace documents</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Type a question below. The system will perform hybrid vector and keyword search across your workspace's indexed PDF, DOC, and DOCX files and generate an answer with cited sources.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.role === 'user'
              const sources = Array.isArray(msg.sources) ? msg.sources : (typeof msg.sources === 'string' ? JSON.parse(msg.sources || '[]') : [])
              const showSources = openSources[msg.id]

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
                >
                  <div
                    className={`max-w-3xl rounded-md p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800/80 border border-slate-700/60 text-slate-100'
                    }`}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Citation Sources Cards for Assistant Messages */}
                  {!isUser && sources.length > 0 && (
                    <div className="max-w-3xl w-full">
                      <button
                        onClick={() => toggleSourceView(msg.id)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-slate-800/50 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Sources ({sources.length} cited)</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showSources ? 'rotate-180' : ''}`} />
                      </button>

                      {showSources && (
                        <div className="mt-2 space-y-2 animate-in fade-in duration-200">
                          {sources.map((src, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-md bg-slate-950 border border-slate-800 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between text-slate-300 font-semibold">
                                <div className="flex items-center gap-1.5 truncate">
                                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span className="truncate">{src.document_name}</span>
                                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                                    Page {src.page_number}
                                  </span>
                                </div>
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  Score: {src.score}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 italic line-clamp-2 pl-5">
                                "{src.content_snippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="flex items-center gap-3 text-xs text-indigo-400 bg-slate-950/80 border border-slate-800 p-3 rounded-md w-fit animate-pulse">
                <div className="w-4 h-4 rounded-md border-2 border-indigo-400 border-t-transparent animate-spin" />
                <span>Searching Top 5 chunks & generating response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Form */}
          <form onSubmit={handleSendQuery} className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2">
            {inputQuery.length > 4000 && (
              <div className="text-xs text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>Query exceeds maximum character limit of 4000 characters ({inputQuery.length} / 4000). Please shorten your question.</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ask a question about your workspace documents (max 4000 chars)..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  disabled={loading || !activeConvId}
                  className={`w-full px-4 py-2.5 pr-20 rounded-md bg-slate-900 border ${
                    inputQuery.length > 4000 ? 'border-red-500 text-red-200' : 'border-slate-800 text-white'
                  } placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all`}
                />
                <span
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono select-none ${
                    inputQuery.length > 4000 ? 'text-red-400 font-bold' : 'text-slate-500'
                  }`}
                >
                  {inputQuery.length}/4000
                </span>
              </div>
              <button
                type="submit"
                disabled={loading || !inputQuery.trim() || inputQuery.length > 4000 || !activeConvId}
                className="px-4 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0"
              >
                <Send className="w-4 h-4" /> Send
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
