# War Simulator Backend Documentation

## Overview

The war simulator now features a complete backend system that enables true multiplayer functionality across different users and browser sessions. This system replaces the previous client-side room management with a robust database-backed solution.

## Architecture

### Database Schema

The backend uses PostgreSQL (via Supabase) with the following core tables:

- **`rooms`** - Multiplayer game sessions with settings and status
- **`room_players`** - Player participation in rooms with side selection and ready status
- **`battles`** - Completed battle records with full nation data and results
- **`battle_logs`** - Turn-by-turn battle progression for analytics
- **`spectators`** - Spectator tracking for live viewing

### API Endpoints

#### Room Management (`/api/war/rooms`)

- **GET** - Fetch all public rooms or specific room details
- **POST** - Create a new multiplayer room
- **PUT** - Update room/player data (join, side selection, ready status, start battle)
- **DELETE** - Leave room or delete room (host only)

#### Spectator System (`/api/war/spectate`)

- **GET** - Get spectators for a room
- **POST** - Join as spectator
- **DELETE** - Leave spectating

#### Battle Analytics (`/api/war/battles`)

- **GET** - Fetch battle history, player statistics, or specific battle details
- **POST** - Log completed battle with full turn data

### Real-Time Management

The `realTimeRoomManager` provides a unified interface for:

- Room creation and joining
- Player updates (side selection, nation data, ready status)
- Real-time synchronization via polling (WebSocket upgrade planned)
- Battle logging and analytics
- Spectator management

## Key Features

### Cross-User Multiplayer

- Players can join rooms from different devices/browsers
- Real-time updates across all connected clients
- Persistent room state survives browser refreshes

### Spectator Mode

- Non-participating users can spectate battles
- Real-time spectator count and management
- Future: Live battle viewing during combat

### Battle Analytics

- Complete battle history with turn-by-turn data
- Player statistics and win/loss records
- Nation performance analytics
- Battle replay capability (data stored)

### Professional Theme Integration

- Gray-950 backgrounds with green-400 accents
- Consistent styling across all multiplayer components
- Clean, readable interface for competitive play

## Component Updates

### MultiplayerRoom
- Uses real-time backend API for all operations
- Supports side selection, nation search, and ready coordination
- Host controls for battle initiation

### LobbyBrowser
- Real-time public room discovery
- Join functionality with backend validation
- Status indicators for room availability

### NationSetup
- Conditional display for multiplayer vs singleplayer
- Battle settings panel with turn duration options
- Integration with lobby browser

## Usage Example

```typescript
import { realTimeRoomManager } from '@/lib/realtime-room-manager'

// Create a room
const roomId = realTimeRoomManager.generateRoomId()
const playerId = realTimeRoomManager.generatePlayerId()
await realTimeRoomManager.createRoom(roomId, 'PlayerName', settings, playerId)

// Join a room
await realTimeRoomManager.joinRoom(roomId, playerId, 'PlayerName')

// Update player data
await realTimeRoomManager.updatePlayer(roomId, playerId, {
  side: 'attacker',
  nationData: nation,
  isReady: true
})

// Subscribe to updates
const unsubscribe = realTimeRoomManager.subscribeToRoom(roomId, (room) => {
  console.log('Room updated:', room)
})
```

## Environment Setup

Required environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Politics & War API
POLITICS_AND_WAR_API_KEY=your-pw-api-key

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## Database Setup

1. Create a Supabase project
2. Run the `database/war_simulator_schema.sql` script
3. Configure environment variables
4. Start the development server

## Future Enhancements

### WebSocket Integration
- Replace polling with real-time WebSocket connections
- Instant updates for all room changes
- Live battle progression streaming

### Advanced Analytics
- Win rate tracking per nation type
- Combat effectiveness metrics
- Leaderboard systems

### Tournament System
- Bracket-style tournaments
- Scheduled battles
- Prize/ranking systems

### Enhanced Spectating
- Live battle viewing with turn progression
- Chat system for spectators
- Battle predictions and voting

## Performance Considerations

- Database indexes on frequently queried fields
- Connection pooling for high concurrency
- Pagination for large battle histories
- Efficient polling intervals (2-5 seconds)

The backend system provides a solid foundation for competitive multiplayer gameplay while maintaining the professional aesthetic and responsive performance users expect.
