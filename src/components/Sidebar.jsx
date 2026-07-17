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
    <aside className={`sidebar ${className}`}>
      <button type="button" className="sidebar__new" onClick={onNew}>
        <Plus size={16} />
        <span>New chat</span>
      </button>

      <div className="sidebar__list">
        {sessions.length === 0 && (
          <p className="sidebar__empty">Your conversations will show up here.</p>
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
              className={`sidebar__item ${s.id === activeId ? 'sidebar__item--active' : ''}`}
              onClick={() => onSelect(s.id)}
            >
              <MessageSquare size={14} className="sidebar__item-icon" />
              <span className="sidebar__item-title">{s.title}</span>
              <button
                type="button"
                className="sidebar__item-delete"
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
