import { useUser, useAuth } from '@clerk/clerk-react'
import { X, Camera, User, Mail, Edit3, Check, Loader2, AlertCircle } from 'lucide-react'
import UserAvatar from './UserAvatar'
import { updateProfile } from '../services/api'

export default function ProfileModal({ isOpen, onClose }) {
  const { user } = useUser()
  const { getToken } = useAuth()
  const fileInputRef = useRef(null)

  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Sync state with Clerk user when modal opens or user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setErrorMsg('')
    setSuccessMsg('')
    setIsEditing(false)
  }, [user, isOpen])

  if (!isOpen || !user) return null

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

    setErrorMsg('')
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // 1. Update Name via Clerk User API
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      let finalAvatarUrl = user.imageUrl
      // 2. Update Profile Image via Clerk User API if new image selected
      if (selectedFile) {
        const imageRes = await user.setProfileImage({ file: selectedFile })
        finalAvatarUrl = imageRes?.publicUrl || user.imageUrl
      }

      // 3. Sync to backend database
      try {
        const token = await getToken()
        await updateProfile(token, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          avatarUrl: finalAvatarUrl,
        })
      } catch (backendErr) {
        console.warn('Backend profile sync warning:', backendErr)
      }

      setSuccessMsg('Profile updated successfully!')
      setTimeout(() => {
        setSuccessMsg('')
        setIsEditing(false)
      }, 1200)
    } catch (err) {
      console.error('Failed to update profile:', err)
      setErrorMsg(err?.errors?.[0]?.longMessage || err.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setSelectedFile(null)
    setPreviewUrl(null)
    setErrorMsg('')
    setSuccessMsg('')
    setIsEditing(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Modal Card Container */}
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Profile
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close Profile Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isEditing ? (
            /* VIEW MODE */
            <div className="flex flex-col items-center text-center py-2 space-y-5">
              {/* Profile Avatar */}
              <div className="relative group">
                <UserAvatar user={user} size="xl" className="shadow-xl" />
              </div>

              {/* Full Name & Email */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {userFullName}
                </h3>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{userEmail}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSave} className="space-y-5">
              {/* Interactive Avatar Upload */}
              <div className="flex flex-col items-center space-y-2">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Click photo to update avatar</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Email (Read-Only) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 text-xs cursor-not-allowed select-none opacity-75"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Email address cannot be modified here.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
