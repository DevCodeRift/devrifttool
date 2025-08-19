'use client'

import { useState } from 'react'
import NationSetup from './war/NationSetup'
import BattleInterface from './war/BattleInterface'
import { Nation, BattleLog, WarState } from '@/types/war'

export default function WarSimulation() {
  const [warState, setWarState] = useState<WarState>('setup')
  const [nation1, setNation1] = useState<Nation | null>(null)
  const [nation2, setNation2] = useState<Nation | null>(null)
  const [battleLog, setBattleLog] = useState<BattleLog[]>([])
  const [currentTurn, setCurrentTurn] = useState(1)
  const [maxTurns] = useState(60) // 5 days * 12 turns per day

  const resetSimulation = () => {
    setWarState('setup')
    setNation1(null)
    setNation2(null)
    setBattleLog([])
    setCurrentTurn(1)
  }

  const startWar = (n1: Nation, n2: Nation) => {
    setNation1(n1)
    setNation2(n2)
    setWarState('battle')
    
    // Add initial war declaration to battle log
    const initialLog: BattleLog = {
      id: Date.now().toString(),
      turn: 0,
      attacker: n1.name,
      defender: n2.name,
      action: 'war_declaration',
      actionType: 'system',
      result: 'success',
      message: `${n1.name} has declared war on ${n2.name}!`,
      timestamp: new Date(),
      attackerCasualties: {},
      defenderCasualties: {},
      resistanceDamage: 0,
      infrastructureDamage: 0,
      loot: {}
    }
    
    setBattleLog([initialLog])
  }

  return (
    <div className="space-y-6">
      {warState === 'setup' && (
        <NationSetup onWarStart={startWar} />
      )}
      
      {warState === 'battle' && nation1 && nation2 && (
        <>
          <BattleInterface
            nation1={nation1}
            nation2={nation2}
            battleLog={battleLog}
            setBattleLog={setBattleLog}
            currentTurn={currentTurn}
            setCurrentTurn={setCurrentTurn}
            maxTurns={maxTurns}
            onReset={resetSimulation}
            setNation1={setNation1}
            setNation2={setNation2}
          />
        </>
      )}
    </div>
  )
}
