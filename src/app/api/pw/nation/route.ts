import { NextRequest, NextResponse } from 'next/server';
import { pwApi } from '@/lib/pwapi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nationId = searchParams.get('nationId');

    if (!nationId) {
      return NextResponse.json({ error: 'Please provide nationId parameter' }, { status: 400 });
    }

    // Check if API is configured
    if (!pwApi.isConfigured()) {
      return NextResponse.json({ 
        error: 'Politics and War API not configured',
        config: pwApi.getConfigStatus()
      }, { status: 503 });
    }

    // Get nation by ID
    const nation = await pwApi.getNation(nationId);
    
    if (!nation) {
      return NextResponse.json({ error: 'Nation not found' }, { status: 404 });
    }

    // Debug logging
    console.log('Nation data received:', {
      id: nation.id,
      name: nation.nation_name,
      cities: nation.cities ? nation.cities.length : 'undefined',
      citiesData: nation.cities ? 'array' : typeof nation.cities
    });

    // Transform to match war simulator expected format
    const formattedNation = {
      id: parseInt(nation.id),
      nation_name: nation.nation_name,
      leader_name: nation.leader_name,
      num_cities: nation.cities?.length || 0,
      score: nation.score,
      soldiers: nation.soldiers,
      tanks: nation.tanks,
      aircraft: nation.aircraft,
      ships: nation.ships,
      missiles: nation.missiles || 0,
      nukes: nation.nukes || 0,
      spies: 60 // Default spy count for war simulation
    };

    return NextResponse.json(formattedNation);
  } catch (error) {
    console.error('PW API Nation Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch nation data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}