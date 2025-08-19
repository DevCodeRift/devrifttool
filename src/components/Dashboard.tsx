'use client'

import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import VersionBadge from '@/components/VersionBadge'
import ChatRoom from '@/components/ChatRoom'
import { useState } from 'react'
import versionInfo from '../../version.json'

export default function Dashboard() {
  const { data: session } = useSession()
  const [activePanel, setActivePanel] = useState('overview')

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please sign in to access the dashboard.</p>
        </div>
      </div>
    )
  }

  const panels = [
    { id: 'overview', name: '📊 Overview', icon: '📊' },
    { id: 'chat', name: '💬 Chat Room', icon: '💬' },
    { id: 'games', name: '🎮 Games', icon: '🎮', disabled: true },
    { id: 'profile', name: '👤 Profile', icon: '👤', disabled: true },
    { id: 'settings', name: '⚙️ Settings', icon: '⚙️', disabled: true },
  ]

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Welcome Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome back, {session.user?.name}! 👋
                </h3>
                <p className="text-gray-600 text-sm">
                  You&apos;re in the Alpha version of DevCodeRift. Start by testing the chat room!
                </p>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Account Status</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Version</span>
                    <span className="text-sm font-medium text-blue-600">{versionInfo.stage} v{versionInfo.version}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActivePanel('chat')}
                    className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    💬 Join Chat Room
                  </button>
                  <button
                    disabled
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 text-gray-400 rounded cursor-not-allowed"
                  >
                    🎮 Play Games (Soon)
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">You signed in to DevCodeRift</span>
                  <span className="text-xs text-gray-400">Now</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Welcome to Alpha Testing!</span>
                  <span className="text-xs text-gray-400">Just now</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'chat':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">💬 Chat Room</h2>
              <p className="text-gray-600">Connect with other users in real-time</p>
            </div>
            <ChatRoom />
          </div>
        )

      default:
        return (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">This feature is under development and will be available in a future update.</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard</h2>
            <nav className="space-y-2">
              {panels.map((panel) => (
                <button
                  key={panel.id}
                  onClick={() => !panel.disabled && setActivePanel(panel.id)}
                  disabled={panel.disabled}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activePanel === panel.id
                      ? 'bg-blue-100 text-blue-700'
                      : panel.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {panel.name}
                  {panel.disabled && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {renderPanelContent()}
        </div>
      </div>

      <VersionBadge />
    </div>
  )
}
