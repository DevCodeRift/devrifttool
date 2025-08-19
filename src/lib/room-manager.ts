// Cross-tab room management using localStorage and BroadcastChannel
// In a real application, this would be replaced with a database and WebSocket server

import { BattleSettings, Nation } from '@/types/war'

export interface RoomData {
  id: string
  hostName: string
  settings: BattleSettings
  playerCount: number
  maxPlayers: number
  status: 'waiting' | 'in_progress'
  createdAt: Date
  players: Array<{
    id: string
    name: string
    side: 'attacker' | 'defender' | null
    nation: Nation | null
    isHost: boolean
    isReady: boolean
  }>
}

const STORAGE_KEY = 'war_simulator_rooms'
const CHANNEL_NAME = 'war_simulator_rooms_sync'

class RoomManager {
  private listeners: Array<() => void> = []
  private broadcastChannel: BroadcastChannel | null = null

  constructor() {
    // Initialize BroadcastChannel for cross-tab communication
    if (typeof window !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME)
      this.broadcastChannel.addEventListener('message', () => {
        this.notifyListeners()
      })
    }
  }

  private getRooms(): Map<string, RoomData> {
    if (typeof window === 'undefined') return new Map()
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return new Map()
      
      const roomsData = JSON.parse(stored)
      const rooms = new Map<string, RoomData>()
      
      // Convert stored data back to Map with proper Date objects
      Object.entries(roomsData).forEach(([key, value]) => {
        const roomData = value as RoomData & { createdAt: string }
        rooms.set(key, {
          ...roomData,
          createdAt: new Date(roomData.createdAt)
        })
      })
      
      return rooms
    } catch (error) {
      console.error('Error loading rooms from localStorage:', error)
      return new Map()
    }
  }

  private saveRooms(rooms: Map<string, RoomData>): void {
    if (typeof window === 'undefined') return
    
    try {
      // Convert Map to object for storage
      const roomsObj: Record<string, RoomData> = {}
      rooms.forEach((value, key) => {
        roomsObj[key] = value
      })
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roomsObj))
      
      // Notify other tabs
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'rooms_updated' })
      }
    } catch (error) {
      console.error('Error saving rooms to localStorage:', error)
    }
  }

  createRoom(roomId: string, hostName: string, settings: BattleSettings): RoomData {
    const room: RoomData = {
      id: roomId,
      hostName,
      settings,
      playerCount: 1,
      maxPlayers: 2,
      status: 'waiting',
      createdAt: new Date(),
      players: [{
        id: this.generatePlayerId(),
        name: hostName,
        side: null,
        nation: null,
        isHost: true,
        isReady: false
      }]
    }

    this.rooms.set(roomId, room)
    this.notifyListeners()
    return room
  }

  joinRoom(roomId: string, playerName: string): RoomData | null {
    const room = this.rooms.get(roomId)
    if (!room || room.playerCount >= room.maxPlayers || room.status !== 'waiting') {
      return null
    }

    room.players.push({
      id: this.generatePlayerId(),
      name: playerName,
      side: null,
      nation: null,
      isHost: false,
      isReady: false
    })
    
    room.playerCount = room.players.length
    this.notifyListeners()
    return room
  }

  updateRoom(roomId: string, updates: Partial<RoomData>): RoomData | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    Object.assign(room, updates)
    this.notifyListeners()
    return room
  }

  getRoom(roomId: string): RoomData | null {
    return this.rooms.get(roomId) || null
  }

  getPublicRooms(): RoomData[] {
    return Array.from(this.rooms.values())
      .filter(room => !room.settings.isPrivate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  removeRoom(roomId: string): void {
    this.rooms.delete(roomId)
    this.notifyListeners()
  }

  // Clean up old rooms (older than 1 hour)
  cleanupOldRooms(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.createdAt < oneHourAgo) {
        this.rooms.delete(roomId)
      }
    }
    this.notifyListeners()
  }

  // Listener system for real-time updates
  addListener(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  private generatePlayerId(): string {
    return Math.random().toString(36).substring(2, 15)
  }
}

// Global instance - in a real app, this would be managed by a server
export const roomManager = new RoomManager()

// Clean up old rooms every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    roomManager.cleanupOldRooms()
  }, 10 * 60 * 1000)
}
