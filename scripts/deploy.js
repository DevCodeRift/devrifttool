const { execSync } = require('child_process');

console.log('🚀 Starting deployment process...\n');

try {
  // Increment version
  console.log('📈 Incrementing version...');
  execSync('npm run version:bump', { stdio: 'inherit' });
  
  console.log('\n🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment preparation complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Commit your changes: git add . && git commit -m "Deploy: version bump"');
  console.log('   2. Push to GitHub: git push');
  console.log('   3. Vercel will auto-deploy with the new version\n');
  
} catch (error) {
  console.error('\n❌ Deployment preparation failed:', error.message);
  process.exit(1);
}
