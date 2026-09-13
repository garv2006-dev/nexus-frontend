import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ShoppingCart } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

export default function OutOfCreditsBanner({ detail }) {
  const navigate = useNavigate()
  const { workspaceId } = useParams()
  const resetAt = detail?.credits_reset_at ? new Date(detail.credits_reset_at) : null

  return (
    <AnimatePresence>
      {detail && (
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-[780px] w-[calc(100%-2.5rem)] mx-auto mt-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs overflow-hidden shadow-lg"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>
              {detail.message || "You're out of daily workspace credits for now."}
              {resetAt &&
                ` Resets around ${resetAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}.`}
            </span>
          </div>

          {workspaceId && (
            <button
              onClick={() => navigate(`/workspace/${workspaceId}/plan`)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-[11px] shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Upgrade to Pro Plan ($29)
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
