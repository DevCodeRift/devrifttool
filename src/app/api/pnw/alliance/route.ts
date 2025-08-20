import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pwAPI } from '@/lib/politics-and-war'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!pwAPI.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'Politics and War API not configured',
          message: 'Please set POLITICS_AND_WAR_API_KEY and POLITICS_AND_WAR_NATION_ID environment variables'
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const allianceId = searchParams.get('id')
    const allianceName = searchParams.get('name')

    if (!allianceId && !allianceName) {
      return NextResponse.json(
        { error: 'Alliance ID or name is required' },
        { status: 400 }
      )
    }

    let allianceData

    if (allianceId) {
      allianceData = await pwAPI.getAlliance(allianceId)
    } else if (allianceName) {
      allianceData = await pwAPI.getAllianceByName(allianceName!)
    }

    if (!allianceData?.alliances || allianceData.alliances.length === 0) {
      return NextResponse.json(
        { error: 'Alliance not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(allianceData.alliances[0])

  } catch (error) {
    console.error('Politics and War API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch alliance data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
