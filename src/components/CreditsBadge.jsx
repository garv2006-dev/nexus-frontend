import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function CreditsBadge({ credits }) {
  if (credits == null) return null
  const low = credits <= 10

  return (
    <motion.div
      className={`flex items-center gap-[0.3rem] px-[0.55rem] py-[0.3rem] rounded-full font-mono text-[0.75rem] font-medium ${low ? 'bg-[#c94a3f]/12 text-danger-app' : 'bg-accent-soft-app text-accent-app'}`}
      animate={low ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={low ? { duration: 1.1, repeat: Infinity, repeatDelay: 0.8 } : {}}
      title={`${credits} credits remaining this hour`}
    >
      <Zap size={12} />
      <span>{credits}</span>
    </motion.div>
  )
}
