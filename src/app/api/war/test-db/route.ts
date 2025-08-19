import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Supabase admin client not available',
        configured: false 
      }, { status: 500 })
    }

    // Test 1: Check if we can connect to Supabase
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('battle_rooms')
      .select('count')
      .limit(1)

    if (connectionError) {
      return NextResponse.json({
        test: 'connection',
        success: false,
        error: connectionError.message,
        code: connectionError.code
      }, { status: 500 })
    }

    // Test 2: Check table structure
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('battle_rooms')
      .select('*')
      .limit(1)

    if (tableError) {
      return NextResponse.json({
        test: 'table_structure',
        success: false,
        error: tableError.message,
        code: tableError.code
      }, { status: 500 })
    }

    // Test 3: Try a simple insert
    const testData = {
      room_code: `test_${Date.now()}`,
      settings: { turnDuration: 60, gameMode: 'test' },
      status: 'waiting'
    }

    const { data: insertTest, error: insertError } = await supabaseAdmin
      .from('battle_rooms')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({
        test: 'insert',
        success: false,
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      }, { status: 500 })
    }

    // Clean up test data
    if (insertTest) {
      await supabaseAdmin
        .from('battle_rooms')
        .delete()
        .eq('id', insertTest.id)
    }

    return NextResponse.json({
      success: true,
      tests: {
        connection: 'passed',
        table_structure: 'passed',
        insert: 'passed'
      },
      testData: insertTest
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'unexpected_error'
    }, { status: 500 })
  }
}
