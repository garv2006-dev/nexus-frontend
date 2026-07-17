import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function CreditsBadge({ credits }) {
  if (credits == null) return null
  const low = credits <= 10

  return (
    <motion.div
      className={`credits-badge ${low ? 'credits-badge--low' : ''}`}
      animate={low ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={low ? { duration: 1.1, repeat: Infinity, repeatDelay: 0.8 } : {}}
      title={`${credits} credits remaining this hour`}
    >
      <Zap size={12} />
      <span>{credits}</span>
    </motion.div>
  )
}
