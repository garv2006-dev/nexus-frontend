import { useState } from 'react'
import { useChat } from '../hooks/useChat'
import { useProfile } from '../hooks/useProfile'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import Header from '../components/Header'
import OutOfCreditsBanner from '../components/OutOfCreditsBanner'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, setCredits } = useProfile()
  const {
    sessions,
    activeId,
    messages,
    isStreaming,
    outOfCredits,
    selectSession,
    newChat,
    removeSession,
    sendMessage,
  } = useChat({ onCreditsChange: setCredits })

  return (
    <div className="app">
      <Sidebar
        className={sidebarOpen ? 'sidebar--open' : ''}
        sessions={sessions}
        activeId={activeId}
        onSelect={(id) => {
          selectSession(id)
          setSidebarOpen(false)
        }}
        onNew={() => {
          newChat()
          setSidebarOpen(false)
        }}
        onDelete={removeSession}
      />

      {sidebarOpen && (
        <div className="app__scrim" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="app__main">
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} credits={profile?.credits} />
        <OutOfCreditsBanner detail={outOfCredits} />
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          inputDisabled={!!outOfCredits}
        />
      </div>
    </div>
  )
}
