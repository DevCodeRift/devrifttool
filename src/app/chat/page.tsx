import Navigation from '@/components/Navigation'
import ChatRoom from '@/components/ChatRoom'
import VersionBadge from '@/components/VersionBadge'

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🚀 Multiplayer Test Room
          </h1>
          <p className="mt-2 text-gray-600">
            Test the real-time chat functionality and see who&apos;s online!
          </p>
        </div>

        <ChatRoom />

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900">Testing Instructions:</h3>
          <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Open this page in multiple browser tabs or devices</li>
            <li>Sign in with different accounts to test multiplayer</li>
            <li>Send messages to see real-time updates via Pusher</li>
            <li>Check the online users list on the right</li>
          </ul>
        </div>
      </main>

      <VersionBadge />
    </div>
  )
}
