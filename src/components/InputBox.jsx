import { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function InputBox({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e) => {
    setValue(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  return (
    <div className="flex items-end gap-2 max-w-[780px] w-full mx-auto mt-3 mb-5 pl-4 pr-[0.6rem] py-2 bg-surface-app border border-border-app rounded-lg shadow-app">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Message Nexus..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none border-none bg-transparent text-text-app text-[0.9rem] leading-relaxed max-h-[200px] py-[0.35rem] px-0 focus:outline-none placeholder-text-muted-app"
      />
      <button
        type="button"
        className="shrink-0 w-[34px] h-[34px] rounded-[10px] border-none bg-accent-app text-accent-contrast-app grid place-items-center transition-opacity duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  )
}
