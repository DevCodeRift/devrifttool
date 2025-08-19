'use client'

import { Nation } from '@/types/war'

interface NationStatusProps {
  nation1: Nation
  nation2: Nation
  activeNation: 1 | 2
}

export default function NationStatus({ nation1, nation2, activeNation }: NationStatusProps) {
  const formatNumber = (num: number) => num.toLocaleString()

  const getResistanceColor = (resistance: number) => {
    if (resistance > 75) return 'bg-green-500'
    if (resistance > 50) return 'bg-yellow-500'
    if (resistance > 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const NationCard = ({ nation, isActive }: { nation: Nation; isActive: boolean }) => (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{nation.name}</h3>
          <p className="text-gray-600">Leader: {nation.leader}</p>
          <p className="text-gray-600">Cities: {nation.cities}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-1">
            {nation.isDefender ? 'DEFENDER' : 'ATTACKER'}
          </div>
          {isActive && (
            <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
              ACTIVE
            </div>
          )}
        </div>
      </div>

      {/* Resistance Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Resistance</span>
          <span className="text-sm font-medium text-gray-900">{nation.resistance}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getResistanceColor(nation.resistance)}`}
            style={{ width: `${nation.resistance}%` }}
          ></div>
        </div>
      </div>

      {/* MAPs */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium" style={{ color: '#000000' }}>Military Action Points</span>
          <span className="text-sm font-medium" style={{ color: '#000000' }}>{nation.maps}/{nation.maxMaps}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-blue-500"
            style={{ width: `${(nation.maps / nation.maxMaps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Space Control */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2" style={{ color: '#000000' }}>Space Control</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className={`text-xs px-2 py-1 rounded ${nation.spaceControl.groundControl ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
            Ground Control
          </div>
          <div className={`text-xs px-2 py-1 rounded ${nation.spaceControl.airSuperiority ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
            Air Superiority
          </div>
          <div className={`text-xs px-2 py-1 rounded ${nation.spaceControl.blockade ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
            Blockade
          </div>
          <div className={`text-xs px-2 py-1 rounded ${nation.spaceControl.fortified ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
            Fortified
          </div>
        </div>
      </div>

      {/* Military Units */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2" style={{ color: '#000000' }}>Military</h4>
        <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: '#000000' }}>
          <div className="flex justify-between" style={{ color: '#000000' }}>
            <span style={{ color: '#000000' }}>Soldiers:</span>
            <span className="font-medium" style={{ color: '#000000' }}>{formatNumber(nation.military.soldiers)}</span>
          </div>
          <div className="flex justify-between" style={{ color: '#000000' }}>
            <span style={{ color: '#000000' }}>Tanks:</span>
            <span className="font-medium" style={{ color: '#000000' }}>{formatNumber(nation.military.tanks)}</span>
          </div>
          <div className="flex justify-between" style={{ color: '#000000' }}>
            <span style={{ color: '#000000' }}>Aircraft:</span>
            <span className="font-medium" style={{ color: '#000000' }}>{formatNumber(nation.military.aircraft)}</span>
          </div>
          <div className="flex justify-between" style={{ color: '#000000' }}>
            <span style={{ color: '#000000' }}>Ships:</span>
            <span className="font-medium" style={{ color: '#000000' }}>{formatNumber(nation.military.ships)}</span>
          </div>
          <div className="flex justify-between" style={{ color: '#000000' }}>
            <span style={{ color: '#000000' }}>Missiles:</span>
            <span className="font-medium" style={{ color: '#000000' }}>{formatNumber(nation.military.missiles)}</span>
          </div>
          <div className="flex justify-between">
            <span>Nukes:</span>
            <span className="font-medium">{formatNumber(nation.military.nukes)}</span>
          </div>
          <div className="flex justify-between">
            <span>Spies:</span>
            <span className="font-medium">{formatNumber(nation.military.spies)}</span>
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2" style={{ color: '#000000' }}>Resources</h4>
        <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#000000' }}>
          <div className="flex justify-between">
            <span>Money:</span>
            <span className="font-medium">${formatNumber(Math.floor(nation.resources.money))}</span>
          </div>
          <div className="flex justify-between">
            <span>Infrastructure:</span>
            <span className="font-medium">{formatNumber(Math.floor(nation.infrastructure))}</span>
          </div>
          <div className="flex justify-between">
            <span>Munitions:</span>
            <span className="font-medium">{formatNumber(Math.floor(nation.resources.munitions))}</span>
          </div>
          <div className="flex justify-between">
            <span>Gasoline:</span>
            <span className="font-medium">{formatNumber(Math.floor(nation.resources.gasoline))}</span>
          </div>
          <div className="flex justify-between">
            <span>Steel:</span>
            <span className="font-medium">{formatNumber(Math.floor(nation.resources.steel))}</span>
          </div>
          <div className="flex justify-between">
            <span>Aluminum:</span>
            <span className="font-medium">{formatNumber(Math.floor(nation.resources.aluminum))}</span>
          </div>
        </div>
      </div>

      {/* War Settings */}
      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: '#000000' }}>War Settings</h4>
        <div className="text-xs space-y-1" style={{ color: '#000000' }}>
          <div className="flex justify-between">
            <span>War Policy:</span>
            <span className="font-medium capitalize">{nation.warPolicy}</span>
          </div>
          <div className="flex justify-between">
            <span>War Type:</span>
            <span className="font-medium capitalize">{nation.warType}</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <NationCard 
        nation={nation1} 
        isActive={activeNation === 1} 
      />
      <NationCard 
        nation={nation2} 
        isActive={activeNation === 2} 
      />
    </div>
  )
}
