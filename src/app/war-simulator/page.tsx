'use client'

import Navigation from '@/components/Navigation'
import WarSimulation from '@/components/WarSimulation'

export default function WarSimulatorPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-4 font-mono">
            War Simulator
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Advanced Politics & War simulation using accurate formulas. 
            Simulate battles between nations with realistic damage calculations, 
            resistance tracking, and space control mechanics.
          </p>
        </div>
        <WarSimulation />
      </div>
    </div>
  )
}
