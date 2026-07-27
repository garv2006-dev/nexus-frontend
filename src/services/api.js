const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000'
).replace(/\/+$/, '')

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options)
  } catch (err) {
    if (err instanceof TypeError || err?.message === 'Failed to fetch') {
      throw new Error(
        `Failed to fetch: Server unreachable at ${API_BASE}. Ensure your backend server is running and VITE_API_BASE_URL / VITE_API_URL is set correctly.`
      )
    }
    throw err
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
      defaultMsg = `Request failed with status 404: Endpoint not found. Ensure VITE_API_BASE_URL (or VITE_API_URL) is set in Vercel environment variables to your deployed backend (e.g. https://your-backend.onrender.com).`
    }
    const err = new Error(
      (detail && detail.detail && detail.detail.message) ||
        (typeof detail?.detail === 'string' ? detail.detail : null) ||
        defaultMsg
    )
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

export async function syncProfile(token, { email, name, avatarUrl }) {
  const res = await safeFetch(`${API_BASE}/api/users/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ email, name, avatar_url: avatarUrl }),
  })
  return handle(res)
}

export async function updateProfile(token, { name, bio, avatarUrl }) {
  const res = await safeFetch(`${API_BASE}/api/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ name, bio, avatar_url: avatarUrl }),
  })
  return handle(res)
}

// --- Sessions ------------------------------------------------------------

export async function listSessions(token) {
  const res = await safeFetch(`${API_BASE}/api/sessions`, { headers: authHeaders(token) })
  return handle(res)
}

export async function createSession(token) {
  const res = await safeFetch(`${API_BASE}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({}),
  })
  return handle(res)
}

export async function getSession(token, id) {
  const res = await safeFetch(`${API_BASE}/api/sessions/${id}`, { headers: authHeaders(token) })
  return handle(res)
}

export async function deleteSession(token, id) {
  const res = await safeFetch(`${API_BASE}/api/sessions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return handle(res)
}

export async function renameSession(token, id, title) {
  const res = await safeFetch(`${API_BASE}/api/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ title }),
  })
  return handle(res)
}

/**
 * Sends a message and streams the assistant's reply back via Server-Sent
 * Events. Calls the relevant callback as chunks / completion / errors arrive.
 * A 402 (out of credits) response arrives as a normal JSON body, not a
 * stream, so it's handled before we ever start reading the stream.
 */
export async function streamMessage(token, sessionId, content, { onChunk, onDone, onError, onOutOfCredits }) {
  let res
  try {
    res = await safeFetch(`${API_BASE}/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ content }),
    })
  } catch (err) {
    onError?.(err)
    return
  }

  if (res.status === 402) {
    const body = await res.json().catch(() => null)
    onOutOfCredits?.(body?.detail)
    return
  }

  if (!res.ok || !res.body) {
    let errMessage = 'Failed to reach the server.'
    try {
      const body = await res.json()
      if (body?.detail) errMessage = typeof body.detail === 'string' ? body.detail : body.detail.message || errMessage
    } catch (e) {
      errMessage = `HTTP ${res.status}: ${res.statusText}`
    }
    onError?.(new Error(errMessage))
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data:')) continue
      const jsonStr = line.slice(5).trim()
      if (!jsonStr) continue

      try {
        const payload = JSON.parse(jsonStr)
        if (payload.type === 'chunk') onChunk?.(payload.content)
        else if (payload.type === 'done') onDone?.(payload)
        else if (payload.type === 'error') onError?.(new Error(payload.message))
      } catch {
        // Ignore a malformed frame rather than breaking the whole stream.
      }
    }
  }
}
