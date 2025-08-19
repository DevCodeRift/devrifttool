import { NextRequest, NextResponse } from 'next/server';
import { pwApi } from '@/lib/pwapi';

export async function GET(request: NextRequest) {
  try {
    // Check if API is configured
    if (!pwApi.isConfigured()) {
      return NextResponse.json({ 
        error: 'Politics and War API not configured',
        config: pwApi.getConfigStatus()
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const nationId = searchParams.get('nationId');
    const nationName = searchParams.get('name');

    let nation;
    
    if (nationId) {
      // Get nation by ID
      nation = await pwApi.getNation(nationId);
    } else if (nationName) {
      // Search nation by name
      const nations = await pwApi.getNations({ first: 10 });
      nation = nations.find(n => 
        n.nation_name.toLowerCase().includes(nationName.toLowerCase()) ||
        n.leader_name.toLowerCase().includes(nationName.toLowerCase())
      ) || null;
    } else {
      return NextResponse.json({ error: 'Please provide either nationId or name parameter' }, { status: 400 });
    }
    
    if (!nation) {
      return NextResponse.json({ error: 'Nation not found' }, { status: 404 });
    }

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
      spies: 60 // Default to max spies since this isn't in the API
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
