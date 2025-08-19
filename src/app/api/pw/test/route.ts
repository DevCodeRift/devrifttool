import { NextRequest, NextResponse } from 'next/server';
import { pwApi } from '@/lib/pwapi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const test = searchParams.get('test');

    // Test API configuration
    const configStatus = pwApi.getConfigStatus();
    console.log('PW API Config Status:', configStatus);

    if (test === 'config') {
      return NextResponse.json({
        message: 'Politics and War API configuration test',
        config: configStatus,
        environment: {
          hasApiKey: !!process.env.POLITICS_AND_WAR_API_KEY,
          hasNationId: !!process.env.POLITICS_AND_WAR_NATION_ID,
          apiKeyPreview: process.env.POLITICS_AND_WAR_API_KEY ? 
            process.env.POLITICS_AND_WAR_API_KEY.substring(0, 8) + '...' : 
            'Not set'
        }
      });
    }

    // Default test: try to get a well-known nation (Sheepy - ID 1)
    if (!pwApi.isConfigured()) {
      return NextResponse.json({ 
        error: 'Politics and War API not configured',
        config: configStatus
      }, { status: 503 });
    }

    console.log('Attempting to fetch nation ID 1...');
    const nation = await pwApi.getNation('1');
    
    if (!nation) {
      return NextResponse.json({ 
        error: 'Nation not found or API call failed',
        config: configStatus
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'API test successful',
      nation: {
        id: nation.id,
        name: nation.nation_name,
        leader: nation.leader_name,
        score: nation.score
      },
      config: configStatus
    });

  } catch (error) {
    console.error('PW API Test Error:', error);
    return NextResponse.json({ 
      error: 'API test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      config: pwApi.getConfigStatus()
    }, { status: 500 });
  }
}
