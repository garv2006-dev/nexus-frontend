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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-2 flex flex-col gap-[1.1rem] max-w-[780px] w-full mx-auto">
        {messages.length === 0 && (
          <div className="m-auto text-center text-text-muted-app max-w-[320px] flex flex-col items-center gap-2">
            <Sparkles size={26} className="text-accent-app mb-1" />
            <h2 className="font-display text-[1.05rem] m-0 text-text-app">Start a conversation</h2>
            <p className="m-0 text-[0.85rem] leading-relaxed">Ask a question, brainstorm an idea, or paste some code to review.</p>
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
