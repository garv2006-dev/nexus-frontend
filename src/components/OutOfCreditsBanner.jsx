import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export default function OutOfCreditsBanner({ detail }) {
  const resetAt = detail?.credits_reset_at ? new Date(detail.credits_reset_at) : null

  return (
    <AnimatePresence>
      {detail && (
        <motion.div
          className="flex items-center gap-2 max-w-[780px] w-[calc(100%-2.5rem)] mx-auto mt-3 px-[0.85rem] py-[0.55rem] rounded-md bg-[#c94a3f]/10 text-danger-app text-[0.82rem] overflow-hidden"
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
