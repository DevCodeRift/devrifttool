'use client'

import { useState } from 'react'

export default function MigratePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const runMigration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migrate-timer', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Migration</h1>
      <button 
        onClick={runMigration}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? 'Running...' : 'Run Migration'}
      </button>
      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded">
          {result}
        </pre>
      )}
    </div>
  )
}
