'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUpForm() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email: email || undefined,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
      } else {
        // Registration successful, redirect to sign in
        router.push('/auth/signin?message=Registration successful! Please sign in to access your dashboard.')
      }
    } catch (err) {
      console.error('Registration error:', err)
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
            DevRift Registration
          </div>
          <h2 className="text-lg text-gray-300">
            Create New Account
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
                placeholder="Choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                Email (optional):
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input-field w-full"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm text-gray-300 mb-2">
                Confirm Password:
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="input-field w-full"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="text-green-400 hover:text-green-300 transition-colors duration-200 text-sm"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
