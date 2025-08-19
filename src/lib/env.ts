// Environment variable validation
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateEnvVars() {
  const missing: string[] = []
  const invalid: string[] = []

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]
    if (!value) {
      missing.push(envVar)
    } else if (envVar.includes('URL') && !isValidUrl(value)) {
      invalid.push(envVar)
    } else if (value.includes('placeholder') || value.includes('your-')) {
      invalid.push(envVar)
    }
  }

  return { missing, invalid, isValid: missing.length === 0 && invalid.length === 0 }
}
