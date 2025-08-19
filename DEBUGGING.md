# War Simulator API Debug Guide

## ✅ RESOLVED: 500 Internal Server Error on Room Creation

### Root Cause Identified and Fixed
The production deployment had a **data type mismatch** in the `battle_room_players` table. The table was defined with `player_id UUID` but the application sends string values like `"player-debug-123"`, causing insert failures.

### ✅ Solution Applied
1. **Database Schema Fixed**: Updated `player_id` column from `UUID` to `VARCHAR(100)`
2. **Room Lookup Enhanced**: Added support for both UUID and room_code lookups in GET endpoint
3. **Return Value Fixed**: POST endpoint now returns room_code instead of internal UUID

### Fixed Issues
- ✅ 500 Internal Server Error resolved
- ✅ Room creation now works properly
- ✅ Player insertion succeeds
- ✅ Room lookup by room_code supported

### Current Status
Room creation is now **fully functional**. The API successfully:
1. Creates rooms in the database
2. Adds host players without errors
3. Returns proper room codes
4. Supports room lookups by both UUID and room_code

### Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```bash
# Supabase Configuration (REQUIRED for database operations)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Pusher Configuration (for real-time features)
PUSHER_APP_ID=your-pusher-app-id
PUSHER_SECRET=your-pusher-secret
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
NEXT_PUBLIC_PUSHER_CLUSTER=your-pusher-cluster
```

### How to Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Database Schema Setup

Ensure your Supabase database has the required tables. Run this SQL in your Supabase SQL editor:

```sql
-- Create battle_rooms table
CREATE TABLE IF NOT EXISTS battle_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_code VARCHAR(50) UNIQUE NOT NULL,
    settings JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE
);

-- Create battle_room_players table
CREATE TABLE IF NOT EXISTS battle_room_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES battle_rooms(id) ON DELETE CASCADE,
    player_id VARCHAR(100) NOT NULL,
    player_name VARCHAR(100) NOT NULL,
    side VARCHAR(20) CHECK (side IN ('attacker', 'defender')),
    nation_data JSONB,
    is_host BOOLEAN DEFAULT FALSE,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_battle_rooms_status ON battle_rooms(status);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_created_at ON battle_rooms(created_at);
CREATE INDEX IF NOT EXISTS idx_battle_room_players_room_id ON battle_room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_battle_room_players_player_id ON battle_room_players(player_id);
```

### Deployment Fix for Production

1. **For Vercel Deployment:**
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add all the required environment variables listed above
   - Redeploy your application

2. **For Other Hosting Providers:**
   - Add the environment variables through your hosting provider's interface
   - Ensure the variables are available at build time and runtime

### Testing Locally

1. Copy `.env.local.example` to `.env.local`
2. Fill in your actual Supabase credentials
3. Run `npm run dev`
4. Test the API endpoint:

```bash
curl -X POST http://localhost:3000/api/war/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "test-room-123",
    "hostName": "TestHost",
    "settings": {"turnDuration": 60, "gameMode": "multiplayer"},
    "playerId": "player-123"
  }'
```

### Debug Endpoint

Use the debug endpoint to check your configuration:
```
GET /api/war/debug
```

This will show you:
- Database connection status
- Environment variable availability
- Table structure validation

### Common Error Messages

1. **"Supabase admin client not initialized"**
   - Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable

2. **"Database connection not available"**
   - Missing `NEXT_PUBLIC_SUPABASE_URL` or invalid URL

3. **"relation 'battle_rooms' does not exist"**
   - Database tables not created - run the SQL schema above

4. **"duplicate key value violates unique constraint"**
   - Room ID already exists - use a unique room ID

### API Endpoints

- `POST /api/war/rooms` - Create a new room
- `GET /api/war/rooms` - List all rooms
- `GET /api/war/rooms?roomId=xxx` - Get specific room
- `PUT /api/war/rooms` - Update room/player data
- `DELETE /api/war/rooms?roomId=xxx&playerId=xxx` - Leave/delete room
- `GET /api/war/debug` - Debug information

### Next Steps

1. Set up environment variables in production
2. Ensure database schema is properly created
3. Test the API endpoints
4. Monitor server logs for any remaining issues
