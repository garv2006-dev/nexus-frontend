const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000'
).replace(/\/+$/, '')

let currentUserEmail = ''

export function setCurrentUserEmail(email) {
  currentUserEmail = email || ''
}

function authHeaders(token, emailOverride) {
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const email = emailOverride || currentUserEmail
  if (email) {
    headers['X-User-Email'] = email
  }
  return headers
}

async function safeFetch(url, options, retries = 2, delay = 1200) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, options)
    } catch (err) {
      const isNetworkErr = err instanceof TypeError || err?.message === 'Failed to fetch'
      if (isNetworkErr && i < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
        continue
      }
      if (isNetworkErr) {
        throw new Error(
          `Failed to fetch: Server unreachable at ${API_BASE}. Ensure your backend server is running.`
        )
      }
      throw err
    }
  }
}

async function handle(res) {
  if (!res.ok) {
    let detail = null
    try {
      detail = await res.json()
    } catch {
      // no JSON body
    }
    let defaultMsg = `Request failed with status ${res.status}`
    if (res.status === 404) {
      defaultMsg = `Payment endpoint not found (404). Ensure backend server is running and updated.`
    }
    const rawDetail = detail && typeof detail.detail === 'string' ? detail.detail : null
    const msg = (rawDetail && rawDetail.toLowerCase() !== 'not found' ? rawDetail : null) ||
                (detail && detail.detail && detail.detail.message) ||
                defaultMsg
    const err = new Error(msg)
    err.status = res.status
    err.detail = detail?.detail
    throw err
  }
  return res.json()
}

// --- Profile -----------------------------------------------------------

export async function getProfile(token) {
  const res = await safeFetch(`${API_BASE}/api/users/me`, { headers: authHeaders(token) })
  return handle(res)
}

export async function updateProfile(token, profileData) {
  const res = await safeFetch(`${API_BASE}/api/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(profileData),
  })
  return handle(res)
}

export async function syncProfile(token, profileData) {
  const res = await safeFetch(`${API_BASE}/api/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(profileData),
  })
  return handle(res)
}

// --- Workspaces --------------------------------------------------------

export async function listWorkspaces(token) {
  const res = await safeFetch(`${API_BASE}/api/workspaces`, { headers: authHeaders(token) })
  return handle(res)
}

export async function createWorkspace(token, name) {
  const res = await safeFetch(`${API_BASE}/api/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ name }),
  })
  return handle(res)
}

export async function getWorkspace(token, id) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${id}`, { headers: authHeaders(token) })
  return handle(res)
}

export async function updateWorkspaceSettings(token, id, data) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${id}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(data),
  })
  return handle(res)
}

export async function deleteWorkspace(token, id) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return handle(res)
}

// --- Members & Invitations ---------------------------------------------

export async function listWorkspaceMembers(token, workspaceId) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/members`, {
    headers: authHeaders(token),
  })
  return handle(res)
}

export async function inviteWorkspaceMember(token, workspaceId, email, role = 'member', inviterName = '') {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ email, role, inviter_name: inviterName }),
  })
  return handle(res)
}

export async function listWorkspaceInvitations(token, workspaceId) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/invitations`, {
    headers: authHeaders(token),
  })
  return handle(res)
}

export async function cancelWorkspaceInvitation(token, workspaceId, invitationId) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return handle(res)
}

export async function removeWorkspaceMember(token, workspaceId, targetUserId) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/members/${targetUserId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return handle(res)
}

export async function listPendingInvitations(token) {
  const res = await safeFetch(`${API_BASE}/api/invitations`, { headers: authHeaders(token) })
  return handle(res)
}

export async function acceptInvitation(token, invitationId) {
  const res = await safeFetch(`${API_BASE}/api/invitations/${invitationId}/accept`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  return handle(res)
}

export async function rejectInvitation(token, invitationId) {
  const res = await safeFetch(`${API_BASE}/api/invitations/${invitationId}/reject`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  return handle(res)
}

// --- Documents ---------------------------------------------------------

export async function listWorkspaceDocuments(token, workspaceId) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/documents`, {
    headers: authHeaders(token),
  })
  return handle(res)
}

export async function uploadWorkspaceDocuments(token, workspaceId, fileList) {
  const formData = new FormData()
  for (let i = 0; i < fileList.length; i++) {
    formData.append('files', fileList[i])
  }

  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/documents/upload`, {
    method: 'POST',
    headers: authHeaders(token), // Content-Type header auto-set by fetch with boundary
    body: formData,
  })
  return handle(res)
}

export async function deleteWorkspaceDocument(token, workspaceId, documentId) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/documents/${documentId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return handle(res)
}

// --- RAG Conversations & Chat ------------------------------------------

export async function listConversations(token, workspaceId) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/conversations`, {
    headers: authHeaders(token),
  })
  return handle(res)
}

export async function createConversation(token, workspaceId, title = 'New Chat') {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ title }),
  })
  return handle(res)
}

export async function getConversation(token, workspaceId, conversationId) {
  const res = await safeFetch(
    `${API_BASE}/api/workspaces/${workspaceId}/conversations/${conversationId}`,
    { headers: authHeaders(token) }
  )
  return handle(res)
}

export async function deleteConversation(token, workspaceId, conversationId) {
  const res = await safeFetch(
    `${API_BASE}/api/workspaces/${workspaceId}/conversations/${conversationId}`,
    { method: 'DELETE', headers: authHeaders(token) }
  )
  return handle(res)
}

export async function sendChatQuery(token, workspaceId, conversationId, query) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ conversation_id: conversationId, query }),
  })
  return handle(res)
}

// --- Usage Dashboard ----------------------------------------------------

export async function getWorkspaceUsage(token, workspaceId) {
  const res = await safeFetch(`${API_BASE}/api/workspaces/${workspaceId}/usage`, {
    headers: authHeaders(token),
  })
  return handle(res)
}

// --- Stripe Payments ----------------------------------------------------

export async function createCheckoutSession(token, workspaceId, planId) {
  const res = await safeFetch(`${API_BASE}/api/payments/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ workspace_id: workspaceId, plan_id: planId }),
  })
  return handle(res)
}

export async function getPaymentStatus(token, workspaceId) {
  const res = await safeFetch(`${API_BASE}/api/payments/status/${workspaceId}`, {
    headers: authHeaders(token),
  })
  return handle(res)
}

export async function verifyCheckoutSession(token, workspaceId, sessionId) {
  const res = await safeFetch(`${API_BASE}/api/payments/verify-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ workspace_id: workspaceId, session_id: sessionId }),
  })
  return handle(res)
}

export async function cancelSubscription(token, workspaceId) {
  const res = await safeFetch(`${API_BASE}/api/payments/cancel-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ workspace_id: workspaceId }),
  })
  return handle(res)
}

