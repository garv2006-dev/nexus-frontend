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
    <div className="grid grid-cols-1 md:grid-cols-[272px_1fr] h-screen">
      <Sidebar
        className={sidebarOpen ? 'max-md:translate-x-0' : ''}
        sessions={sessions}
        activeId={activeId}
        credits={profile?.credits}
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
        <div className="hidden max-md:block fixed inset-0 bg-black/35 z-10" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-col min-w-0 min-h-0">
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
