const { spawn } = require('child_process');
const child = spawn('node', ['server.js'], { stdio: 'ignore' });
child.unref();
console.log('Server started on port 3000');
