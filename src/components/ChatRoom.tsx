'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { pusherClient } from '@/lib/pusher'

interface Message {
  id: string
  username: string
  message: string
  created_at: string
}

interface OnlineUser {
  username: string
  user_id: string
}

export default function ChatRoom() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Fetch initial messages and online users
    fetchMessages()
    fetchOnlineUsers()
    
    // Join the chat room
    joinChatRoom()

    // Subscribe to Pusher channel
    const channel = pusherClient.subscribe('chat')
    
    channel.bind('new-message', (data: Message) => {
      setMessages(prev => [...prev, data])
    })

    channel.bind('user-joined', (data: { username: string; userId: string }) => {
      setOnlineUsers(prev => {
        // Check if user is already in the list
        const exists = prev.some(user => user.user_id === data.userId)
        if (!exists) {
          return [...prev, { username: data.username, user_id: data.userId }]
        }
        return prev
      })
    })

    channel.bind('user-left', (data: { username: string; userId: string }) => {
      setOnlineUsers(prev => prev.filter(user => user.user_id !== data.userId))
    })

    // Set up heartbeat to maintain presence
    const heartbeat = setInterval(joinChatRoom, 60000) // Every minute

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeat)
      leaveChatRoom()
      pusherClient.unsubscribe('chat')
    }
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/chat')
      const data = await response.json()
      if (data.messages) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch('/api/presence')
      const data = await response.json()
      if (data.users) {
        setOnlineUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch online users:', error)
    }
  }

  const joinChatRoom = async () => {
    try {
      await fetch('/api/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'join' }),
      })
    } catch (error) {
      console.error('Failed to join chat room:', error)
    }
  }

  const leaveChatRoom = async () => {
    try {
      await fetch('/api/presence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'leave' }),
      })
    } catch (error) {
      console.error('Failed to leave chat room:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage }),
      })

      if (response.ok) {
        setNewMessage('')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Please sign in to join the chat
      </div>
    )
  }

  return (
    <div className="flex h-96 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h3 className="font-medium text-gray-900">Chat Room</h3>
          <p className="text-sm text-gray-500">Welcome, {session.user?.name}!</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.username === session.user?.name ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.username === session.user?.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {msg.username} • {formatTime(msg.created_at)}
                </div>
                <div>{msg.message}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {/* Online Users Sidebar */}
      <div className="w-48 bg-gray-50 border-l">
        <div className="p-3 border-b">
          <h4 className="font-medium text-gray-900">Online Users</h4>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">{session.user?.name} (You)</span>
          </div>
          {onlineUsers
            .filter(user => user.username !== session.user?.name)
            .map((user) => (
              <div key={user.user_id} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{user.username}</span>
              </div>
            ))}
          {onlineUsers.filter(user => user.username !== session.user?.name).length === 0 && (
            <div className="text-xs text-gray-500 italic">
              No other users online
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
