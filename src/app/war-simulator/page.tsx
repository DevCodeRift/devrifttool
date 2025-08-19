'use client'

import Navigation from '@/components/Navigation'
import WarSimulation from '@/components/WarSimulation'

export default function WarSimulatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Politics and War - War Simulator
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comprehensive war simulation using accurate Politics and War formulas. 
              Simulate battles between nations with realistic damage calculations, 
              resistance tracking, and space control mechanics.
            </p>
          </div>
          <WarSimulation />
        </div>
      </div>
    </div>
  )
}
