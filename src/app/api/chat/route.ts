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

    const { message } = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    // Insert message into database
    const { data: newMessage, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([
        {
          user_id: session.user.id,
          username: session.user.name,
          message: message.trim(),
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Send real-time update via Pusher
    try {
      await pusherServer.trigger('chat', 'new-message', {
        id: newMessage.id,
        username: newMessage.username,
        message: newMessage.message,
        created_at: newMessage.created_at
      })
    } catch (pusherError) {
      console.error('Pusher error:', pusherError)
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({ success: true, message: newMessage })
  } catch (error) {
    console.error('Chat error:', error)
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

    // Get recent messages
    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error('Chat fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
