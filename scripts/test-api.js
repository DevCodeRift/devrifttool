// Debug script to test the nation search API
const testNationSearch = async () => {
  console.log('🔍 Testing nation search API...')
  
  // Test with a known nation ID (you can change this)
  const testNationId = '1' // Nation ID 1 usually exists
  
  try {
    const response = await fetch(`http://localhost:3007/api/pw/nation?nationId=${testNationId}`)
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Nation search working:', data)
    } else {
      const error = await response.text()
      console.log('❌ Nation search failed:', error)
    }
  } catch (error) {
    console.log('💥 Network error:', error)
  }
}

// Test room data fetching
const testRoomData = async () => {
  console.log('🏠 Testing room data API...')
  
  try {
    const response = await fetch('http://localhost:3007/api/war/rooms')
    console.log('Response status:', response.status)
    
    if (response.ok) {
      const rooms = await response.json()
      console.log('✅ Rooms API working:', rooms)
      console.log('Number of rooms:', rooms.length)
    } else {
      const error = await response.text()
      console.log('❌ Rooms API failed:', error)
    }
  } catch (error) {
    console.log('💥 Network error:', error)
  }
}

// Run tests
console.log('Starting API tests...')
testNationSearch()
testRoomData()
