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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto"></div>
          <p className="mt-4 text-green-400 font-mono">Loading...</p>
        </div>
      </div>
    )
  }

  // Only show landing page for unauthenticated users
  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-400 sm:text-5xl md:text-6xl font-mono">
              DevRift Tools
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Advanced development tools for Politics & War simulation and analysis
            </p>
            
            {/* Call to Action for Unauthenticated Users */}
            <div className="mt-8">
              <div className="terminal-card overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-green-400 font-mono">
                    Get Started
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-300">
                    <p>Join the platform and access powerful development tools</p>
                  </div>
                  <div className="mt-5 space-x-3">
                    <Link
                      href="/auth/signup"
                      className="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium"
                    >
                      Sign Up
                    </Link>
                    <Link
                      href="/auth/signin"
                      className="btn-secondary inline-flex items-center px-4 py-2 text-sm font-medium"
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
                <div className="card">
                  <div className="text-3xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-200 mb-2">Real-time Chat</h3>
                  <p className="text-gray-400 text-sm">Connect with other developers and share insights.</p>
                </div>
                <div className="card">
                  <div className="text-3xl mb-4">⚔️</div>
                  <h3 className="text-lg font-medium text-gray-200 mb-2">War Simulation</h3>
                  <p className="text-gray-400 text-sm">Advanced Politics & War combat simulation tools.</p>
                </div>
                <div className="card">
                  <div className="text-3xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-200 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-400 text-sm">Comprehensive data analysis and visualization tools.</p>
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
