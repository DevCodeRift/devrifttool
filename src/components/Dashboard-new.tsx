'use client'

import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import VersionBadge from '@/components/VersionBadge'
import PoliticsAndWarPanel from '@/components/PoliticsAndWarPanel'
import { useState } from 'react'
import versionInfo from '../../version.json'
import Link from 'next/link'

export default function Dashboard() {
  const { data: session } = useSession()
  const [activeView, setActiveView] = useState('overview')

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center card p-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-400">Please sign in to access the dashboard</p>
        </div>
      </div>
    )
  }

  const features = [
    {
      id: 'war-simulation',
      title: 'War Simulation',
      status: 'Alpha Testing',
      description: 'Advanced political warfare combat simulation engine',
      link: '/war-simulator',
      available: true,
      icon: '⚔️'
    },
    {
      id: 'trade-optimization',
      title: 'Trade Optimization',
      status: 'Coming Soon',
      description: 'Economic warfare and resource optimization algorithms',
      available: false,
      icon: '📈'
    },
    {
      id: 'spy-calculations',
      title: 'Spy Calculations',
      status: 'Coming Soon',
      description: 'Intelligence gathering and espionage optimization tools',
      available: false,
      icon: '🕵️'
    },
    {
      id: 'military-calculations',
      title: 'Military Calculations',
      status: 'Coming Soon',
      description: 'Military unit efficiency and strategic planning tools',
      available: false,
      icon: '🏗️'
    },
    {
      id: 'intelligence-centre',
      title: 'Intelligence Centre',
      status: 'Coming Soon',
      description: 'Comprehensive intelligence analysis and reporting hub',
      available: false,
      icon: '🎯'
    }
  ]

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="terminal-card p-6">
        <h1 className="text-3xl font-bold text-green-400 mb-4 font-mono">
          Welcome back, {session.user?.name}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="text-center">
            <div className="text-2xl text-green-400 font-mono">Status:</div>
            <div className="text-green-300 font-mono status-active">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-green-400 font-mono">Version:</div>
            <div className="text-green-300 font-mono">{versionInfo.stage} v{versionInfo.version}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-green-400 font-mono">Build:</div>
            <div className="text-green-300 font-mono">{versionInfo.buildNumber}</div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div key={feature.id} className={`card ${!feature.available ? 'opacity-75' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-2xl">{feature.icon}</div>
              <div className={`text-xs font-mono px-2 py-1 rounded border ${
                feature.available 
                  ? 'text-green-400 border-green-400 bg-green-400/10' 
                  : 'text-yellow-400 border-yellow-400 bg-yellow-400/10'
              }`}>
                {feature.status}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {feature.description}
            </p>
            {feature.available && feature.link ? (
              <Link
                href={feature.link}
                className="btn-primary w-full text-center inline-block"
              >
                Launch
              </Link>
            ) : (
              <button
                disabled
                className="w-full py-2 px-4 rounded text-sm border border-gray-600 text-gray-500 bg-gray-800 cursor-not-allowed"
              >
                Coming Soon
              </button>
            )}
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="terminal-card p-6">
        <h3 className="text-lg font-semibold text-green-400 mb-4 font-mono">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-green-400 font-mono">Database</div>
            <div className="text-green-300 status-active">Online</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-mono">API</div>
            <div className="text-green-300 status-active">Operational</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-mono">Security</div>
            <div className="text-green-300 status-active">Enabled</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-mono">Services</div>
            <div className="text-green-300 status-active">Running</div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPoliticsWar = () => (
    <div>
      <PoliticsAndWarPanel />
    </div>
  )

  const renderContent = () => {
    switch (activeView) {
      case 'politicswar':
        return renderPoliticsWar()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-700 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveView('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'overview'
                  ? 'border-green-400 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('politicswar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeView === 'politicswar'
                  ? 'border-green-400 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Politics & War
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      <VersionBadge />
    </div>
  )
}
