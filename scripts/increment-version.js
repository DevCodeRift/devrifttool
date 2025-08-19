const fs = require('fs');
const path = require('path');

// Read current version
const versionPath = path.join(__dirname, '../version.json');
const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

// Increment build number
versionData.buildNumber += 1;

// Update the version display (Alpha v1.01, v1.02, etc.)
const paddedBuild = versionData.buildNumber.toString().padStart(2, '0');
versionData.version = `1.${paddedBuild}`;

// Update last updated date
versionData.lastUpdated = new Date().toISOString().split('T')[0];

// Write back to file
fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

console.log(`🚀 Version updated to ${versionData.stage} v${versionData.version} (Build ${versionData.buildNumber})`);
console.log(`📅 Last updated: ${versionData.lastUpdated}`);
