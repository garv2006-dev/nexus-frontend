import { SignUp } from '@clerk/clerk-react'
import { motion } from 'framer-motion'

export default function SignUpPage() {
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
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" afterSignUpUrl="/" />
      </motion.div>
    </div>
  )
}
