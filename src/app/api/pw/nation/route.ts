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

    // Get nation data
    const nation = await pwApi.getNation(nationId || undefined);
    
    if (!nation) {
      return NextResponse.json({ error: 'Nation not found' }, { status: 404 });
    }

    return NextResponse.json({ nation });
  } catch (error) {
    console.error('PW API Nation Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch nation data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
