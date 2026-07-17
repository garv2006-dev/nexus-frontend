import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import * as api from '../services/api'

export function useChat({ onCreditsChange } = {}) {
  const { getToken, isSignedIn } = useAuth()
  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [outOfCredits, setOutOfCredits] = useState(null)

  const refreshSessions = useCallback(async () => {
    const token = await getToken()
    const data = await api.listSessions(token)
    setSessions(data)
    return data
  }, [getToken])

  const selectSession = useCallback(
    async (id) => {
      setLoading(true)
      setActiveId(id)
      try {
        const token = await getToken()
        const detail = await api.getSession(token, id)
        setMessages(detail.messages)
      } finally {
        setLoading(false)
      }
    },
    [getToken]
  )

  useEffect(() => {
    if (!isSignedIn) return
    ;(async () => {
      setLoading(true)
      const data = await refreshSessions().catch(() => [])
      if (data.length > 0) {
        await selectSession(data[0].id)
      } else {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn])

  const newChat = useCallback(async () => {
    const token = await getToken()
    const session = await api.createSession(token)
    setSessions((s) => [session, ...s])
    setActiveId(session.id)
    setMessages([])
    return session
  }, [getToken])

  const removeSession = useCallback(
    async (id) => {
      const token = await getToken()
      await api.deleteSession(token, id)
      setSessions((s) => s.filter((sess) => sess.id !== id))
      if (id === activeId) {
        setActiveId(null)
        setMessages([])
      }
    },
    [activeId, getToken]
  )

  const sendMessage = useCallback(
    async (content) => {
      setOutOfCredits(null)

      let sessionId = activeId
      if (!sessionId) {
        const session = await newChat()
        sessionId = session.id
      }

      setMessages((m) => [
        ...m,
        { id: `local-user-${Date.now()}`, role: 'user', content },
        { id: 'streaming', role: 'assistant', content: '' },
      ])
      setIsStreaming(true)

      const token = await getToken()

      await api.streamMessage(token, sessionId, content, {
        onChunk: (chunk) => {
          setMessages((m) => {
            const copy = [...m]
            const last = copy[copy.length - 1]
            copy[copy.length - 1] = { ...last, content: last.content + chunk }
            return copy
          })
        },
        onDone: (payload) => {
          setIsStreaming(false)
          refreshSessions()
          if (typeof payload?.credits === 'number') onCreditsChange?.(payload.credits)
        },
        onOutOfCredits: (detail) => {
          setIsStreaming(false)
          setOutOfCredits(detail || { message: "You're out of credits for now." })
          // Drop the empty placeholder assistant bubble we optimistically added.
          setMessages((m) => m.slice(0, -1))
        },
        onError: (err) => {
          setIsStreaming(false)
          setMessages((m) => {
            const copy = [...m]
            const last = copy[copy.length - 1]
            copy[copy.length - 1] = {
              ...last,
              content: last.content || `Something went wrong: ${err.message}`,
              error: true,
            }
            return copy
          })
        },
      })
    },
    [activeId, newChat, refreshSessions, getToken, onCreditsChange]
  )

  return {
    sessions,
    activeId,
    messages,
    isStreaming,
    loading,
    outOfCredits,
    selectSession,
    newChat,
    removeSession,
    sendMessage,
  }
}
