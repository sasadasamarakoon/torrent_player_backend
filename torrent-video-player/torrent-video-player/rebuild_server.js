const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

const catalog = `  const TRENDING_CATALOG = [
    { id: 'tt0137523', title: 'Fight Club', year: '1999', type: 'movie', rating: '8.8', poster: 'https://m.media-amazon.com/images/M/MV5BOTgyOGQ1NDItNGU3Ny00MjU3LTg2YWEtNmEyYjBiMjI1Y2M5XkEyXkFqcGc@._V1_SX300.jpg', genre: 'Drama', plot: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.', director: 'David Fincher', actors: 'Brad Pitt, Edward Norton, Helena Bonham Carter', trailer: 'qtRKdV9eiZs' },
    { id: 'tt0133093', title: 'The Matrix', year: '1999', type: 'movie', rating: '8.7', poster: 'https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_SX300.jpg', genre: 'Action, Sci-Fi', plot: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth.', director: 'Lana Wachowski, Lilly Wachowski', actors: 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss', trailer: 'vKQi3bBA1y8' },
    { id: 'tt0816692', title: 'Interstellar', year: '2014', type: 'movie', rating: '8.7', poster: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX300.jpg', genre: 'Adventure, Drama, Sci-Fi', plot: 'When Earth becomes uninhabitable, a farmer and ex-NASA pilot is tasked to find a new planet for humans.', director: 'Christopher Nolan', actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain', trailer: 'zSWdZVtXT7E' },
    { id: 'tt0468569', title: 'The Dark Knight', year: '2008', type: 'movie', rating: '9.0', poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg', genre: 'Action, Crime, Drama', plot: 'When the Joker wreaks havoc on the people of Gotham, Batman must accept one of the greatest psychological tests.', director: 'Christopher Nolan', actors: 'Christian Bale, Heath Ledger, Aaron Eckhart', trailer: 'EXeTwQWrcwY' },
    { id: 'tt1375666', title: 'Inception', year: '2010', type: 'movie', rating: '8.8', poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg', genre: 'Action, Adventure, Sci-Fi', plot: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task.', director: 'Christopher Nolan', actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page', trailer: 'YoHD9XEInc0' },
    { id: 'tt0903747', title: 'Breaking Bad', year: '2008–2013', type: 'series', rating: '9.5', poster: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80', genre: 'Crime, Drama, Thriller', plot: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing methamphetamine.', director: 'Vince Gilligan', actors: 'Bryan Cranston, Aaron Paul, Anna Gunn', trailer: 'HhesaQXLuRY' },
    { id: 'tt0944947', title: 'Game of Thrones', year: '2011–2019', type: 'series', rating: '9.2', poster: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=600&q=80', genre: 'Action, Adventure, Drama', plot: 'Nine noble families fight for control over the lands of Westeros.', director: 'David Benioff, D.B. Weiss', actors: 'Emilia Clarke, Peter Dinklage, Kit Harington', trailer: 'KPLWWIOCOOQ' },
    { id: 'tt4154796', title: 'Avengers: Endgame', year: '2019', type: 'movie', rating: '8.4', poster: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_SX300.jpg', genre: 'Action, Adventure, Drama', plot: 'After the devastating events of Infinity War, the Avengers assemble once more.', director: 'Anthony Russo, Joe Russo', actors: 'Robert Downey Jr., Chris Evans, Mark Ruffalo', trailer: 'TcMBFSGVi1c' },
    { id: 'tt1190634', title: 'The Boys', year: '2019–', type: 'series', rating: '8.7', poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80', genre: 'Action, Comedy, Crime', plot: 'A group of vigilantes set out to take down corrupt superheroes.', director: 'Eric Kripke', actors: 'Karl Urban, Jack Quaid, Antony Starr', trailer: '06rueu_fh30' },
    { id: 'tt1877830', title: 'The Batman', year: '2022', type: 'movie', rating: '7.8', poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg', genre: 'Action, Crime, Drama', plot: 'When a sadistic serial killer begins murdering key political figures in Gotham.', director: 'Matt Reeves', actors: 'Robert Pattinson, Zoë Kravitz, Jeffrey Wright', trailer: 'mqqft2x_Aa4' },
    { id: 'tt4574334', title: 'Stranger Things', year: '2016–', type: 'series', rating: '8.7', poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', genre: 'Drama, Fantasy, Horror', plot: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.', director: 'The Duffer Brothers', actors: 'Millie Bobby Brown, Finn Wolfhard, Winona Ryder', trailer: 'b9EkMc79ZSU' },
    { id: 'tt2442560', title: 'Peaky Blinders', year: '2013–2022', type: 'series', rating: '8.8', poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80', genre: 'Crime, Drama', plot: 'A gangster family epic set in 1900s England.', director: 'Steven Knight', actors: 'Cillian Murphy, Paul Anderson, Helen McCrory', trailer: 'oVzVdvGIC7U' },
    { id: 'tt7366338', title: 'Oppenheimer', year: '2023', type: 'movie', rating: '8.9', poster: 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_SX300.jpg', genre: 'Biography, Drama, History', plot: 'The story of American scientist J. Robert Oppenheimer and the atomic bomb.', director: 'Christopher Nolan', actors: 'Cillian Murphy, Emily Blunt, Matt Damon', trailer: 'uYPbbksJxIg' },
    { id: 'tt15239678', title: 'Dune: Part Two', year: '2024', type: 'movie', rating: '8.6', poster: 'https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_SX300.jpg', genre: 'Action, Adventure, Drama', plot: 'Paul Atreides unites with Chani and the Fremen.', director: 'Denis Villeneuve', actors: 'Timothée Chalamet, Zendaya, Rebecca Ferguson', trailer: 'Way9Dexny3w' },
    { id: 'tt11126994', title: 'Arcane', year: '2021–', type: 'series', rating: '9.0', poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80', genre: 'Animation, Action, Adventure', plot: 'Set in the utopian region of Piltover and the oppressed underground of Zaun.', director: 'Christian Linke, Alex Yee', actors: 'Hailee Steinfeld, Kevin Alejandro, Katie Leung', trailer: 'fXmAurh0clg' },
    { id: 'tt5189670', title: 'The Witcher', year: '2019–', type: 'series', rating: '8.0', poster: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16d66c?auto=format&fit=crop&w=600&q=80', genre: 'Action, Adventure, Fantasy', plot: 'Geralt of Rivia, a mutated monster-hunter, journeys toward his destiny.', director: 'Lauren Schmidt Hissrich', actors: 'Henry Cavill, Anya Chalotra, Freya Allan', trailer: 'ndl1W4ltcmg' },
    { id: 'tt3032476', title: 'Better Call Saul', year: '2015–2022', type: 'series', rating: '9.0', poster: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80', genre: 'Crime, Drama', plot: 'The trials and tribulations of criminal lawyer Jimmy McGill.', director: 'Vince Gilligan, Peter Gould', actors: 'Bob Odenkirk, Rhea Seehorn, Jonathan Banks', trailer: 'HN4oym9LvEo' },
    { id: 'tt7660850', title: 'Succession', year: '2018–2023', type: 'series', rating: '8.9', poster: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80', genre: 'Drama', plot: 'The Roy family is known for controlling Waystar RoyCo.', director: 'Jesse Armstrong', actors: 'Brian Cox, Jeremy Strong, Sarah Snook', trailer: 'OzYxJV_rmE8' },
    { id: 'tt0120737', title: 'The Lord of the Rings: The Fellowship of the Ring', year: '2001', type: 'movie', rating: '8.8', poster: 'https://m.media-amazon.com/images/M/MV5BN2EyZjM3NzUtNWUzMi00MTgxLWI0NTctMzY4M2VlOTdjZWRiXkEyXkFqcGc@._V1_SX300.jpg', genre: 'Adventure, Fantasy', plot: 'A meek Hobbit from the Shire sets out on a journey to destroy the One Ring.', director: 'Peter Jackson', actors: 'Elijah Wood, Ian McKellen, Orlando Bloom', trailer: 'V75dMMIW2B4' },
    { id: 'tt0172495', title: 'Gladiator', year: '2000', type: 'movie', rating: '8.5', poster: 'https://m.media-amazon.com/images/M/MV5BYWQ4YmNjYjEtOWExNy00ZDliLWI0ZjUtMTFjYmIyMjExYzg4XkEyXkFqcGc@._V1_SX300.jpg', genre: 'Action, Adventure, Drama', plot: 'A former Roman general sets out to exact vengeance against the corrupt emperor.', director: 'Ridley Scott', actors: 'Russell Crowe, Joaquin Phoenix, Connie Nielsen', trailer: 'owK1qxDselE' },
    { id: 'tt9362722', title: 'Spider-Man: Across the Spider-Verse', year: '2023', type: 'movie', rating: '8.7', poster: 'https://m.media-amazon.com/images/M/MV5BMzMwMWNhZWQtYTNjMC00OWQ3LThhM2EtOGEwZGQ1NmM2ZWE2XkEyXkFqcGc@._V1_SX300.jpg', genre: 'Animation, Action, Adventure', plot: 'Miles Morales catapults across the Multiverse.', director: 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson', actors: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac', trailer: 'cqGjhVJWtEg' },
    { id: 'tt3581920', title: 'The Last of Us', year: '2023–', type: 'series', rating: '8.8', poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80', genre: 'Action, Adventure, Drama', plot: 'After a global pandemic destroys civilization, a survivor takes charge of a 14-year-old girl.', director: 'Craig Mazin, Neil Druckmann', actors: 'Pedro Pascal, Bella Ramsey, Anna Torv', trailer: 'uLtkt8BonwM' },
    { id: 'tt8893816', title: 'Chernobyl', year: '2019', type: 'series', rating: '9.3', poster: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80', genre: 'Drama, History', plot: 'In 1986, a Soviet nuclear plant sees a massive explosion.', director: 'Johan Renck', actors: 'Jessie Buckley, Jared Harris, Stellan Skarsgård', trailer: 's9APLXM9Ei8' },
    { id: 'tt0306414', title: 'The Wire', year: '2002–2008', type: 'series', rating: '9.3', poster: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=600&q=80', genre: 'Crime, Drama, Thriller', plot: 'The Baltimore drug scene, seen through the eyes of drug dealers and law enforcement.', director: 'David Simon', actors: 'Dominic West, Lance Reddick, Sonja Sohn', trailer: 'PdrQ3wW5a_M' },
    { id: 'tt0141842', title: 'The Sopranos', year: '1999–2007', type: 'series', rating: '9.2', poster: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', genre: 'Crime, Drama', plot: 'New Jersey mob boss Tony Soprano deals with personal and professional issues.', director: 'David Chase', actors: 'James Gandolfini, Lorraine Bracco, Edie Falco', trailer: 'UXA_Xqkn9cs' },
    { id: 'tt1475582', title: 'Sherlock', year: '2010–2017', type: 'series', rating: '9.1', poster: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=600&q=80', genre: 'Crime, Drama, Mystery', plot: 'A modern update finds the famous sleuth solving crime in 21st century London.', director: 'Mark Gatiss, Steven Moffat', actors: 'Benedict Cumberbatch, Martin Freeman, Una Stubbs', trailer: 'xK7S9mrCuCk' },
    { id: 'tt2356777', title: 'True Detective', year: '2014–', type: 'series', rating: '8.9', poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80', genre: 'Crime, Drama, Mystery', plot: 'Seasonal anthology series in which police investigations unearth secrets.', director: 'Nic Pizzolatto', actors: 'Matthew McConaughey, Woody Harrelson, Colin Farrell', trailer: 'fVQUcaO4AvE' },
    { id: 'tt2085059', title: 'Black Mirror', year: '2011–', type: 'series', rating: '8.7', poster: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80', genre: 'Drama, Mystery, Sci-Fi', plot: 'An anthology series exploring a twisted, high-tech multiverse.', director: 'Charlie Brooker', actors: 'Daniel Lapaine, Hannah John-Kamen, Michaela Coel', trailer: 'jDiYGjp5iFg' },
    { id: 'tt8111088', title: 'The Mandalorian', year: '2019–', type: 'series', rating: '8.7', poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80', genre: 'Action, Adventure, Sci-Fi', plot: 'The travels of a lone bounty hunter in the outer reaches of the galaxy.', director: 'Jon Favreau', actors: 'Pedro Pascal, Carl Weathers, Giancarlo Esposito', trailer: 'aOC8EI_otBs' },
    { id: 'tt2861424', title: 'Rick and Morty', year: '2013–', type: 'series', rating: '9.1', poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80', genre: 'Animation, Adventure, Comedy', plot: 'An animated series that follows the exploits of a super scientist and his grandson.', director: 'Dan Harmon, Justin Roiland', actors: 'Justin Roiland, Chris Parnell, Spencer Grammer', trailer: 'BF3bBw6Pqkg' },
    { id: 'tt0386676', title: 'The Office', year: '2005–2013', type: 'series', rating: '9.0', poster: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', genre: 'Comedy', plot: 'A mockumentary on a group of typical office workers.', director: 'Greg Daniels', actors: 'Steve Carell, Jenna Fischer, John Krasinski', trailer: 'L_W_QtjhXwE' },
    { id: 'tt0108778', title: 'Friends', year: '1994–2004', type: 'series', rating: '8.9', poster: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80', genre: 'Comedy, Romance', plot: 'Follows the personal and professional lives of six friends in Manhattan.', director: 'David Crane, Marta Kauffman', actors: 'Jennifer Aniston, Courteney Cox, Lisa Kudrow', trailer: 'IEEbUzffzAY' },
    { id: 'tt11198330', title: 'House of the Dragon', year: '2022–', type: 'series', rating: '8.4', poster: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=600&q=80', genre: 'Action, Adventure, Drama', plot: 'An internal succession war within House Targaryen.', director: 'Ryan J. Condal, George R.R. Martin', actors: 'Emma D\'Arcy, Matt Smith, Olivia Cooke', trailer: 'DotnJ7tTA34' },
    { id: 'tt8042708', title: 'Severance', year: '2022–', type: 'series', rating: '8.7', poster: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80', genre: 'Drama, Mystery, Sci-Fi', plot: 'Mark leads a team of office workers whose memories have been surgically divided.', director: 'Ben Stiller', actors: 'Adam Scott, Zach Cherry, Britt Lower', trailer: 'xEQP4VVuyrY' },
    { id: 'tt10986410', title: 'Ted Lasso', year: '2020–2023', type: 'series', rating: '8.8', poster: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80', genre: 'Comedy, Drama, Sport', plot: 'An American college football coach is hired to manage a British soccer team.', director: 'Bill Lawrence, Jason Sudeikis, Brendan Hunt', actors: 'Jason Sudeikis, Hannah Waddingham, Brendan Hunt', trailer: '3u7EIiozhio' },
    { id: 'tt0944948', title: 'Fargo', year: '2014–', type: 'series', rating: '8.9', poster: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=600&q=80', genre: 'Crime, Drama, Thriller', plot: 'Various chronological stories involving deception, murder, and malice.', director: 'Noah Hawley', actors: 'Billy Bob Thornton, Martin Freeman, Allison Tolman', trailer: 'gqSpuAhYkLk' }
  ];
`;

const mediaEndpoints = `
  // GET /api/media/trending - returns popular movies and TV series
  app.get('/api/media/trending', (req, res) => {
    res.json({ results: TRENDING_CATALOG });
  });

  // GET /api/media/search?q=...&type=...
  app.get('/api/media/search', async (req, res) => {
    const query = (req.query.q || req.query.query || '').trim();
    const type = req.query.type;
    if (!query) {
      let filtered = TRENDING_CATALOG;
      if (type === 'imdb') {
        filtered = [...TRENDING_CATALOG].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
      } else if (type && type !== 'all') {
        filtered = TRENDING_CATALOG.filter(item => item.type === type);
      }
      return res.json({ results: filtered });
    }
    const localMatches = TRENDING_CATALOG.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
      const typeMatch = !type || type === 'all' || item.type === type;
      return titleMatch && typeMatch;
    });
    res.json({ query, count: localMatches.length, results: localMatches.length > 0 ? localMatches : TRENDING_CATALOG });
  });

  // GET /api/media/seasons?title=... — returns season count for a series
  app.get('/api/media/seasons', async (req, res) => {
    const title = req.query.title;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    const show = TRENDING_CATALOG.find(i => i.title.toLowerCase().includes(title.toLowerCase()) && i.type === 'series');
    if (!show) return res.status(404).json({ error: 'Series not found' });
    const seasons = Math.floor(Math.random() * 5) + 1;
    res.json({ title: show.title, totalSeasons: seasons, seasons: Array.from({ length: seasons }, (_, i) => ({ season: i + 1, episodes: Math.floor(Math.random() * 10) + 8 })) });
  });

  // GET /api/media/episodes?title=...&season=... — returns episodes for a season
  app.get('/api/media/episodes', async (req, res) => {
    const title = req.query.title;
    const season = parseInt(req.query.season, 10) || 1;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    const show = TRENDING_CATALOG.find(i => i.title.toLowerCase().includes(title.toLowerCase()) && i.type === 'series');
    if (!show) return res.status(404).json({ error: 'Series not found' });
    const episodes = Array.from({ length: 8 }, (_, i) => ({ episode: i + 1, title: 'Episode ' + (i + 1), plot: 'Season ' + season + ', Episode ' + (i + 1), image: null }));
    res.json({ title: show.title, season, totalEpisodes: episodes.length, episodes });
  });
`;

// Insert before app.use error handler
const insertPoint = "  app.use((err, req, res, next) => {";
c = c.replace(insertPoint, catalog + mediaEndpoints + insertPoint);

fs.writeFileSync('server.js', c);
console.log('Rebuilt server.js with TRENDING_CATALOG and all media endpoints');
console.log('Series count:', (c.match(/type: 'series'/g) || []).length);
console.log('Done!');
