import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if supabase admin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Supabase admin client not available',
        environment: process.env.NODE_ENV,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }, { status: 500 })
    }

    // Test 1: Basic connection
    console.log('Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('battle_rooms')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.error('Connection error:', connectionError)
      return NextResponse.json({
        test: 'connection_failed',
        error: connectionError.message,
        code: connectionError.code,
        details: connectionError.details,
        hint: connectionError.hint
      }, { status: 500 })
    }

    // Test 2: Check table structure 
    console.log('Checking table structure...')
    let tableCheck = null
    try {
      const { data, error } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, character_maximum_length')
        .eq('table_name', 'battle_rooms')
        .eq('table_schema', 'public')
      
      if (error) {
        console.warn('Table structure check failed:', error)
      } else {
        tableCheck = data
      }
    } catch (err) {
      console.warn('Table structure check error:', err)
    }

    // Test 3: Try actual insert with real room code format
    console.log('Testing insert...')
    const testRoomCode = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const testData = {
      room_code: testRoomCode,
      settings: { turnDuration: 60, gameMode: 'test' },
      status: 'waiting'
    }

    console.log('Attempting insert with data:', testData)
    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('battle_rooms')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({
        test: 'insert_failed',
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        testRoomCode,
        roomCodeLength: testRoomCode.length
      }, { status: 500 })
    }

    // Clean up test data
    if (insertResult) {
      await supabaseAdmin
        .from('battle_rooms')
        .delete()
        .eq('id', insertResult.id)
    }

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      tests: {
        connection: 'passed',
        table_structure: tableCheck || 'checked',
        insert: 'passed'
      },
      testRoomCode,
      roomCodeLength: testRoomCode.length,
      insertResult: insertResult ? { id: insertResult.id } : null
    })

  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
}
