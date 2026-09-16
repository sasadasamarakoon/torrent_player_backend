const fs = require('fs');
const c = fs.readFileSync('server.js', 'utf8');
const lines = c.split('\n');
const posterLines = [];
let currentTitle = '';
let currentId = '';
lines.forEach((line, i) => {
  if (line.includes("id: 'tt")) currentId = line.match(/tt\d+/)[0];
  if (line.includes("title: '")) currentTitle = line.match(/title: '([^']+)'/)[1];
  if (line.includes("poster: 'https://images.unsplash.com")) {
    const posterMatch = line.match(/poster: '([^']+)'/);
    if (posterMatch) posterLines.push({id: currentId, title: currentTitle, poster: posterMatch[1]});
  }
});
const seen = {};
let dupes = 0;
posterLines.forEach(p => {
  if (seen[p.poster]) {
    console.log('DUP: ' + p.title + ' = ' + p.poster.substring(0, 60));
    dupes++;
  }
  seen[p.poster] = true;
});
console.log('Total series posters: ' + posterLines.length);
console.log('Unique: ' + Object.keys(seen).length);
console.log('Duplicates: ' + dupes);
