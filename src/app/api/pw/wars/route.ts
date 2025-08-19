import { NextRequest, NextResponse } from 'next/server';
import { pwApi } from '@/lib/pwapi';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if API is configured
    if (!pwApi.isConfigured()) {
      return NextResponse.json({ 
        error: 'Politics and War API not configured',
        config: pwApi.getConfigStatus()
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const nationId = searchParams.get('nationId');
    const active = searchParams.get('active');
    const first = searchParams.get('first');

    const filters: Record<string, unknown> = {};
    
    if (nationId) {
      filters.nation_id = [nationId];
    }
    
    if (active !== null) {
      filters.active = active === 'true';
    }
    
    if (first) {
      filters.first = parseInt(first, 10);
    }

    // Get wars data
    const wars = await pwApi.getWars(filters);

    return NextResponse.json({ wars });
  } catch (error) {
    console.error('PW API Wars Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch wars data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
