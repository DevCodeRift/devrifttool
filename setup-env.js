#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 Setting up environment variables for War Simulator\n');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('Please provide your Supabase credentials (from Settings > API in your Supabase dashboard):\n');
  
  const supabaseUrl = await question('Supabase Project URL: ');
  const supabaseAnonKey = await question('Supabase Anon Key: ');
  const supabaseServiceKey = await question('Supabase Service Role Key: ');
  
  const nextAuthSecret = await question('NextAuth Secret (or press Enter to generate): ');
  const generatedSecret = nextAuthSecret || require('crypto').randomBytes(32).toString('hex');

  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# NextAuth Configuration
NEXTAUTH_SECRET=${generatedSecret}
NEXTAUTH_URL=http://localhost:3000

# Pusher Configuration (optional - for real-time features)
PUSHER_APP_ID=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Politics and War API (optional)
PW_API_KEY=
`;

  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment file created successfully!');
  console.log('📁 File saved as: .env.local');
  console.log('\n📝 Next steps:');
  console.log('1. Ensure your Supabase database has the required tables (see DEBUGGING.md)');
  console.log('2. Run "npm run dev" to start the development server');
  console.log('3. Test the API at http://localhost:3000/api/war/debug');
  
  rl.close();
}

setupEnvironment().catch(console.error);
