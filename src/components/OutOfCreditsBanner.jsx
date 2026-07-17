import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export default function OutOfCreditsBanner({ detail }) {
  const resetAt = detail?.credits_reset_at ? new Date(detail.credits_reset_at) : null

  return (
    <AnimatePresence>
      {detail && (
        <motion.div
          className="credits-banner"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AlertCircle size={15} />
          <span>
            {detail.message || "You're out of credits for now."}
            {resetAt &&
              ` Resets around ${resetAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}.`}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
