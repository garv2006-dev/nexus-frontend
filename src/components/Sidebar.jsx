import { AnimatePresence, motion } from 'framer-motion'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'

export default function Sidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  className = '',
}) {
  return (
    <aside className={`bg-surface-alt-app border-r border-border-app flex flex-col p-4 gap-3 overflow-hidden max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:right-[25%] max-md:z-20 max-md:-translate-x-full max-md:transition-transform max-md:duration-200 max-md:shadow-app ${className}`}>
      <button type="button" className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-border-app bg-surface-app text-text-app text-sm font-medium hover:border-accent-app hover:text-accent-app transition-colors" onClick={onNew}>
        <Plus size={16} />
        <span>New chat</span>
      </button>

      <div className="flex flex-col gap-[0.15rem] overflow-y-auto flex-1">
        {sessions.length === 0 && (
          <p className="text-text-muted-app text-[0.8rem] p-2 leading-relaxed">Your conversations will show up here.</p>
        )}
        <AnimatePresence initial={false}>
          {sessions.map((s) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8, height: 0 }}
              transition={{ duration: 0.18 }}
              className={`group flex items-center gap-2 px-2.5 py-[0.55rem] rounded-sm text-text-muted-app text-[0.83rem] relative cursor-pointer border-l-2 hover:bg-surface-app hover:text-text-app transition-colors ${s.id === activeId ? 'bg-surface-app text-text-app border-accent-app' : 'border-transparent'}`}
              onClick={() => onSelect(s.id)}
            >
              <MessageSquare size={14} className="shrink-0 opacity-70" />
              <span className="flex-1 truncate">{s.title}</span>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 bg-none border-none text-text-muted-app p-[0.2rem] rounded-[6px] shrink-0 hover:text-danger-app hover:bg-surface-alt-app transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(s.id)
                }}
                aria-label={`Delete "${s.title}"`}
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </aside>
  )
}
