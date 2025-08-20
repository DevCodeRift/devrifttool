'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navigation from '@/components/Navigation'
import ChatRoom from '@/components/ChatRoom'
import VersionBadge from '@/components/VersionBadge'

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Authentication check and redirect
  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Show loading spinner while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirect message while redirecting unauthenticated users
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

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
