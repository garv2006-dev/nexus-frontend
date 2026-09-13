import React, { useState } from 'react'

/**
 * Custom User Avatar Component
 * 
 * Renders the user's uploaded avatar image if available.
 * If the user has no uploaded image (or if the image fails to load),
 * renders a circular avatar displaying the user's first letter on an indigo gradient.
 */
export default function UserAvatar({ user, size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false)

  // Size mapping for styling
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs font-semibold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-20 h-20 text-2xl font-bold',
  }[size] || 'w-8 h-8 text-xs font-semibold'

  // Extract initial letter from user's first name, last name, or email address
  const initial = (
    user?.firstName?.[0] ||
    user?.lastName?.[0] ||
    user?.primaryEmailAddress?.emailAddress?.[0] ||
    'U'
  ).toUpperCase()

  // Use uploaded image if user has image and hasn't errored
  const hasUploadedCustomImage = user?.hasImage && user?.imageUrl && !imgError

  if (hasUploadedCustomImage) {
    return (
      <img
        src={user.imageUrl}
        alt={user?.fullName || 'User Avatar'}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover ring-2 ring-indigo-500/30 shadow-sm shrink-0 ${className}`}
      />
    )
  }

  // Fallback to circular initial avatar
  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md ring-2 ring-indigo-500/30 shrink-0 select-none ${className}`}
    >
      {initial}
    </div>
  )
}
