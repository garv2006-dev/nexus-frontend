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
      className={`message ${isUser ? 'message--user' : 'message--assistant'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="message__avatar" aria-hidden="true">
        {isUser ? <User size={15} /> : <Sparkles size={15} />}
      </div>
      <div className={`message__bubble ${error ? 'message__bubble--error' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              if (inline) {
                return (
                  <code className="inline-code" {...props}>
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
        {streaming && <span className="message__cursor" aria-hidden="true">▍</span>}
      </div>
    </motion.div>
  )
}
