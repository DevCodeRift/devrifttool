'use client'

import Link from 'next/link'

export default function DevPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">DevCodeRift Development</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-medium text-yellow-800">⚠️ Setup Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              To test authentication features, you need to set up Supabase and update your environment variables.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/auth/signin"
              className="block text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="block text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Sign Up
            </Link>
          </div>
          
          <div className="text-center">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-800 underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
