import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import {
  listWorkspaces,
  createWorkspace as apiCreateWorkspace,
  listPendingInvitations,
  acceptInvitation as apiAcceptInvitation,
  rejectInvitation as apiRejectInvitation,
  setCurrentUserEmail
} from '../services/api'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()

  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspace, setActiveWorkspace] = useState(null)
  const [pendingInvitations, setPendingInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const userId = user?.id || ''
  const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || ''

  // Sync user email globally to API service headers
  useEffect(() => {
    if (isSignedIn && userEmail) {
      setCurrentUserEmail(userEmail)
    } else {
      setCurrentUserEmail('')
    }
  }, [isSignedIn, userEmail])

  const fetchWorkspaces = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setWorkspaces([])
      setActiveWorkspace(null)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const token = await getToken()
      const list = await listWorkspaces(token)
      const workspaceList = list || []
      setWorkspaces(workspaceList)

      // Persist / recover active workspace choice (scoped by userId)
      const storageKey = `active_workspace_${userId}`
      const savedWsId = localStorage.getItem(storageKey)
      if (savedWsId && workspaceList.some(w => w.id === savedWsId)) {
        setActiveWorkspace(workspaceList.find(w => w.id === savedWsId))
      } else if (workspaceList.length > 0) {
        setActiveWorkspace(workspaceList[0])
        localStorage.setItem(storageKey, workspaceList[0].id)
      } else {
        setActiveWorkspace(null)
      }
      setError(null)
    } catch (err) {
      console.error('Failed to fetch workspaces:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isSignedIn, userId, getToken])

  const fetchInvitations = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setPendingInvitations([])
      return
    }
    try {
      const token = await getToken()
      const invs = await listPendingInvitations(token)
      setPendingInvitations(invs || [])
    } catch (err) {
      console.error('Failed to fetch invitations:', err)
    }
  }, [isSignedIn, userId, getToken])

  useEffect(() => {
    if (isSignedIn && userId) {
      fetchWorkspaces()
      fetchInvitations()
    } else {
      setWorkspaces([])
      setActiveWorkspace(null)
      setPendingInvitations([])
      setLoading(false)
    }
  }, [isSignedIn, userId, fetchWorkspaces, fetchInvitations])

  const switchWorkspace = (workspaceId) => {
    const ws = workspaces.find(w => w.id === workspaceId)
    if (ws) {
      setActiveWorkspace(ws)
      if (userId) {
        localStorage.setItem(`active_workspace_${userId}`, ws.id)
      }
    }
  }

  const handleCreateWorkspace = async (name) => {
    const token = await getToken()
    const newWs = await apiCreateWorkspace(token, name)
    await fetchWorkspaces()
    if (newWs && newWs.id) {
      switchWorkspace(newWs.id)
    }
    return newWs
  }

  const handleAcceptInvitation = async (invitationId) => {
    const token = await getToken()
    const res = await apiAcceptInvitation(token, invitationId)
    await fetchInvitations()
    await fetchWorkspaces()
    if (res.workspace_id) {
      switchWorkspace(res.workspace_id)
    }
  }

  const handleRejectInvitation = async (invitationId) => {
    const token = await getToken()
    await apiRejectInvitation(token, invitationId)
    await fetchInvitations()
  }

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        pendingInvitations,
        loading,
        error,
        fetchWorkspaces,
        fetchInvitations,
        switchWorkspace,
        createWorkspace: handleCreateWorkspace,
        acceptInvitation: handleAcceptInvitation,
        rejectInvitation: handleRejectInvitation,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
