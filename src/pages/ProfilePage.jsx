import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  User,
  Mail,
  Camera,
  Save,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  ShieldCheck
} from 'lucide-react'
import Header from '../components/Header'
import WorkspaceLayout from '../components/WorkspaceLayout'
import UserAvatar from '../components/UserAvatar'

export function ProfileContent() {
  const navigate = useNavigate()
  const { user } = useUser()
  const fileInputRef = useRef(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
    }
  }, [user])

  if (!user) return null

  const userEmail = user.primaryEmailAddress?.emailAddress || 'No email address'
  const userFullName = user.fullName || `${firstName} ${lastName}`.trim() || 'User Profile'

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB.')
      return
    }

    setErrorMsg(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      // 1. Update Name via Clerk API
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      // 2. Update Profile Image via Clerk API if selected
      if (selectedFile) {
        await user.setProfileImage({ file: selectedFile })
        setSelectedFile(null)
        setPreviewUrl(null)
      }

      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      console.error('Failed to update profile:', err)
      setErrorMsg(err?.errors?.[0]?.longMessage || err.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" /> Personal Profile
        </h1>
        <p className="text-xs text-slate-400">
          Manage your account profile details, name, and display picture.
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Banner */}
      {successMsg && (
        <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Avatar & Summary Card */}
      <div className="rounded-lg bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover ring-2 ring-indigo-500 shadow-xl"
            />
          ) : (
            <UserAvatar user={user} size="xl" className="shadow-xl" />
          )}
          <div className="absolute inset-0 bg-slate-950/60 rounded-full flex flex-col items-center justify-center text-white opacity-90 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-indigo-300" />
            <span className="text-[10px] font-medium mt-0.5">Change</span>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              {userFullName}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Authenticated User
            </span>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400">
            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{userEmail}</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            Click your avatar image above to upload a new profile picture.
          </p>
        </div>
      </div>

      {/* Profile Details Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="rounded-lg bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-lg">
          <h3 className="text-xs sm:text-sm font-semibold text-white">General Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-3.5 py-2.5 rounded-md bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-3.5 py-2.5 rounded-md bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full px-3.5 py-2.5 rounded-md bg-slate-950/60 border border-slate-800/60 text-slate-400 text-xs cursor-not-allowed select-none opacity-70 font-medium"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Your email address is managed by your authentication provider and cannot be changed here.
            </p>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !firstName.trim()}
            className="px-4 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Profile</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ProfilePage() {
  const { workspaceId } = useParams()

  if (workspaceId) {
    return (
      <WorkspaceLayout>
        <ProfileContent />
      </WorkspaceLayout>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <ProfileContent />
      </main>
    </div>
  )
}
