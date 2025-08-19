'use client'

import { useState } from 'react'
import { Nation, ActionType } from '@/types/war'

interface BattleActionsProps {
  attacker: Nation
  defender: Nation
  onExecuteAction: (
    actionType: ActionType,
    target?: string,
    units?: number,
    options?: Record<string, unknown>
  ) => void
}

export default function BattleActions({ attacker, onExecuteAction }: BattleActionsProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [customUnits, setCustomUnits] = useState<number>(0)
  const [useCustomUnits, setUseCustomUnits] = useState(false)

  const getMAPCost = (action: ActionType): number => {
    switch (action) {
      case 'ground_battle': return 3
      case 'airstrike': return 4
      case 'naval_battle': return 5
      case 'missile_launch': return 8
      case 'nuclear_attack': return 12
      case 'fortify': return 3
      case 'spy_operation': return 0
      default: return 0
    }
  }

  const getAvailableTargets = (action: ActionType): string[] => {
    switch (action) {
      case 'airstrike':
        return ['aircraft', 'soldiers', 'tanks', 'ships']
      case 'naval_battle':
        return ['ships', 'infrastructure', 'ground_control', 'air_superiority']
      default:
        return []
    }
  }

  const getMaxUnits = (action: ActionType): number => {
    switch (action) {
      case 'ground_battle':
        return Math.max(attacker.military.soldiers, attacker.military.tanks)
      case 'airstrike':
        return attacker.military.aircraft
      case 'naval_battle':
        return attacker.military.ships
      case 'missile_launch':
        return attacker.military.missiles
      case 'nuclear_attack':
        return attacker.military.nukes
      default:
        return 0
    }
  }

  const canExecuteAction = (action: ActionType): boolean => {
    const mapCost = getMAPCost(action)
    if (attacker.maps < mapCost) return false

    switch (action) {
      case 'ground_battle':
        return attacker.military.soldiers > 0 || attacker.military.tanks > 0
      case 'airstrike':
        return attacker.military.aircraft > 0
      case 'naval_battle':
        return attacker.military.ships > 0
      case 'missile_launch':
        return attacker.military.missiles > 0
      case 'nuclear_attack':
        return attacker.military.nukes > 0
      case 'fortify':
        return !attacker.spaceControl.fortified
      case 'spy_operation':
        return attacker.military.spies > 0
      default:
        return false
    }
  }

  const executeAction = () => {
    if (!selectedAction) return

    const targets = getAvailableTargets(selectedAction)
    if (targets.length > 0 && !selectedTarget) return

    const units = useCustomUnits ? customUnits : getMaxUnits(selectedAction)
    
    onExecuteAction(selectedAction, selectedTarget, units)
    
    // Reset form
    setSelectedAction(null)
    setSelectedTarget('')
    setCustomUnits(0)
    setUseCustomUnits(false)
  }

  const ActionButton = ({ action, title, description, disabled = false }: {
    action: ActionType
    title: string
    description: string
    disabled?: boolean
  }) => (
    <button
      onClick={() => setSelectedAction(action)}
      disabled={disabled || !canExecuteAction(action)}
      className={`w-full text-left p-4 rounded-lg border transition-colors ${
        selectedAction === action
          ? 'border-blue-500 bg-blue-50'
          : disabled || !canExecuteAction(action)
          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold">{title}</h4>
        <div className="text-sm">
          <span className={`px-2 py-1 rounded ${
            attacker.maps >= getMAPCost(action) 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {getMAPCost(action)} MAPs
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      
      {/* Show unit availability */}
      {action !== 'fortify' && action !== 'spy_operation' && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Available: {getMaxUnits(action).toLocaleString()} units
        </div>
      )}
    </button>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Battle Actions - {attacker.name}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <ActionButton
          action="ground_battle"
          title="Ground Battle"
          description="Attack with soldiers and tanks. Can achieve Ground Control."
        />
        
        <ActionButton
          action="airstrike"
          title="Airstrike"
          description="Attack with aircraft. Can achieve Air Superiority."
        />
        
        <ActionButton
          action="naval_battle"
          title="Naval Battle"
          description="Attack with ships. Can achieve Blockade."
        />
        
        <ActionButton
          action="missile_launch"
          title="Launch Missile"
          description="Launch a missile at enemy infrastructure."
        />
        
        <ActionButton
          action="nuclear_attack"
          title="Nuclear Attack"
          description="Launch a nuclear weapon. Massive infrastructure damage."
        />
        
        <ActionButton
          action="fortify"
          title="Fortify"
          description="Increase defensive capabilities. Enemies take 25% more casualties."
        />
      </div>

      {/* Action Configuration */}
      {selectedAction && (
        <div className="border-t pt-6">
          <h4 className="font-semibold text-gray-900 mb-4">Configure Action</h4>
          
          {/* Target Selection */}
          {getAvailableTargets(selectedAction).length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Target
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select target...</option>
                {getAvailableTargets(selectedAction).map(target => (
                  <option key={target} value={target}>
                    {target.charAt(0).toUpperCase() + target.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Unit Selection */}
          {selectedAction !== 'fortify' && selectedAction !== 'spy_operation' && (
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!useCustomUnits}
                    onChange={() => setUseCustomUnits(false)}
                    className="mr-2"
                  />
                  Use all available units
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={useCustomUnits}
                    onChange={() => setUseCustomUnits(true)}
                    className="mr-2"
                  />
                  Use custom amount
                </label>
              </div>
              
              {useCustomUnits && (
                <div>
                  <input
                    type="number"
                    min="1"
                    max={getMaxUnits(selectedAction)}
                    value={customUnits}
                    onChange={(e) => setCustomUnits(parseInt(e.target.value) || 0)}
                    placeholder={`Max: ${getMaxUnits(selectedAction).toLocaleString()}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Battle Prediction */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Battle Preview</h5>
            <div className="text-sm text-gray-600 space-y-1">
              <div>MAP Cost: {getMAPCost(selectedAction)}</div>
              <div>Remaining MAPs after action: {attacker.maps - getMAPCost(selectedAction)}</div>
              {selectedAction !== 'fortify' && selectedAction !== 'spy_operation' && (
                <div>Units to use: {useCustomUnits ? customUnits.toLocaleString() : getMaxUnits(selectedAction).toLocaleString()}</div>
              )}
              {selectedTarget && (
                <div>Target: {selectedTarget.charAt(0).toUpperCase() + selectedTarget.slice(1).replace('_', ' ')}</div>
              )}
            </div>
          </div>

          {/* Execute Button */}
          <div className="flex gap-4">
            <button
              onClick={executeAction}
              disabled={
                !canExecuteAction(selectedAction) ||
                (getAvailableTargets(selectedAction).length > 0 && !selectedTarget) ||
                (useCustomUnits && (customUnits <= 0 || customUnits > getMaxUnits(selectedAction)))
              }
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Execute {selectedAction.replace('_', ' ').toUpperCase()}
            </button>
            
            <button
              onClick={() => {
                setSelectedAction(null)
                setSelectedTarget('')
                setCustomUnits(0)
                setUseCustomUnits(false)
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-800 mb-2">Battle Information</h5>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Ground Control: Achieved with Immense Triumph in Ground Battle</div>
          <div>• Air Superiority: Achieved with Immense Triumph in Airstrike</div>
          <div>• Blockade: Achieved with Immense Triumph in Naval Battle</div>
          <div>• Each battle consists of 3 rolls between 40%-100% of your strength</div>
          <div>• Victory types: Utter Failure (0/3), Pyrrhic Victory (1/3), Moderate Success (2/3), Immense Triumph (3/3)</div>
        </div>
      </div>
    </div>
  )
}
