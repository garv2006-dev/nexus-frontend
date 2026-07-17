import { useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import Message from './Message'
import InputBox from './InputBox'

export default function ChatWindow({ messages, isStreaming, onSend, inputDisabled }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-window">
      <div className="chat-window__messages">
        {messages.length === 0 && (
          <div className="chat-window__empty">
            <Sparkles size={26} />
            <h2>Start a conversation</h2>
            <p>Ask a question, brainstorm an idea, or paste some code to review.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <Message
            key={m.id}
            role={m.role}
            content={m.content}
            error={m.error}
            streaming={isStreaming && i === messages.length - 1 && m.role === 'assistant'}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <InputBox onSend={onSend} disabled={isStreaming || inputDisabled} />
    </div>
  )
}
