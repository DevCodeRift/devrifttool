import { BattleSettings, Nation } from '@/types/war'

export interface BattleResult {
  roomId: string
  attackerData: {
    playerId: string
    playerName: string
    nation: Nation
    initialMilitary: unknown
    finalMilitary: unknown
  }
  defenderData: {
    playerId: string
    playerName: string
    nation: Nation
    initialMilitary: unknown
    finalMilitary: unknown
  }
  settings: BattleSettings
  winner: 'attacker' | 'defender'
  turns: Array<{
    turnNumber: number
    attacker: unknown
    defender: unknown
    attackerLosses: unknown
    defenderLosses: unknown
    damage: unknown
  }>
  completedAt: string
}

export interface RoomPlayer {
  id: string
  playerName: string
  side: 'attacker' | 'defender' | null
  nationData: Nation | null
  isHost: boolean
  isReady: boolean
  isSpectator: boolean
}

export interface Room {
  id: string
  hostName: string
  settings: BattleSettings
  playerCount: number
  maxPlayers: number
  status: 'waiting' | 'in_progress' | 'completed'
  isPrivate: boolean
  createdAt: string
  players: RoomPlayer[]
  spectatorCount: number
}

class RealTimeRoomManager {
  private baseUrl: string

  constructor() {
    this.baseUrl = '/api/war'
  }

  // Generate unique player ID
  generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Generate unique room ID
  generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get all public rooms
  async getRooms(): Promise<Room[]> {
    try {
      const response = await fetch(`${this.baseUrl}/rooms`)
      if (!response.ok) throw new Error('Failed to fetch rooms')
      return await response.json()
    } catch (error) {
      console.error('Error fetching rooms:', error)
      return []
    }
  }

  // Get specific room data
  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const response = await fetch(`${this.baseUrl}/rooms?roomId=${roomId}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch room')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching room:', error)
      return null
    }
  }

  // Create a new room
  // Create a new room
  async createRoom(roomId: string, hostName: string, settings: BattleSettings, playerId: string): Promise<Room | null> {
    try {
      const response = await fetch(`${this.baseUrl}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          hostName,
          settings,
          playerId
        })
      })
      
      if (!response.ok) throw new Error('Failed to create room')
      
      // Immediately fetch the created room to avoid extra API call
      return await this.getRoom(roomId)
    } catch (error) {
      console.error('Error creating room:', error)
      return null
    }
  }

  // Join an existing room
  async joinRoom(roomId: string, playerId: string, playerName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rooms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          playerId,
          action: 'join_room',
          data: { playerName }
        })
      })
      
      if (!response.ok) throw new Error('Failed to join room')
      return true
    } catch (error) {
      console.error('Error joining room:', error)
      return false
    }
  }

  // Update player data (side, nation, ready status)
  async updatePlayer(
    roomId: string, 
    playerId: string, 
    updates: {
      side?: 'attacker' | 'defender' | null
      nationData?: Nation | null
      isReady?: boolean
    }
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rooms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          playerId,
          action: 'update_player',
          data: {
            side: updates.side,
            nationData: updates.nationData,
            isReady: updates.isReady
          }
        })
      })
      
      if (!response.ok) throw new Error('Failed to update player')
      return true
    } catch (error) {
      console.error('Error updating player:', error)
      return false
    }
  }

  // Start battle (host only)
  async startBattle(roomId: string, playerId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rooms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          playerId,
          action: 'start_battle',
          data: {}
        })
      })
      
      if (!response.ok) throw new Error('Failed to start battle')
      return true
    } catch (error) {
      console.error('Error starting battle:', error)
      return false
    }
  }

  // Leave room
  async leaveRoom(roomId: string, playerId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rooms?roomId=${roomId}&playerId=${playerId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to leave room')
      return true
    } catch (error) {
      console.error('Error leaving room:', error)
      return false
    }
  }

  // Join as spectator
  async joinAsSpectator(roomId: string, spectatorId: string, spectatorName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/spectate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          spectatorId,
          spectatorName
        })
      })
      
      if (!response.ok) throw new Error('Failed to join as spectator')
      return true
    } catch (error) {
      console.error('Error joining as spectator:', error)
      return false
    }
  }

  // Leave spectating
  async leaveSpectating(roomId: string, spectatorId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/spectate?roomId=${roomId}&spectatorId=${spectatorId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to leave spectating')
      return true
    } catch (error) {
      console.error('Error leaving spectating:', error)
      return false
    }
  }

  // Get spectators for a room
  async getSpectators(roomId: string): Promise<Array<{
    id: number
    room_id: string
    spectator_id: string
    spectator_name: string
    joined_at: string
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/spectate?roomId=${roomId}`)
      if (!response.ok) throw new Error('Failed to fetch spectators')
      return await response.json()
    } catch (error) {
      console.error('Error fetching spectators:', error)
      return []
    }
  }

  // Log completed battle
  async logBattle(battleResult: BattleResult): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/battles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(battleResult)
      })
      
      if (!response.ok) throw new Error('Failed to log battle')
      const result = await response.json()
      return result.battleId
    } catch (error) {
      console.error('Error logging battle:', error)
      return null
    }
  }

  // Get battle history
  async getBattleHistory(playerId?: string, limit: number = 50): Promise<Array<Record<string, unknown>>> {
    try {
      const params = new URLSearchParams()
      if (playerId) params.append('playerId', playerId)
      params.append('limit', limit.toString())
      
      const response = await fetch(`${this.baseUrl}/battles?${params}`)
      if (!response.ok) throw new Error('Failed to fetch battle history')
      return await response.json()
    } catch (error) {
      console.error('Error fetching battle history:', error)
      return []
    }
  }

  // Get specific battle details
  async getBattleDetails(battleId: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await fetch(`${this.baseUrl}/battles?battleId=${battleId}`)
      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error('Failed to fetch battle details')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching battle details:', error)
      return null
    }
  }

  // Subscribe to room updates with smart polling
  subscribeToRoom(roomId: string, callback: (room: Room) => void): () => void {
    let pollInterval = 2000 // Start with faster polling (2 seconds)
    let consecutiveNoChanges = 0
    let lastRoomState: string | null = null

    const poll = async () => {
      try {
        const room = await this.getRoom(roomId)
        if (room) {
          const currentRoomState = JSON.stringify(room)
          
          if (currentRoomState !== lastRoomState) {
            callback(room)
            consecutiveNoChanges = 0
            pollInterval = 2000 // Reset to fast polling when changes detected
          } else {
            consecutiveNoChanges++
            // Gradually slow down polling if no changes
            if (consecutiveNoChanges > 3) {
              pollInterval = Math.min(pollInterval * 1.2, 8000) // Max 8 seconds
            }
          }
          
          lastRoomState = currentRoomState
        }
      } catch (error) {
        console.error('Error polling room:', error)
      }
    }

    // Initial call
    poll()

    let timeoutId: NodeJS.Timeout
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        poll().then(scheduleNext)
      }, pollInterval)
    }
    
    scheduleNext()

    return () => clearTimeout(timeoutId)
  }

  // Subscribe to room list updates (placeholder for WebSocket implementation)
  subscribeToRoomList(callback: (rooms: Room[]) => void): () => void {
    // TODO: Implement WebSocket subscription
    // For now, use polling with reduced frequency
    const interval = setInterval(async () => {
      const rooms = await this.getRooms()
      callback(rooms)
    }, 10000) // Poll every 10 seconds instead of 5

    return () => clearInterval(interval)
  }
}

export const realTimeRoomManager = new RealTimeRoomManager()
