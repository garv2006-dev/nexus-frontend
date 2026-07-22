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
    <div className="max-w-[640px] mx-auto pt-7 px-5 pb-16 max-md:pt-5 max-md:px-4 max-md:pb-12">
      <header className="flex flex-col gap-3 mb-6">
        <Link to="/" className="inline-flex items-center gap-[0.4rem] text-text-muted-app no-underline text-[0.85rem] w-fit hover:text-text-app transition-colors">
          <ArrowLeft size={16} />
          <span>Back to chat</span>
        </Link>
        <h1 className="font-display text-[1.4rem] m-0">Settings</h1>
      </header>

      <motion.section
        className="bg-surface-app border border-border-app rounded-lg p-6 mb-5 shadow-app max-md:p-[1.1rem]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h2 className="font-display text-[1.05rem] mt-0 mx-0 mb-[0.35rem]">App profile</h2>
        <p className="text-text-muted-app text-[0.83rem] leading-relaxed mt-0 mx-0 mb-5">
          This is how you'll appear inside Nexus — separate from your account
          email and password below.
        </p>

        {loading ? (
          <p className="text-text-muted-app text-[0.83rem] leading-relaxed mt-0 mx-0 mb-5">Loading...</p>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <label className="flex flex-col gap-[0.4rem] text-[0.82rem] text-text-muted-app font-medium">
              <span>Display name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
                className="font-body text-[0.9rem] text-text-app bg-surface-alt-app border border-border-app rounded-sm px-[0.7rem] py-[0.55rem] resize-y focus:outline-none focus:border-accent-app transition-colors"
              />
            </label>

            <label className="flex flex-col gap-[0.4rem] text-[0.82rem] text-text-muted-app font-medium">
              <span>Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short line about you"
                rows={3}
                maxLength={200}
                className="font-body text-[0.9rem] text-text-app bg-surface-alt-app border border-border-app rounded-sm px-[0.7rem] py-[0.55rem] resize-y focus:outline-none focus:border-accent-app transition-colors"
              />
            </label>

            <div className="flex items-center justify-between gap-4 flex-wrap mt-[0.25rem] max-md:flex-col max-md:items-stretch">
              <span className="text-[0.78rem] text-text-muted-app font-mono">
                {profile?.credits ?? '—'} credits remaining this hour
              </span>
              <button type="submit" className="inline-flex items-center gap-[0.4rem] px-4 py-[0.55rem] rounded-sm border-none bg-accent-app text-accent-contrast-app text-[0.85rem] font-medium disabled:opacity-60 disabled:cursor-not-allowed max-md:justify-center transition-opacity" disabled={saving}>
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
        className="bg-surface-app border border-border-app rounded-lg p-6 mb-5 shadow-app max-md:p-[1.1rem]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.06 }}
      >
        <h2 className="font-display text-[1.05rem] mt-0 mx-0 mb-[0.35rem]">Account</h2>
        <p className="text-text-muted-app text-[0.83rem] leading-relaxed mt-0 mx-0 mb-5">
          Manage your email, password, avatar, and connected accounts.
        </p>
        <div className="settings-card__clerk">
          <UserProfile routing="hash" />
        </div>
      </motion.section>
    </div>
  )
}
