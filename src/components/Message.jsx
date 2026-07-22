import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Sparkles, User } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Message({ role, content, error, streaming }) {
  const { theme } = useTheme()
  const isUser = role === 'user'

  return (
    <motion.div
      className={`flex gap-[0.6rem] items-start ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className={`w-[26px] h-[26px] rounded-[8px] shrink-0 grid place-items-center mt-[2px] ${isUser ? 'bg-surface-alt-app text-text-muted-app' : 'bg-accent-soft-app text-accent-app'}`} aria-hidden="true">
        {isUser ? <User size={15} /> : <Sparkles size={15} />}
      </div>
      <div className={`max-w-[78%] max-md:max-w-[88%] px-[0.9rem] py-[0.65rem] rounded-lg text-[0.9rem] leading-relaxed shadow-app ${isUser ? 'bg-user-bubble-bg-app text-user-bubble-text-app rounded-br-[4px]' : 'bg-assistant-bubble-bg-app border border-assistant-bubble-border-app rounded-bl-[4px]'} ${error ? 'border-danger-app text-danger-app' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              if (inline) {
                return (
                  <code className={`font-mono px-[0.35rem] py-[0.1rem] rounded-[5px] text-[0.83em] ${isUser ? 'bg-white/14' : 'bg-surface-alt-app'}`} {...props}>
                    {children}
                  </code>
                )
              }
              return (
                <SyntaxHighlighter
                  style={theme === 'dark' ? oneDark : oneLight}
                  language={match ? match[1] : 'text'}
                  PreTag="div"
                  customStyle={{
                    margin: '0.6rem 0',
                    borderRadius: '10px',
                    fontSize: '0.83rem',
                    lineHeight: 1.5,
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
            },
          }}
        >
          {content || ' '}
        </ReactMarkdown>
        {streaming && <span className="inline-block text-accent-app font-mono message__cursor" aria-hidden="true">▍</span>}
      </div>
    </motion.div>
  )
}
