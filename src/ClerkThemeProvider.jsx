import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { useTheme } from './context/ThemeContext'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

/**
 * Thin wrapper so Clerk's own UI (SignIn, SignUp, UserButton, UserProfile)
 * follows the app's light/dark toggle instead of only respecting the OS.
 */
export default function ClerkThemeProvider({ children }) {
  const { theme } = useTheme()

  if (!PUBLISHABLE_KEY) {
    throw new Error(
      'Missing VITE_CLERK_PUBLISHABLE_KEY — copy frontend/.env.example to frontend/.env and fill it in.'
    )
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/sign-in"
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: { colorPrimary: '#5b4fe8' },
      }}
    >
      {children}
    </ClerkProvider>
  )
}
