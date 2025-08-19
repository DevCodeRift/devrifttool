import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { pusherServer } from '@/lib/pusher'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const { action } = await request.json() // 'join' or 'leave'

    if (action === 'join') {
      // Update or insert user presence
      const { error } = await supabaseAdmin
        .from('online_users')
        .upsert([
          {
            user_id: session.user.id,
            username: session.user.name,
            last_seen: new Date().toISOString()
          }
        ])

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to update presence' },
          { status: 500 }
        )
      }

      // Notify other users via Pusher
      try {
        await pusherServer.trigger('chat', 'user-joined', {
          username: session.user.name,
          userId: session.user.id
        })
      } catch (pusherError) {
        console.error('Pusher error:', pusherError)
      }

    } else if (action === 'leave') {
      // Remove user from online users
      const { error } = await supabaseAdmin
        .from('online_users')
        .delete()
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Database error:', error)
      }

      // Notify other users via Pusher
      try {
        await pusherServer.trigger('chat', 'user-left', {
          username: session.user.name,
          userId: session.user.id
        })
      } catch (pusherError) {
        console.error('Pusher error:', pusherError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Presence error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get all online users (remove stale ones older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    // First, clean up stale users
    await supabaseAdmin
      .from('online_users')
      .delete()
      .lt('last_seen', fiveMinutesAgo)

    // Then get current online users
    const { data: onlineUsers, error } = await supabaseAdmin
      .from('online_users')
      .select('username, user_id')
      .order('username')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch online users' },
        { status: 500 }
      )
    }

    return NextResponse.json({ users: onlineUsers || [] })
  } catch (error) {
    console.error('Online users fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
