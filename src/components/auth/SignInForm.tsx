'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SignInForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlMessage = searchParams.get('message')
    if (urlMessage) {
      setMessage(urlMessage)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid username or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 font-mono">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-green-400 text-2xl mb-4">
            DevRift Access Terminal
          </div>
          <h2 className="text-lg text-gray-300">
            Agent Authentication Required
          </h2>
        </div>
        <form className="mt-8 space-y-6 terminal-card p-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm text-gray-300 mb-2">
                Username:
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input-field w-full"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
                Password:
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field w-full"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className="text-green-400 text-sm text-center bg-green-400/10 border border-green-400/30 p-3 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/30 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signup"
              className="text-green-400 hover:text-green-300 transition-colors duration-200 text-sm"
            >
              Create new account
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
