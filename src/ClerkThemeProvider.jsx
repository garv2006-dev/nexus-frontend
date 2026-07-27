import { useEffect } from 'react'
import { ClerkProvider } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { useTheme } from './context/ThemeContext'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const CLERK_JS_URL =
  import.meta.env.VITE_CLERK_JS_URL ||
  'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js'

/**
 * Thin wrapper so Clerk's own UI (SignIn, SignUp, UserButton, UserProfile)
 * follows the app's light/dark toggle instead of only respecting the OS.
 */
export default function ClerkThemeProvider({ children }) {
  const { theme } = useTheme()

  // Forcefully remove the "Development mode" badge since Clerk uses dynamic classes
  useEffect(() => {
    const hideBadge = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false)
      let node
      while ((node = walker.nextNode())) {
        if (node.nodeValue && node.nodeValue.trim() === 'Development mode') {
          let parent = node.parentElement
          if (parent) {
            parent.style.display = 'none'
            if (parent.parentElement && typeof parent.parentElement.className === 'string' && parent.parentElement.className.includes('cl-internal')) {
              parent.parentElement.style.display = 'none'
            }
          }
        }
      }
    }

    const observer = new MutationObserver(() => {
      hideBadge()
    })
    
    observer.observe(document.body, { childList: true, subtree: true })
    
    // Initial check
    hideBadge()
    
    return () => observer.disconnect()
  }, [])

  if (!PUBLISHABLE_KEY) {
    throw new Error(
      'Missing VITE_CLERK_PUBLISHABLE_KEY — copy frontend/.env.example to frontend/.env and fill it in.'
    )
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      clerkJSUrl={CLERK_JS_URL}
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
