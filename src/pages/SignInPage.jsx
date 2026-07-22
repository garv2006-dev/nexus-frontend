import { SignIn } from '@clerk/clerk-react'
import { motion } from 'framer-motion'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app p-6">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-[0.55rem] font-display">
          <span className="w-[34px] h-[34px] grid place-items-center rounded-[8px] bg-gradient-to-br from-accent-app to-[#b7a9ff] text-white font-bold text-[1.05rem]">N</span>
          <span className="font-semibold text-[1.3rem] tracking-tight">Nexus</span>
        </div>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/" />
      </motion.div>
    </div>
  )
}
