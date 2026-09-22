import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Trash2,
  AlertCircle,
  X,
  Mail,
  ShieldAlert,
  Loader2,
  Check,
  Clock
} from 'lucide-react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import ConfirmModal from '../components/ConfirmModal'
import { useWorkspace } from '../context/WorkspaceContext'
import {
  listWorkspaceMembers,
  inviteWorkspaceMember,
  removeWorkspaceMember,
  listWorkspaceInvitations,
  cancelWorkspaceInvitation,
  syncProfile
} from '../services/api'

export default function MembersPage() {
  const { workspaceId } = useParams()
  const { getToken } = useAuth()
  const { user: currentUser } = useUser()
  const { activeWorkspace, fetchWorkspaces } = useWorkspace()

  const [members, setMembers] = useState([])
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [revokingId, setRevokingId] = useState(null)
  const [error, setError] = useState(null)
  const [modalError, setModalError] = useState(null)
  const [successBanner, setSuccessBanner] = useState(null)

  // Custom remove member modal state
  const [removeModalMember, setRemoveModalMember] = useState(null)
  const [removingMember, setRemovingMember] = useState(false)

  const fetchData = async (silent = false) => {
    if (!workspaceId) return
    try {
      if (!silent) {
        setLoading(true)
      }
      const token = await getToken()
      if (currentUser) {
        syncProfile(token, {
          email: currentUser.primaryEmailAddress?.emailAddress || '',
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          name: currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || '',
          avatarUrl: currentUser.imageUrl || '',
        }).catch(() => {})
      }
      const [membersList, invList] = await Promise.all([
        listWorkspaceMembers(token, workspaceId),
        listWorkspaceInvitations(token, workspaceId).catch(() => [])
      ])
      setMembers(membersList || [])
      setPendingInvitations(invList || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load workspace members and invitations')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [workspaceId])

  const maxMembers = activeWorkspace?.max_members || 3
  const currentCount = members.length
  const isLimitReached = currentCount >= maxMembers
  const isOwner = activeWorkspace?.user_role === 'owner' || activeWorkspace?.owner_id === currentUser?.id

  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim() || inviting) return

    if (isLimitReached) {
      setModalError('Workspace member limit reached.')
      return
    }

    const emailToSend = inviteEmail.trim()
    const roleToSend = inviteRole

    try {
      setInviting(true)
      setModalError(null)
      const token = await getToken()
      const currentUserName = currentUser?.fullName || [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || ''
      const newInv = await inviteWorkspaceMember(token, workspaceId, emailToSend, roleToSend, currentUserName)

      if (newInv && newInv.id) {
        setPendingInvitations(prev => [newInv, ...prev.filter(i => i.id !== newInv.id)])
      }

      setSuccessBanner(`Invitation sent to ${emailToSend} with role '${roleToSend}'`)
      setTimeout(() => setSuccessBanner(null), 4000)
      setInviteEmail('')
      setInviteRole('member')
      setInviteModalOpen(false)
      
      // Silent background fetch to ensure full sync with DB
      fetchData(true)
    } catch (err) {
      setModalError(err.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvitation = async (invitationId) => {
    try {
      setRevokingId(invitationId)
      // Optimistic state update
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      const token = await getToken()
      await cancelWorkspaceInvitation(token, workspaceId, invitationId)
      setSuccessBanner('Invitation cancelled successfully')
      setTimeout(() => setSuccessBanner(null), 4000)
      fetchData(true)
    } catch (err) {
      setError(err.message || 'Failed to revoke invitation')
      fetchData(true)
    } finally {
      setRevokingId(null)
    }
  }

  const confirmRemoveMember = async () => {
    if (!removeModalMember) return
    const targetUserId = removeModalMember.user_id
    try {
      setRemovingMember(true)
      // Optimistic state update
      setMembers(prev => prev.filter(m => m.user_id !== targetUserId))
      const token = await getToken()
      await removeWorkspaceMember(token, workspaceId, targetUserId)
      setRemoveModalMember(null)
      fetchData(true)
      fetchWorkspaces(true)
    } catch (err) {
      setError(err.message || 'Failed to remove member')
      fetchData(true)
    } finally {
      setRemovingMember(false)
    }
  }

  const renderRoleBadge = (role) => {
    const r = (role || 'member').toLowerCase()
    if (r === 'owner') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1">
          <Crown className="w-3 h-3" /> Owner
        </span>
      )
    }
    if (r === 'admin') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[10px] font-semibold flex items-center gap-1">
          <Shield className="w-3 h-3" /> Admin
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold flex items-center gap-1">
        <User className="w-3 h-3 text-slate-400 dark:text-slate-400" /> Member
      </span>
    )
  }

  return (
    <WorkspaceLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" /> Workspace Members
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage member roles, view active members, and track pending invitations.
            </p>
          </div>

          <button
            onClick={() => {
              setModalError(null)
              setInviteModalOpen(true)
            }}
            disabled={!isOwner}
            className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successBanner && (
          <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Member Capacity Progress Meter */}
        <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">Member Capacity</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {currentCount} / {maxMembers} Members
            </span>
          </div>
          <div className="w-full h-2 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-md ${
                isLimitReached ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, (currentCount / maxMembers) * 100)}%` }}
            />
          </div>
          {isLimitReached && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Workspace member limit reached. Update capacity in workspace settings to invite more.
            </div>
          )}
        </div>

        {/* Active Members List Table */}
        <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-lg">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Active Members</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{members.length} Active</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" /> Loading members...
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {members.map((m) => {
                const isMemberOwner = m.role === 'owner'
                const isSelf = m.user_id === currentUser?.id
                const memberFirstName = m.first_name || (isSelf ? currentUser?.firstName : '') || ''
                const memberLastName = m.last_name || (isSelf ? currentUser?.lastName : '') || ''
                const memberFullName =
                  [memberFirstName, memberLastName].filter(Boolean).join(' ') ||
                  (isSelf ? currentUser?.fullName : '') ||
                  (m.name && !m.name.toLowerCase().startsWith('user user_') ? m.name : '') ||
                  (m.email ? m.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Workspace User')

                const avatarSrc = m.avatar_url || (isSelf ? currentUser?.imageUrl : null)
                const initialLetter = (
                  memberFirstName[0] ||
                  memberLastName[0] ||
                  memberFullName[0] ||
                  m.email?.[0] ||
                  'U'
                ).toUpperCase()

                return (
                  <div
                    key={m.id}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={memberFullName}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {initialLetter}
                        </div>
                      )}
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                          <span>{memberFullName}</span>
                          {renderRoleBadge(m.role)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{m.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-slate-500 hidden sm:inline-block">
                        Joined {new Date(m.joined_at).toLocaleDateString()}
                      </span>
                      {isOwner && !isMemberOwner && (
                        <button
                          onClick={() => setRemoveModalMember(m)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pending Workspace Invitations Section */}
        <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm dark:shadow-lg">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Pending Invitations Sent</h3>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{pendingInvitations.length} Pending</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" /> Loading invitations...
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs italic">
              No pending invitations sent for this workspace.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {pendingInvitations.map((inv) => {
                const isInvitedBySelf = inv.invited_by === currentUser?.id || inv.inviter_email === currentUser?.primaryEmailAddress?.emailAddress
                const inviterFullName =
                  [inv.inviter_first_name, inv.inviter_last_name].filter(Boolean).join(' ') ||
                  (isInvitedBySelf ? (currentUser?.fullName || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()) : '') ||
                  (inv.inviter_name && !inv.inviter_name.toLowerCase().startsWith('user user_') ? inv.inviter_name : '') ||
                  (inv.inviter_email ? inv.inviter_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Workspace Admin')

                return (
                  <div
                    key={inv.id}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                          <span>{inv.email}</span>
                          {renderRoleBadge(inv.role)}
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-[10px] font-medium">
                            Pending
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Invited by {inviterFullName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[10px] text-slate-500 hidden sm:inline-block">
                        Sent {new Date(inv.created_at).toLocaleDateString()}
                      </span>
                      {isOwner && (
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          disabled={revokingId === inv.id}
                          className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium transition-colors"
                          title="Revoke Invitation"
                        >
                          {revokingId === inv.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invite Member Modal with Role Selection */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 relative space-y-4 shadow-xl">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-violet-50 dark:bg-violet-600/20 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-200 dark:border-violet-500/30">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Invite Member</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Send workspace access invite with custom role</p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Invite Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="member">Member (Standard Access)</option>
                  <option value="admin">Admin (Manage Documents & Settings)</option>
                  <option value="owner">Owner (Full Control)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-3.5 py-2 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-3.5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Custom Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(removeModalMember)}
        title="Remove Workspace Member"
        message={`Are you sure you want to remove ${removeModalMember?.name || removeModalMember?.email || 'this member'} from this workspace? They will lose access immediately.`}
        confirmText="Remove Member"
        variant="danger"
        loading={removingMember}
        onConfirm={confirmRemoveMember}
        onCancel={() => setRemoveModalMember(null)}
      />
    </WorkspaceLayout>
  )
}
