import { NextRequest, NextResponse } from 'next/server'
import { multiplayerBattleManager } from '@/lib/multiplayer-battle-manager'
import { ActionType } from '@/types/war'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, playerId, actionType, actionData } = body

    // Validate required fields
    if (!roomId || !playerId || !actionType) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, playerId, actionType' },
        { status: 400 }
      )
    }

    // Validate action type
    const validActions: ActionType[] = [
      'ground_battle',
      'airstrike', 
      'naval_battle',
      'missile_launch',
      'nuclear_attack',
      'fortify',
      'spy_operation'
    ]

    if (!validActions.includes(actionType)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    // Execute the battle action
    const result = await multiplayerBattleManager.executeBattleAction(
      roomId,
      playerId,
      actionType,
      actionData || {}
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      result: result.result
    })

  } catch (error) {
    console.error('Error in battle action API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
