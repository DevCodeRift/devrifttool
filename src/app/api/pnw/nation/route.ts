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
    const nationId = searchParams.get('id')
    const nationName = searchParams.get('name')

    let nationData

    if (nationId) {
      nationData = await pwAPI.getNation(nationId)
    } else if (nationName) {
      nationData = await pwAPI.getNationByName(nationName)
    } else {
      // Get the configured nation (user's nation)
      nationData = await pwAPI.getMyNation()
    }

    if (!nationData.nations || nationData.nations.length === 0) {
      return NextResponse.json(
        { error: 'Nation not found' },
        { status: 404 }
      )
    }

    // Transform the data to match what the frontend expects
    const nation = nationData.nations[0]
    const transformedNation = {
      nation_name: nation.nation_name,
      leader_name: nation.leader_name,
      cities: nation.num_cities,
      score: nation.score,
      soldiers: nation.soldiers,
      tanks: nation.tanks,
      aircraft: nation.aircraft,
      ships: nation.ships
    }

    return NextResponse.json(transformedNation)

  } catch (error) {
    console.error('Politics and War API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch nation data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
