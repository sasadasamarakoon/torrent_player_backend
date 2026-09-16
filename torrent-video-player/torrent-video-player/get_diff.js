const { execSync } = require('child_process');
try {
  const diff = execSync('git diff HEAD -- server.js').toString();
  console.log('Diff length:', diff.length);
  console.log(diff.length > 2000 ? diff.substring(0, 2000) + '...' : diff);
} catch(e) {
  console.log('Error:', e.message);
}
