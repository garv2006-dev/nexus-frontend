import { SignIn } from '@clerk/clerk-react'
import { motion } from 'framer-motion'

export default function SignInPage() {
  return (
    <div className="auth-screen">
      <motion.div
        className="auth-screen__inner"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="auth-screen__brand">
          <span className="header__mark">N</span>
          <span className="header__name">Nexus</span>
        </div>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/" />
      </motion.div>
    </div>
  )
}
