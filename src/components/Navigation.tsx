'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Navigation() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-green-400 font-mono">
                DevRift
              </Link>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-800 h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-green-400 font-mono hover:text-green-300 transition-colors">
              DevRift
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/war-simulator"
                  className="text-gray-300 hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  War Simulator V2
                </Link>
                <span className="text-gray-400 text-sm font-mono">
                  {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="btn-secondary text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-300 hover:text-green-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
