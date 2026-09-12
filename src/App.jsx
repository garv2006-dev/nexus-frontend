import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { WorkspaceProvider } from './context/WorkspaceContext'

import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import InvitationsPage from './pages/InvitationsPage'
import ChatPage from './pages/ChatPage'
import DocumentsPage from './pages/DocumentsPage'
import MembersPage from './pages/MembersPage'
import UsagePage from './pages/UsagePage'
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage'

export default function App() {
  return (
    <Routes>
      {/* Public Clerk Auth Routes */}
      <Route path="/login/*" element={<SignInPage />} />
      <Route path="/signup/*" element={<SignUpPage />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />

      {/* Authenticated Workspace Application Routes */}
      <Route
        path="/*"
        element={
          <>
            <SignedIn>
              <WorkspaceProvider>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/invitations" element={<InvitationsPage />} />

                  {/* Workspace Sub-Routes */}
                  <Route
                    path="/workspace/:workspaceId"
                    element={<Navigate to="chat" replace />}
                  />
                  <Route path="/workspace/:workspaceId/chat" element={<ChatPage />} />
                  <Route path="/workspace/:workspaceId/documents" element={<DocumentsPage />} />
                  <Route path="/workspace/:workspaceId/members" element={<MembersPage />} />
                  <Route path="/workspace/:workspaceId/usage" element={<UsagePage />} />
                  <Route path="/workspace/:workspaceId/settings" element={<WorkspaceSettingsPage />} />

                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </WorkspaceProvider>
            </SignedIn>

            <SignedOut>
              <Navigate to="/login" replace />
            </SignedOut>
          </>
        }
      />
    </Routes>
  )
}
