import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { UserProfile } from '@clerk/clerk-react'
import { useProfile } from '../hooks/useProfile'

export default function SettingsPage() {
  const { profile, loading, save } = useProfile()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await save({ name, bio })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <Link to="/" className="settings-page__back">
          <ArrowLeft size={16} />
          <span>Back to chat</span>
        </Link>
        <h1>Settings</h1>
      </header>

      <motion.section
        className="settings-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h2>App profile</h2>
        <p className="settings-card__hint">
          This is how you'll appear inside Nexus — separate from your account
          email and password below.
        </p>

        {loading ? (
          <p className="settings-card__hint">Loading...</p>
        ) : (
          <form onSubmit={handleSave} className="settings-form">
            <label>
              <span>Display name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
              />
            </label>

            <label>
              <span>Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short line about you"
                rows={3}
                maxLength={200}
              />
            </label>

            <div className="settings-form__footer">
              <span className="settings-form__credits">
                {profile?.credits ?? '—'} credits remaining this hour
              </span>
              <button type="submit" className="settings-form__save" disabled={saving}>
                {saving ? (
                  <Loader2 size={15} className="spin" />
                ) : saved ? (
                  <Check size={15} />
                ) : null}
                <span>{saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}</span>
              </button>
            </div>
          </form>
        )}
      </motion.section>

      <motion.section
        className="settings-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.06 }}
      >
        <h2>Account</h2>
        <p className="settings-card__hint">
          Manage your email, password, avatar, and connected accounts.
        </p>
        <div className="settings-card__clerk">
          <UserProfile routing="hash" />
        </div>
      </motion.section>
    </div>
  )
}
