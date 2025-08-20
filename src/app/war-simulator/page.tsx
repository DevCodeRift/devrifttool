'use client'

import Navigation from '@/components/Navigation'
import WarSimulatorV2 from '@/components/WarSimulatorV2'

export default function WarSimulatorPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />
      <WarSimulatorV2 />
    </div>
  )
}
