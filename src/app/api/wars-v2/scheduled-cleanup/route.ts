import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Get the request origin
    const origin = request.headers.get('origin') || 'http://localhost:3000'
    
    // Call the cleanup API
    const cleanupResponse = await fetch(`${origin}/api/wars-v2/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (cleanupResponse.ok) {
      const result = await cleanupResponse.json()
      console.log('Scheduled cleanup completed:', result)
      return NextResponse.json({
        success: true,
        message: 'Scheduled cleanup completed successfully',
        result
      })
    } else {
      const error = await cleanupResponse.text()
      console.error('Scheduled cleanup failed:', error)
      return NextResponse.json(
        { error: 'Cleanup failed', details: error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Scheduled cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to run scheduled cleanup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if scheduled cleanup is working
export async function GET() {
  return NextResponse.json({
    message: 'Scheduled cleanup endpoint is active',
    timestamp: new Date().toISOString(),
    info: {
      purpose: 'Automatically clean up stale lobbies (10+ min) and inactive wars (30+ min)',
      triggers: [
        'Manual POST request to this endpoint',
        'Can be called by external cron services',
        'Can be integrated with Vercel Cron Jobs'
      ]
    }
  })
}
