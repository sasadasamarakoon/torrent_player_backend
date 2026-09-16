const express = require('express');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS to allow browser requests from any local frontend setup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

process.on('uncaughtException', (err) => console.error('[Process Error] Uncaught Exception:', err.message));
process.on('unhandledRejection', (reason) => {
  const msg = reason && (reason.message || String(reason));
  if (msg && (msg.includes('prematurely') || msg.includes('closed') || msg.includes('aborted') || reason.code === 'ERR_STREAM_PREMATURE_CLOSE')) {
    return; // Normal browser video buffering cancellation on seek/pause
  }
  console.error('[Process Error] Unhandled Rejection:', reason);
});

// Utility helpers
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.ts', '.ogv'];

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSec) {
  return formatBytes(bytesPerSec) + '/s';
}

function isVideoFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

async function startServer() {
  // ESM / CommonJS module resolution fallbacks
  const wtModule = await import('webtorrent');
  const WebTorrent = wtModule.default || wtModule;

  const ptModule = await import('parse-torrent');
  const parseTorrent = ptModule.default || ptModule;

  const client = new WebTorrent({
    torrentPort: 0,
    dhtPort: 0,
    utp: false
  });

  // Permanently disable piece uploading / seeding to peers
  client.on('torrent', (torrent) => {
    torrent.on('wire', (wire) => {
      // Intercept and refuse piece upload requests from peers
      wire.removeAllListeners('request');
      wire.on('request', (index, offset, length, cb) => {
        if (typeof cb === 'function') cb(new Error('Upload disabled'));
      });
    });

    // When the download finishes, choke all peers to completely stop seeding
    torrent.on('done', () => {
      console.log(`[WebTorrent] Torrent "${torrent.name}" complete. Seeding stopped.`);
      torrent.wires.forEach((wire) => {
        try { wire.choke(); } catch (e) {}
      });
    });
  });

  client.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn('[WebTorrent Engine Warning]: Port in use, client will use an available dynamic port.');
    } else {
      console.error('[WebTorrent Engine Error]:', err.message);
    }
  });

  const findTorrent = (infoHash) => {
    if (!infoHash) return null;
    const target = String(infoHash).toLowerCase();
    return client.torrents.find((t) => t.infoHash && t.infoHash.toLowerCase() === target) || null;
  };

  const getOrAddTorrent = async (parsedTorrent) => {
    const infoHash = parsedTorrent.infoHash;

    const existing = findTorrent(infoHash);
    if (existing) {
      if (existing.ready) return existing;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: No active seeders found. The swarm may be dead or network is blocked.'));
        }, 60000);
        existing.once('ready', () => {
          clearTimeout(timeout);
          resolve(existing);
        });
        existing.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    }

    return new Promise((resolve, reject) => {
      let isResolved = false;

      const timeout = setTimeout(() => {
        if (isResolved) return;
        isResolved = true;
        const t = findTorrent(infoHash);
        if (t) {
          try { t.destroy(); } catch (e) {}
        }
        reject(new Error('Timeout: No active seeders found. The swarm may be dead or network is blocked.'));
      }, 60000);

      try {
        const added = client.add(parsedTorrent, { destroyStoreOnDestroy: true, deselect: true }, (addedTorrent) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeout);
          resolve(addedTorrent);
        });

        if (added) {
          if (added.ready) {
            isResolved = true;
            clearTimeout(timeout);
            resolve(added);
          } else {
            added.once('ready', () => {
              if (isResolved) return;
              isResolved = true;
              clearTimeout(timeout);
              resolve(added);
            });
            added.once('error', (err) => {
              if (isResolved) return;
              isResolved = true;
              clearTimeout(timeout);
              reject(err);
            });
          }
        }
      } catch (err) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          reject(err);
        }
      }
    });
  };

  const handleTorrentRequest = async (rawInput, res) => {
    try {
      if (!rawInput) {
        return res.status(400).json({ error: 'No torrent input provided.' });
      }

      console.log('[Received Input]:', JSON.stringify(rawInput));

      let cleanedInput = rawInput;

      if (typeof rawInput === 'string') {
        cleanedInput = rawInput
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .replace(/^["']|["']$/g, '')
          .trim();

        if (/^[a-fA-F0-9]{40}$/.test(cleanedInput) || /^[a-zA-Z2-7]{32}$/.test(cleanedInput)) {
          cleanedInput = `magnet:?xt=urn:btih:${cleanedInput}`;
        }
      }

      let parsed;
      try {
        parsed = typeof parseTorrent === 'function' ? await parseTorrent(cleanedInput) : await parseTorrent.parse(cleanedInput);
      } catch (parseErr) {
        return res.status(400).json({ 
          error: `Invalid input format (${parseErr.message}). Ensure you pass a valid magnet URI or 40-character InfoHash.` 
        });
      }

      if (!parsed || !parsed.infoHash || !parsed.infoHashBuffer) {
        return res.status(400).json({ 
          error: `Invalid torrent identifier: Could not extract valid InfoHash.` 
        });
      }

      const defaultTrackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
        'udp://open.stealth.si:80/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'wss://tracker.openwebtorrent.com',
        'wss://tracker.btorrent.xyz'
      ];
      if (!parsed.announce) parsed.announce = [];
      defaultTrackers.forEach((tr) => {
        if (!parsed.announce.includes(tr)) parsed.announce.push(tr);
      });

      const torrent = await getOrAddTorrent(parsed);

      if (res.headersSent) return;

      // Find the default (largest video) file
      let defaultFileIndex = 0;
      let maxVideoSize = 0;
      const enrichedFiles = torrent.files ? torrent.files.map((file, index) => {
        const video = isVideoFile(file.name);
        if (video && file.length > maxVideoSize) {
          maxVideoSize = file.length;
          defaultFileIndex = index;
        }
        return {
          id: index,
          index: index,
          name: file.name,
          length: file.length,
          formattedSize: formatBytes(file.length),
          path: file.path,
          isVideo: video
        };
      }) : [];

      const totalSize = enrichedFiles.reduce((sum, f) => sum + f.length, 0);

      res.json({
        name: torrent.name || parsed.name || 'Unknown Torrent',
        infoHash: torrent.infoHash,
        formattedTotalSize: formatBytes(totalSize),
        defaultFileIndex: defaultFileIndex,
        files: enrichedFiles
      });
    } catch (err) {
      console.error('[handleTorrentRequest Error]:', err);
      if (!res.headersSent) {
        const status = err.message.startsWith('Timeout') ? 504 : 400;
        res.status(status).json({ error: err.message });
      }
    }
  };

  app.get('/api/torrent/info', async (req, res) => {
    let torrentStr = req.query.torrent || '';
    const rawUrl = req.originalUrl;
    const paramIndex = rawUrl.indexOf('torrent=');
    if (paramIndex !== -1) {
      torrentStr = decodeURIComponent(rawUrl.substring(paramIndex + 8));
    }
    await handleTorrentRequest(torrentStr, res);
  });

  // Serves the parsed .torrent file buffer to the browser WebTorrent engine
  app.get('/api/torrent/file', async (req, res) => {
    let torrentStr = req.query.torrent || '';
    const rawUrl = req.originalUrl;
    const paramIndex = rawUrl.indexOf('torrent=');
    if (paramIndex !== -1) {
      torrentStr = decodeURIComponent(rawUrl.substring(paramIndex + 8));
    }
    if (!torrentStr) return res.status(400).json({ error: 'Missing torrent parameter' });

    try {
      let cleanedInput = String(torrentStr)
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      if (/^[a-fA-F0-9]{40}$/.test(cleanedInput) || /^[a-zA-Z2-7]{32}$/.test(cleanedInput)) {
        cleanedInput = `magnet:?xt=urn:btih:${cleanedInput}`;
      }

      let parsed = typeof parseTorrent === 'function' ? await parseTorrent(cleanedInput) : await parseTorrent.parse(cleanedInput);
      const defaultTrackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
        'udp://open.stealth.si:80/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'wss://tracker.openwebtorrent.com',
        'wss://tracker.webtorrent.dev',
        'wss://tracker.files.fm:7073/announce',
        'wss://tracker.btorrent.xyz'
      ];
      if (!parsed.announce) parsed.announce = [];
      defaultTrackers.forEach((tr) => {
        if (!parsed.announce.includes(tr)) parsed.announce.push(tr);
      });

      const torrent = await getOrAddTorrent(parsed);
      if (!torrent || !torrent.torrentFile) {
        return res.status(500).json({ error: 'Could not generate torrent file' });
      }

      res.setHeader('Content-Type', 'application/x-bittorrent');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(torrent.name || 'torrent')}.torrent"`);
      res.send(torrent.torrentFile);
    } catch (err) {
      console.error('[Torrent File Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/add-torrent', async (req, res) => {
    await handleTorrentRequest(req.body.torrentId || req.body.magnet || req.body.url || req.body.torrent, res);
  });

  app.post('/api/torrent', async (req, res) => {
    await handleTorrentRequest(req.body.torrentId || req.body.magnet || req.body.url || req.body.torrent, res);
  });

  const handleUpload = async (req, res) => {
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) return res.status(400).json({ error: 'No torrent file uploaded.' });
    await handleTorrentRequest(uploadedFile.buffer, res);
  };

  app.post('/api/torrent/upload', upload.any(), handleUpload);
  app.post('/api/upload', upload.any(), handleUpload);
  app.post('/upload', upload.any(), handleUpload);

  // Helper to guess Content-Type from file extension
  function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo', '.mov': 'video/quicktime', '.flv': 'video/x-flv',
      '.wmv': 'video/x-ms-wmv', '.m4v': 'video/x-m4v', '.ts': 'video/mp2t',
      '.ogv': 'video/ogg', '.mpg': 'video/mpeg', '.mpeg': 'video/mpeg'
    };
    return types[ext] || 'application/octet-stream';
  }

  // Shared stream handler (used by WebSeed bridge and server-side stream routes)
  function handleStream(infoHash, fileIndex, req, res) {
    const torrent = findTorrent(infoHash);
    if (!torrent) return res.status(404).json({ error: 'Torrent not found' });

    const index = fileIndex != null ? parseInt(fileIndex, 10) : 0;
    const file = torrent.files[index];
    if (!file) return res.status(404).json({ error: 'File not found in torrent' });

    const contentType = getContentType(file.name);
    const range = req.headers.range;

    let stream;

    if (!range) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', file.length);
      stream = file.createReadStream();
    } else {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });

      stream = file.createReadStream({ start, end });
    }

    const cleanup = () => {
      if (stream && !stream.destroyed) {
        try { stream.destroy(); } catch (e) {}
      }
      if (torrent && torrent.pieces) {
        try { torrent.deselect(0, torrent.pieces.length - 1, false); } catch (e) {}
      }
    };

    res.on('close', cleanup);
    res.on('finish', cleanup);

    stream.on('error', (err) => {
      cleanup();
      if (!res.headersSent) {
        try { res.status(500).end(); } catch (e) {}
      }
    });

    stream.pipe(res);
  }

  // WebSeed Bridge: serves pieces to WebTorrent running in the browser
  app.get('/api/webseed/:infoHash/*', (req, res) => {
    const infoHash = req.params.infoHash;
    const torrent = findTorrent(infoHash);
    if (!torrent) return res.status(404).end();

    const relativePath = req.params[0] ? decodeURIComponent(req.params[0]) : '';
    let fileIndex = torrent.files.findIndex(f => f.path === relativePath || f.name === relativePath);
    if (fileIndex === -1) {
      fileIndex = torrent.files.findIndex(f => f.name === path.basename(relativePath));
    }
    if (fileIndex === -1 && torrent.files.length === 1) {
      fileIndex = 0;
    }
    if (fileIndex === -1) return res.status(404).end();

    handleStream(infoHash, fileIndex, req, res);
  });

  // Query-param stream route (frontend uses this)
  app.get('/api/torrent/stream', (req, res) => {
    const infoHash = req.query.torrent || req.query.infoHash;
    const fileIndex = req.query.fileIndex || 0;
    if (!infoHash) return res.status(400).json({ error: 'Missing torrent infoHash' });
    handleStream(infoHash, fileIndex, req, res);
  });

  // Stats endpoint — frontend polls this every second
  app.get('/api/torrent/stats/:infoHash', (req, res) => {
    const torrent = findTorrent(req.params.infoHash);
    if (!torrent) return res.status(404).json({ error: 'Torrent not found' });

    res.json({
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: 0,
      formattedDownloadSpeed: formatSpeed(torrent.downloadSpeed),
      formattedUploadSpeed: '0 B/s',
      numPeers: torrent.numPeers,
      downloaded: torrent.downloaded,
      formattedDownloaded: formatBytes(torrent.downloaded),
      progress: parseFloat((torrent.progress * 100).toFixed(1)),
      timeRemaining: torrent.timeRemaining
    });
  });

  // Query-param stats route (alternative)
  app.get('/api/torrent/stats', (req, res) => {
    const infoHash = req.query.torrent || req.query.infoHash;
    if (!infoHash) return res.status(400).json({ error: 'Missing torrent infoHash' });
    const torrent = findTorrent(infoHash);
    if (!torrent) return res.status(404).json({ error: 'Torrent not found' });

    res.json({
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: 0,
      formattedDownloadSpeed: formatSpeed(torrent.downloadSpeed),
      formattedUploadSpeed: '0 B/s',
      numPeers: torrent.numPeers,
      downloaded: torrent.downloaded,
      formattedDownloaded: formatBytes(torrent.downloaded),
      progress: parseFloat((torrent.progress * 100).toFixed(1)),
      timeRemaining: torrent.timeRemaining
    });
  });

  // Explicit endpoint to stop torrent downloading when video is closed
  app.all('/api/torrent/stop', (req, res) => {
    const infoHash = req.query.torrent || req.body?.torrent || req.body?.infoHash;
    if (infoHash) {
      const torrent = findTorrent(infoHash);
      if (torrent) {
        if (torrent.pieces) {
          try { torrent.deselect(0, torrent.pieces.length - 1, false); } catch (e) {}
        }
        try { torrent.destroy(); } catch (e) {}
        console.log(`[WebTorrent] Stopped torrent "${torrent.name || infoHash}" (video closed).`);
      }
    } else {
      client.torrents.forEach((t) => {
        if (t.pieces) {
          try { t.deselect(0, t.pieces.length - 1, false); } catch (e) {}
        }
        try { t.destroy(); } catch (e) {}
      });
      console.log('[WebTorrent] Stopped all active torrents (video closed).');
    }
    res.json({ success: true, message: 'Torrent downloading stopped.' });
  });

  // ==========================================
  // Torrent Search Engine (torrent-search-api)
  // ==========================================
  const TorrentSearchApi = require('torrent-search-api');

  // Enable preferred reliable public providers
  const SEARCH_PROVIDERS = ['1337x', 'ThePirateBay', 'Yts', 'Eztv', 'Limetorrents'];
  SEARCH_PROVIDERS.forEach(provider => {
    try {
      TorrentSearchApi.enableProvider(provider);
    } catch (err) {
      console.warn(`[TorrentSearch] Could not enable provider ${provider}:`, err.message);
    }
  });
  console.log('[TorrentSearch] Active providers:', TorrentSearchApi.getActiveProviders().map(p => p.name).join(', '));

  function extractMagnetOrHash(torrent) {
    if (!torrent) return null;
    if (torrent.magnet && typeof torrent.magnet === 'string' && torrent.magnet.startsWith('magnet:?')) {
      return torrent.magnet;
    }
    if (torrent.link && typeof torrent.link === 'string' && torrent.link.startsWith('magnet:?')) {
      return torrent.link;
    }
    const fullText = (torrent.link || '') + ' ' + (torrent.desc || '') + ' ' + (torrent.title || '');
    const hashMatch = fullText.match(/\b([A-Fa-f0-9]{40})\b/);
    if (hashMatch) {
      const hash = hashMatch[1].toUpperCase();
      const trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.stealth.si:80/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'udp://explodie.org:6969/announce',
        'udp://tracker.openbittorrent.com:6969/announce'
      ];
      return `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(torrent.title || 'torrent')}&tr=${trackers.map(encodeURIComponent).join('&tr=')}`;
    }
    return null;
  }

  // GET /api/search?q=...&category=...&limit=...&provider=...
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q || req.query.query;
      if (!query || !query.trim()) {
        return res.status(400).json({ error: 'Missing search query (q or query)' });
      }

      const category = req.query.category || 'All';
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
      const provider = req.query.provider;

      let rawResults = [];
      if (provider && provider !== 'all') {
        rawResults = await TorrentSearchApi.search([provider], query.trim(), category, limit);
      } else {
        rawResults = await TorrentSearchApi.search(query.trim(), category, limit);
      }

      if (!Array.isArray(rawResults)) {
        rawResults = [];
      }

      // Process and resolve magnet links with graceful 2.5s per-item timeout
      const items = await Promise.all(
        rawResults.map(async (item) => {
          let magnet = extractMagnetOrHash(item);
          if (!magnet) {
            try {
              const magPromise = TorrentSearchApi.getMagnet(item);
              const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500));
              const fetched = await Promise.race([magPromise, timeoutPromise]);
              if (fetched && fetched.startsWith('magnet:?')) {
                magnet = fetched;
              }
            } catch (e) {
              // Fallback to extract if any
              magnet = extractMagnetOrHash(item);
            }
          }

          return {
            title: item.title || 'Untitled',
            time: item.time || '',
            size: item.size || 'Unknown size',
            seeds: Number(item.seeds) || 0,
            peers: Number(item.peers) || 0,
            provider: item.provider || 'Unknown',
            desc: item.desc || '',
            link: item.link || '',
            magnet: magnet || null
          };
        })
      );

      // Sort by seeds descending by default
      items.sort((a, b) => b.seeds - a.seeds);

      res.json({
        query: query.trim(),
        category,
        count: items.length,
        results: items
      });
    } catch (err) {
      console.error('[Search Error]:', err);
      res.status(500).json({ error: 'Failed to perform torrent search: ' + err.message });
    }
  });

  // POST /api/search/magnet - resolve magnet on demand if not pre-resolved
  app.post('/api/search/magnet', async (req, res) => {
    try {
      const torrent = req.body?.torrent;
      if (!torrent) return res.status(400).json({ error: 'Missing torrent object' });

      let magnet = extractMagnetOrHash(torrent);
      if (!magnet) {
        magnet = await TorrentSearchApi.getMagnet(torrent);
      }

      if (!magnet || !magnet.startsWith('magnet:?')) {
        return res.status(404).json({ error: 'Could not resolve magnet link for this torrent' });
      }

      res.json({ magnet });
    } catch (err) {
      console.error('[Magnet Error]:', err);
      res.status(500).json({ error: 'Failed to resolve magnet link: ' + err.message });
    }
  });

  // GET /api/search/providers - list active search providers
  app.get('/api/search/providers', (req, res) => {
    const active = TorrentSearchApi.getActiveProviders().map(p => ({
      name: p.name,
      public: p.public !== false,
      categories: p.categories || []
    }));
    res.json({ providers: active });
  });

  app.use((err, req, res, next) => {
    if (!res.headersSent) res.status(400).json({ error: 'Route Error: ' + err.message });
  });

  app.use('/api/*', (req, res) => res.status(404).json({ error: 'API route not found' }));

  function startListening(portToTry) {
    const server = app.listen(portToTry, () => {
      console.log(`\n===================================================`);
      console.log(` Server Running on http://localhost:${portToTry}`);
      console.log(`===================================================\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Port Warning] Port ${portToTry} is already in use. Retrying on port ${portToTry + 1}...`);
        startListening(portToTry + 1);
      } else {
        console.error('[Server Error]:', err);
      }
    });
  }

  startListening(Number(PORT));
}

startServer();