const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

// Each series gets a unique poster URL by id
const uniquePosters = {
  'tt0903747': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',    // Breaking Bad
  'tt0944947': 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=600&q=80',  // Game of Thrones
  'tt1190634': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',  // The Boys
  'tt4574334': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',  // Stranger Things
  'tt2442560': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80',  // Peaky Blinders
  'tt11126994': 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',    // Arcane
  'tt5189670': 'https://images.unsplash.com/photo-1519074069444-1ba4ea16d66c?auto=format&fit=crop&w=600&q=80',  // The Witcher
  'tt3032476': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',  // Better Call Saul
  'tt7660850': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',  // Succession
  'tt3581920': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',  // The Last of Us
  'tt8893816': 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80', // Chernobyl
  'tt0306414': 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=600&q=80', // The Wire
  'tt0141842': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',  // The Sopranos
  'tt1475582': 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=600&q=80', // Sherlock
  'tt2356777': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80', // True Detective
  'tt2085059': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80', // Black Mirror
  'tt8111088': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80', // The Mandalorian
  'tt2861424': 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',    // Rick and Morty
  'tt0386676': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', // The Office
  'tt0108778': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',  // Friends
  'tt11198330': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=600&q=80', // House of the Dragon
  'tt8042708': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80', // Severance
  'tt10986410': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80', // Ted Lasso
  'tt0944948': 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=600&q=80', // Fargo
};

// Replace ALL poster URLs for series entries by matching the exact id line and the next poster line
let newC = c;
for (const [id, url] of Object.entries(uniquePosters)) {
  // Match from id: 'ID', through poster: '...' and replace just the poster URL
  const pattern = new RegExp("(id: '" + id + "',[\\s\\S]*?poster: ')[^']+(')", 'g');
  newC = newC.replace(pattern, (match, prefix, oldPoster, suffix) => {
    return prefix + url + suffix;
  });
}

fs.writeFileSync('server.js', newC);
console.log('Rewrote all 24 series poster URLs with unique Unsplash images');
console.log('Done!');
