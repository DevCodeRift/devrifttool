import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables
    const hasApiKey = !!(process.env.POLITICS_AND_WAR_API_KEY);
    const hasNationId = !!(process.env.POLITICS_AND_WAR_NATION_ID);
    const apiKeyLength = process.env.POLITICS_AND_WAR_API_KEY?.length || 0;
    
    // Test the API connection without making a full request
    const baseUrl = 'https://api.politicsandwar.com/graphql';
    const apiKey = process.env.POLITICS_AND_WAR_API_KEY || '';
    
    let connectionTest = false;
    let testError = '';
    
    if (hasApiKey) {
      try {
        // Simple test query to verify API key works
        const testQuery = `
          query TestAPI {
            me {
              nation {
                id
                nation_name
                leader_name
              }
            }
          }
        `;
        
        const response = await fetch(`${baseUrl}?api_key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: testQuery,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (!data.errors) {
            connectionTest = true;
          } else {
            testError = data.errors[0]?.message || 'Unknown GraphQL error';
          }
        } else {
          testError = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        testError = error instanceof Error ? error.message : 'Network error';
      }
    }

    return NextResponse.json({
      configuration: {
        hasApiKey,
        hasNationId,
        apiKeyLength: hasApiKey ? apiKeyLength : 0,
        baseUrl,
      },
      connectionTest: {
        success: connectionTest,
        error: testError || null,
      },
      environment: process.env.NODE_ENV,
      vercel: !!(process.env.VERCEL),
    });
  } catch (error) {
    console.error('PW Config Test Error:', error);
    return NextResponse.json({ 
      error: 'Failed to test configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
