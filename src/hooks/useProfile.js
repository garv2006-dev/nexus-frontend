import { useCallback, useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import * as api from '../services/api'

export function useProfile() {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = await getToken()
    const data = await api.getProfile(token)
    setProfile(data)
    return data
  }, [getToken])

  useEffect(() => {
    if (!isSignedIn || !user) return

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const token = await getToken()
        // Clerk's session token doesn't carry email/name by default, so we
        // push the display info we already have client-side once per login.
        await api.syncProfile(token, {
          email: user.primaryEmailAddress?.emailAddress || '',
          name: user.fullName || user.username || 'New user',
          avatarUrl: user.imageUrl,
        })
        const data = await api.getProfile(token)
        if (!cancelled) setProfile(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user?.id])

  const save = useCallback(
    async ({ name, bio, avatarUrl }) => {
      const token = await getToken()
      const data = await api.updateProfile(token, { name, bio, avatarUrl })
      setProfile(data)
      return data
    },
    [getToken]
  )

  const setCredits = useCallback((credits) => {
    setProfile((p) => (p ? { ...p, credits } : p))
  }, [])

  return { profile, loading, refresh, save, setCredits }
}
