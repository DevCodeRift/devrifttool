'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navigation from '@/components/Navigation'
import VersionBadge from '@/components/VersionBadge'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Only show landing page for unauthenticated users
  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Welcome to DevCodeRift
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              A simple multiplayer web application with real-time features.
            </p>
            
            {/* Call to Action for Unauthenticated Users */}
            <div className="mt-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Get Started Today
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Join our Alpha testing program and experience real-time multiplayer features!</p>
                  </div>
                  <div className="mt-5 space-x-3">
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      🚀 Start Alpha Testing
                    </Link>
                    <Link
                      href="/auth/signin"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="mt-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-3xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Real-time Chat</h3>
                  <p className="text-gray-600 text-sm">Connect with other users instantly with our live chat system.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-3xl mb-4">🎮</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Multiplayer Games</h3>
                  <p className="text-gray-600 text-sm">Play games with friends in real-time (coming soon).</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="text-3xl mb-4">🚀</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Alpha Testing</h3>
                  <p className="text-gray-600 text-sm">Be part of our early testing program and shape the future.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <VersionBadge />
    </div>
  )
}
