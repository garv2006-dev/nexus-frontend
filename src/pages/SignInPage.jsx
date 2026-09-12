import React from 'react'
import { SignIn } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2.5 font-sans">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            Nexus <span className="text-indigo-400 font-normal">RAG</span>
          </span>
        </div>

        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/signup"
          fallbackRedirectUrl="/dashboard"
        />
      </motion.div>
    </div>
  )
}
