import { NextRequest, NextResponse } from 'next/server';
import { pwApi } from '@/lib/pwapi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nationId = searchParams.get('nationId');
    const nationName = searchParams.get('name');

    // For now, return mock data based on the search to test the simulator
    if (nationName || nationId) {
      const searchTerm = nationName || nationId || 'Unknown';
      
      // Generate mock nation data based on search term
      const mockNation = {
        id: Math.floor(Math.random() * 100000),
        nation_name: searchTerm.includes('701263') ? 'Test Nation 1' : `${searchTerm} Nation`,
        leader_name: `Leader of ${searchTerm}`,
        num_cities: Math.floor(Math.random() * 20) + 5, // 5-25 cities
        score: Math.floor(Math.random() * 100000) + 10000, // 10k-110k score
        soldiers: Math.floor(Math.random() * 50000),
        tanks: Math.floor(Math.random() * 10000),
        aircraft: Math.floor(Math.random() * 2000),
        ships: Math.floor(Math.random() * 500),
        missiles: Math.floor(Math.random() * 10),
        nukes: Math.floor(Math.random() * 5),
        spies: 60
      };

      return NextResponse.json(mockNation);
    }

    return NextResponse.json({ error: 'Please provide either nationId or name parameter' }, { status: 400 });

    // TODO: Uncomment this when P&W API is properly configured
    /*
    // Check if API is configured
    if (!pwApi.isConfigured()) {
      return NextResponse.json({ 
        error: 'Politics and War API not configured',
        config: pwApi.getConfigStatus()
      }, { status: 503 });
    }

    let nation;
    
    if (nationId) {
      // Get nation by ID
      nation = await pwApi.getNation(nationId);
    } else if (nationName) {
      // Search nation by name - this needs a better implementation
      const nations = await pwApi.getNations({ first: 100 });
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
      spies: 60
    };

    return NextResponse.json(formattedNation);
    */
  } catch (error) {
    console.error('PW API Nation Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch nation data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
