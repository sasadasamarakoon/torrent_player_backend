const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');
const multer = require('multer');
const cp = require('child_process');

let ffmpegPath = null;
try {
  ffmpegPath = require('ffmpeg-static');
  console.log('[Audio Engine] ffmpeg-static loaded successfully:', ffmpegPath);
} catch (e) {
  console.warn('[Audio Engine Notice] ffmpeg-static not available:', e.message);
}

// --- Keep server alive on all unhandled errors ---
process.on('uncaughtException', (err) => {
  const msg = err && (err.message || String(err));
  if (msg && (msg.includes('prematurely') || msg.includes('closed') || msg.includes('aborted') || err.code === 'ERR_STREAM_PREMATURE_CLOSE')) {
    return;
  }
  console.error('[UNCAUGHT EXCEPTION - Server kept alive]:', msg);
});
process.on('unhandledRejection', (reason) => {
  const msg = reason && (reason.message || String(reason));
  if (msg && (msg.includes('prematurely') || msg.includes('closed') || msg.includes('aborted') || reason.code === 'ERR_STREAM_PREMATURE_CLOSE')) {
    return;
  }
  console.error('[UNHANDLED REJECTION - Server kept alive]:', msg);
});

// --- Prevent stdin from closing the process (e.g. piped input from task runner) ---
try {
  process.stdin.resume();
  process.stdin.on('data', (d) => console.log('[Received Input (ignored)]:', JSON.stringify(d.toString().trim())));
  process.stdin.on('end', () => console.log('[stdin closed - server continues running]'));
  process.stdin.on('error', () => {});
} catch (e) {}

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

function filenameNeedsAudioFix(filename) {
  const name = String(filename || '').toLowerCase();
  return /\b(ac3|eac3|e-ac-3|dd\+|ddp|dts(?:-hd)?|truehd|true\.hd|atmos|thd|flac)\b/.test(name);
}

async function startServer() {
  // ESM / CommonJS module resolution fallbacks
  const wtModule = await import('webtorrent');
  const WebTorrent = wtModule.default || wtModule;

  const ptModule = await import('parse-torrent');
  const parseTorrent = ptModule.default || ptModule;

  const PUBLIC_TRACKERS = [
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'udp://explodie.org:6969/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://tracker.dler.org:6969/announce',
    'udp://open.demonii.com:1337/announce',
    'udp://tracker.moeking.me:6969/announce',
    'udp://p4p.arenabg.com:1337/announce',
    'udp://tracker.tiny-vps.com:6969/announce',
    'udp://tracker.theoks.net:6969/announce',
    'http://tracker.openbittorrent.com:80/announce',
    'http://tracker.opentrackr.org:1337/announce',
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.webtorrent.dev',
    'wss://tracker.files.fm:7073/announce'
  ];

  const TORRENT_STORE = path.join(os.tmpdir(), 'streamforge-torrents');
  try { fs.mkdirSync(TORRENT_STORE, { recursive: true }); } catch (e) {}

  const client = new WebTorrent({
    torrentPort: 0,
    dhtPort: 0,
    utp: true,
    maxConns: 120,
    dht: true
  });

  client.on('torrent', (torrent) => {
    torrent.on('error', (err) => {
      console.warn(`[WebTorrent Swarm Notice (${torrent.name || torrent.infoHash})]:`, err.message);
    });
    torrent.on('done', () => {
      console.log(`[WebTorrent] Torrent "${torrent.name}" download complete.`);
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
          reject(new Error('Timeout: No active seeders found for this swarm.'));
        }, 120000);
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

      // 120-second timeout for low-peer / DHT swarms
      const timeout = setTimeout(() => {
        if (isResolved) return;
        isResolved = true;
        const t = findTorrent(infoHash);
        if (t && t.ready) {
          resolve(t);
          return;
        }
        reject(new Error('Timeout: Slow or low-peer swarm. Try searching for a higher-seeded alternative.'));
      }, 120000);

      try {
        const added = client.add(parsedTorrent, {
          path: TORRENT_STORE,
          destroyStoreOnDestroy: true,
          announce: PUBLIC_TRACKERS
        }, (addedTorrent) => {
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

      if (!parsed.announce) parsed.announce = [];
      PUBLIC_TRACKERS.forEach((tr) => {
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
          isVideo: video,
          needsAudioFix: video && filenameNeedsAudioFix(file.name)
        };
      }) : [];

      // Proactively pre-buffer the first audio/video frames & container metadata right now
      if (torrent.files && torrent.files[defaultFileIndex]) {
        try {
          const defaultFile = torrent.files[defaultFileIndex];
          torrent.files.forEach((f, idx) => {
            if (idx !== defaultFileIndex && typeof f.deselect === 'function') f.deselect();
          });
          if (typeof defaultFile.select === 'function') defaultFile.select();
          const sp = defaultFile._startPiece;
          const ep = defaultFile._endPiece;
          if (typeof sp === 'number' && typeof ep === 'number') {
            torrent.select(sp, Math.min(sp + 6, ep), 1);
            torrent.select(Math.max(sp, ep - 3), ep, 1);
          }
        } catch (e) {}
      }

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
    await handleTorrentRequest(req.query.torrent || req.query.magnet || '', res);
  });

  // Serves the parsed .torrent file buffer to the browser WebTorrent engine
  app.get('/api/torrent/file', async (req, res) => {
    let torrentStr = req.query.torrent || req.query.magnet || '';
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
      if (!parsed.announce) parsed.announce = [];
      PUBLIC_TRACKERS.forEach((tr) => {
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

    // Focus download priority on the selected file & immediately fetch first frames and audio
    try {
      torrent.files.forEach((f, idx) => {
        if (idx !== index && typeof f.deselect === 'function') f.deselect();
      });
      if (typeof file.select === 'function') file.select();

      // Immediately prioritize the first pieces (container header, audio/video codecs)
      // and last pieces (MP4 MOOV index atom at EOF) so playback begins immediately
      const startPiece = file._startPiece;
      const endPiece = file._endPiece;
      if (typeof startPiece === 'number' && typeof endPiece === 'number') {
        const numHeaderPieces = Math.min(8, endPiece - startPiece + 1);
        const numTailPieces = Math.min(4, endPiece - startPiece + 1);

        // Max critical priority for the first frames and audio
        torrent.select(startPiece, startPiece + numHeaderPieces - 1, 1);
        // High priority for the end index (needed by MP4/MKV to parse tracks and duration)
        torrent.select(Math.max(startPiece, endPiece - numTailPieces + 1), endPiece, 1);
      }
    } catch (e) {}

    const ext = path.extname(file.name || '').toLowerCase();
    const needsRemux = Boolean(ffmpegPath) && (
      req.query.audioFix === '1' ||
      req.query.transcode === 'audio' ||
      filenameNeedsAudioFix(file.name) ||
      ['.mkv', '.avi', '.ts', '.m2ts', '.wmv', '.flv'].includes(ext)
    );

    if (needsRemux) {
      const seekSeconds = parseFloat(req.query.ss || req.query.startTime || '0') || 0;
      console.log(`[Browser Remux] fMP4/AAC stream (seek ${seekSeconds}s): ${file.name}`);

      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-store',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      const ffmpegArgs = [
        '-hide_banner',
        '-loglevel', 'error',
        '-fflags', '+genpts+discardcorrupt',
        '-probesize', '32M',
        '-analyzeduration', '15M'
      ];
      if (seekSeconds > 0) ffmpegArgs.push('-ss', String(seekSeconds));
      ffmpegArgs.push(
        '-i', 'pipe:0',
        '-map', '0:v:0',
        '-map', '0:a:0?',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-profile:a', 'aac_low',
        '-b:a', '192k',
        '-ac', '2',
        '-ar', '48000',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        'pipe:1'
      );

      const ffmpegProc = cp.spawn(ffmpegPath, ffmpegArgs);
      const sourceStream = file.createReadStream({ highWaterMark: 256 * 1024 });
      sourceStream.pipe(ffmpegProc.stdin);
      ffmpegProc.stdout.pipe(res);

      let isCleanedUp = false;
      const cleanupFfmpeg = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        if (sourceStream && !sourceStream.destroyed) {
          try { sourceStream.destroy(); } catch (e) {}
        }
        if (ffmpegProc) {
          try { ffmpegProc.stdin.destroy(); } catch (e) {}
          try { ffmpegProc.stdout.destroy(); } catch (e) {}
          try { ffmpegProc.kill('SIGKILL'); } catch (e) {}
        }
      };

      res.on('close', cleanupFfmpeg);
      res.on('finish', cleanupFfmpeg);
      ffmpegProc.stdin.on('error', () => {});
      ffmpegProc.stdout.on('error', () => {});
      ffmpegProc.stderr.on('data', (buf) => {
        const msg = buf.toString().trim();
        if (msg) console.warn('[ffmpeg]', msg.slice(0, 300));
      });
      ffmpegProc.on('error', (err) => {
        console.warn('[FFMPEG Process Notice]:', err.message);
        cleanupFfmpeg();
      });
      sourceStream.on('error', () => cleanupFfmpeg());
      return;
    }

    const contentType = getContentType(file.name);
    const range = req.headers.range;

    let stream;

    if (!range) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', file.length);
      stream = file.createReadStream({ highWaterMark: 64 * 1024 });
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

      stream = file.createReadStream({ start, end, highWaterMark: 64 * 1024 });
    }

    const cleanup = () => {
      if (stream && !stream.destroyed) {
        try { stream.destroy(); } catch (e) {}
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

  // Audio system status route
  app.get('/api/audio/status', (req, res) => {
    res.json({
      ffmpegAvailable: Boolean(ffmpegPath),
      engine: 'ffmpeg-static',
      codecs: ['aac', 'ac3', 'eac3', 'dts', 'truehd', 'flac', 'opus', 'mp3']
    });
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
        try {
          client.remove(torrent.infoHash, { destroyStore: true }, (err) => {
            if (err) console.warn('[WebTorrent Remove Error]:', err.message);
          });
        } catch (e) {
          try { torrent.destroy({ destroyStore: true }); } catch (err) {}
        }
        console.log(`[WebTorrent] Completely stopped and destroyed torrent "${torrent.name || infoHash}" (seeding terminated).`);
      }
    } else {
      client.torrents.forEach((t) => {
        if (t.pieces) {
          try { t.deselect(0, t.pieces.length - 1, false); } catch (e) {}
        }
        try {
          client.remove(t.infoHash, { destroyStore: true }, () => {});
        } catch (e) {
          try { t.destroy({ destroyStore: true }); } catch (err) {}
        }
      });
      console.log('[WebTorrent] Stopped and destroyed all active torrents (seeding terminated).');
    }
    res.json({ success: true, message: 'Torrent stopped and seeding terminated.' });
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

  // ====================================================
  // Movies & TV Shows Discovery Engine (IMDb / Media API)
  // ====================================================
  const TRENDING_CATALOG = [
    {
      id: 'tt0137523',
      title: 'Fight Club',
      year: '1999',
      type: 'movie',
      rating: '8.8',
      poster: 'https://m.media-amazon.com/images/M/MV5BOTgyOGQ1NDItNGU3Ny00MjU3LTg2YWEtNmEyYjBiMjI1Y2M5XkEyXkFqcGc@._V1_SX300.jpg',
      genre: 'Drama',
      plot: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.',
      director: 'David Fincher',
      actors: 'Brad Pitt, Edward Norton, Helena Bonham Carter',
      trailer: 'qtRKdV9eiZs'
    },
    {
      id: 'tt0133093',
      title: 'The Matrix',
      year: '1999',
      type: 'movie',
      rating: '8.7',
      poster: 'https://m.media-amazon.com/images/M/MV5BN2NmN2VhMTQtMDNiOS00NDlhLTliMjgtODE2ZTY0ODQyNDRhXkEyXkFqcGc@._V1_SX300.jpg',
      genre: 'Action, Sci-Fi',
      plot: 'When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence.',
      director: 'Lana Wachowski, Lilly Wachowski',
      actors: 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss',
      trailer: 'vKQi3bBA1y8'
    },
    {
      id: 'tt0816692',
      title: 'Interstellar',
      year: '2014',
      type: 'movie',
      rating: '8.7',
      poster: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_SX300.jpg',
      genre: 'Adventure, Drama, Sci-Fi',
      plot: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
      director: 'Christopher Nolan',
      actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
      trailer: 'zSWdZVtXT7E'
    },
    {
      id: 'tt0468569',
      title: 'The Dark Knight',
      year: '2008',
      type: 'movie',
      rating: '9.0',
      poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg',
      genre: 'Action, Crime, Drama',
      plot: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      director: 'Christopher Nolan',
      actors: 'Christian Bale, Heath Ledger, Aaron Eckhart',
      trailer: 'EXeTwQWrcwY'
    },
    {
      id: 'tt1375666',
      title: 'Inception',
      year: '2010',
      type: 'movie',
      rating: '8.8',
      poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg',
      genre: 'Action, Adventure, Sci-Fi',
      plot: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.',
      director: 'Christopher Nolan',
      actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page',
      trailer: 'YoHD9XEInc0'
    },
    {
      id: 'tt0903747',
      title: 'Breaking Bad',
      year: '2008–2013',
      type: 'series',
      rating: '9.5',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
      genre: 'Crime, Drama, Thriller',
      plot: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family\'s financial future.',
      director: 'Vince Gilligan',
      actors: 'Bryan Cranston, Aaron Paul, Anna Gunn',
      trailer: 'HhesaQXLuRY'
    },
    {
      id: 'tt0944947',
      title: 'Game of Thrones',
      year: '2011–2019',
      type: 'series',
      rating: '9.2',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/498/1245274.jpg',
      genre: 'Action, Adventure, Drama',
      plot: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
      director: 'David Benioff, D.B. Weiss',
      actors: 'Emilia Clarke, Peter Dinklage, Kit Harington',
      trailer: 'KPLWWIOCOOQ'
    },
    {
      id: 'tt4154796',
      title: 'Avengers: Endgame',
      year: '2019',
      type: 'movie',
      rating: '8.4',
      poster: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_SX300.jpg',
      genre: 'Action, Adventure, Drama',
      plot: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.',
      director: 'Anthony Russo, Joe Russo',
      actors: 'Robert Downey Jr., Chris Evans, Mark Ruffalo',
      trailer: 'TcMBFSGVi1c'
    },
    {
      id: 'tt1190634',
      title: 'The Boys',
      year: '2019–',
      type: 'series',
      rating: '8.7',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/619/1547768.jpg',
      genre: 'Action, Comedy, Crime',
      plot: 'A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.',
      director: 'Eric Kripke',
      actors: 'Karl Urban, Jack Quaid, Antony Starr',
      trailer: '06rueu_fh30'
    },
    {
      id: 'tt1877830',
      title: 'The Batman',
      year: '2022',
      type: 'movie',
      rating: '7.8',
      poster: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
      genre: 'Action, Crime, Drama',
      plot: 'When a sadistic serial killer begins murdering key political figures in Gotham, the Batman is forced to investigate the city\'s hidden corruption and question his family\'s involvement.',
      director: 'Matt Reeves',
      actors: 'Robert Pattinson, Zoë Kravitz, Jeffrey Wright',
      trailer: 'mqqft2x_Aa4'
    },
    {
      id: 'tt4574334',
      title: 'Stranger Things',
      year: '2016–',
      type: 'series',
      rating: '8.7',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/503/1259163.jpg',
      genre: 'Drama, Fantasy, Horror',
      plot: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
      director: 'The Duffer Brothers',
      actors: 'Millie Bobby Brown, Finn Wolfhard, Winona Ryder',
      trailer: 'b9EkMc79ZSU'
    },
    {
      id: 'tt2442560',
      title: 'Peaky Blinders',
      year: '2013–2022',
      type: 'series',
      rating: '8.8',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/48/122213.jpg',
      genre: 'Crime, Drama',
      plot: 'A gangster family epic set in 1900s England, centering on a gang who sew razor blades in the peaks of their caps, and their fierce boss Tommy Shelby.',
      director: 'Steven Knight',
      actors: 'Cillian Murphy, Paul Anderson, Helen McCrory',
      trailer: 'oVzVdvGIC7U'
    },
    {
      id: 'tt7366338',
      title: 'Oppenheimer',
      year: '2023',
      type: 'movie',
      rating: '8.9',
      poster: 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_SX300.jpg',
      genre: 'Biography, Drama, History',
      plot: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      director: 'Christopher Nolan',
      actors: 'Cillian Murphy, Emily Blunt, Matt Damon',
      trailer: 'uYPbbksJxIg'
    },
    {
      id: 'tt15239678',
      title: 'Dune: Part Two',
      year: '2024',
      type: 'movie',
      rating: '8.6',
      poster: 'https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_SX300.jpg',
      genre: 'Action, Adventure, Drama',
      plot: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      director: 'Denis Villeneuve',
      actors: 'Timothée Chalamet, Zendaya, Rebecca Ferguson',
      trailer: 'Way9Dexny3w'
    },
    {
      id: 'tt11126994',
      title: 'Arcane',
      year: '2021–',
      type: 'series',
      rating: '9.0',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/380/951057.jpg',
      genre: 'Animation, Action, Adventure',
      plot: 'Set in the utopian region of Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.',
      director: 'Christian Linke, Alex Yee',
      actors: 'Hailee Steinfeld, Kevin Alejandro, Katie Leung',
      trailer: 'fXmAurh0clg'
    },
    {
      id: 'tt5189670',
      title: 'The Witcher',
      year: '2019–',
      type: 'series',
      rating: '8.0',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/475/1189445.jpg',
      genre: 'Action, Adventure, Fantasy',
      plot: 'Geralt of Rivia, a mutated monster-hunter for hire, journeys toward his destiny in a turbulent world where people often prove more wicked than beasts.',
      director: 'Lauren Schmidt Hissrich',
      actors: 'Henry Cavill, Anya Chalotra, Freya Allan',
      trailer: 'ndl1W4ltcmg'
    },
    {
      id: 'tt3032476',
      title: 'Better Call Saul',
      year: '2015–2022',
      type: 'series',
      rating: '9.0',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/412/1031302.jpg',
      genre: 'Crime, Drama',
      plot: 'The trials and tribulations of criminal lawyer Jimmy McGill in the years leading up to his fateful run-in with Walter White and Jesse Pinkman.',
      director: 'Vince Gilligan, Peter Gould',
      actors: 'Bob Odenkirk, Rhea Seehorn, Jonathan Banks',
      trailer: 'HN4oym9LvEo'
    },
    {
      id: 'tt7660850',
      title: 'Succession',
      year: '2018–2023',
      type: 'series',
      rating: '8.9',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/455/1138245.jpg',
      genre: 'Drama',
      plot: 'The Roy family is known for controlling Waystar RoyCo, a massive media and entertainment conglomerate. However, their world changes when their aging patriarch steps down.',
      director: 'Jesse Armstrong',
      actors: 'Brian Cox, Jeremy Strong, Sarah Snook',
      trailer: 'OzYxJV_rmE8'
    },
    {
      id: 'tt0120737',
      title: 'The Lord of the Rings: The Fellowship of the Ring',
      year: '2001',
      type: 'movie',
      rating: '8.8',
      poster: 'https://m.media-amazon.com/images/M/MV5BN2EyZjM3NzUtNWUzMi00MTgxLWI0NTctMzY4M2VlOTdjZWRiXkEyXkFqcGc@._V1_SX300.jpg',
      genre: 'Adventure, Fantasy',
      plot: 'A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.',
      director: 'Peter Jackson',
      actors: 'Elijah Wood, Ian McKellen, Orlando Bloom',
      trailer: 'V75dMMIW2B4'
    },
    {
      id: 'tt0172495',
      title: 'Gladiator',
      year: '2000',
      type: 'movie',
      rating: '8.5',
      poster: 'https://m.media-amazon.com/images/M/MV5BYWQ4YmNjYjEtOWExNy00ZDliLWI0ZjUtMTFjYmIyMjExYzg4XkEyXkFqcGc@._V1_SX300.jpg',
      genre: 'Action, Adventure, Drama',
      plot: 'A former Roman general sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.',
      director: 'Ridley Scott',
      actors: 'Russell Crowe, Joaquin Phoenix, Connie Nielsen',
      trailer: 'owK1qxDselE'
    },
    {
      id: 'tt9362722',
      title: 'Spider-Man: Across the Spider-Verse',
      year: '2023',
      type: 'movie',
      rating: '8.7',
      poster: 'https://m.media-amazon.com/images/M/MV5BMzMwMWNhZWQtYTNjMC00OWQ3LThhM2EtOGEwZGQ1NmM2ZWE2XkEyXkFqcGc@._V1_SX300.jpg',
      genre: 'Animation, Action, Adventure',
      plot: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
      director: 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson',
      actors: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac',
      trailer: 'cqGjhVJWtEg'
    },
    {
      id: 'tt3581920',
      title: 'The Last of Us',
      year: '2023–',
      type: 'series',
      rating: '8.8',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/445/1113525.jpg',
      genre: 'Action, Adventure, Drama',
      plot: 'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity\'s last hope.',
      director: 'Craig Mazin, Neil Druckmann',
      actors: 'Pedro Pascal, Bella Ramsey, Anna Torv',
      trailer: 'uLtkt8BonwM'
    },
    {
      id: 'tt8893816',
      title: 'Chernobyl',
      year: '2019',
      type: 'series',
      rating: '9.3',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/192/481137.jpg',
      genre: 'Drama, History',
      plot: 'In 1986, a Soviet nuclear plant sees a massive explosion, prompting heroic efforts to contain the catastrophe.',
      director: 'Johan Renck',
      actors: 'Jessie Buckley, Jared Harris, Stellan Skarsgård',
      trailer: 's9APLXM9Ei8'
    },
    {
      id: 'tt0306414',
      title: 'The Wire',
      year: '2002–2008',
      type: 'series',
      rating: '9.3',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/4/11322.jpg',
      genre: 'Crime, Drama, Thriller',
      plot: 'The Baltimore drug scene, seen through the eyes of drug dealers and law enforcement.',
      director: 'David Simon',
      actors: 'Dominic West, Lance Reddick, Sonja Sohn',
      trailer: 'PdrQ3wW5a_M'
    },
    {
      id: 'tt0141842',
      title: 'The Sopranos',
      year: '1999–2007',
      type: 'series',
      rating: '9.2',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/0/236.jpg',
      genre: 'Crime, Drama',
      plot: 'New Jersey mob boss Tony Soprano deals with personal and professional issues in his home and business life.',
      director: 'David Chase',
      actors: 'James Gandolfini, Lorraine Bracco, Edie Falco',
      trailer: 'UXA_Xqkn9cs'
    },
    {
      id: 'tt1475582',
      title: 'Sherlock',
      year: '2010–2017',
      type: 'series',
      rating: '9.1',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/38/96515.jpg',
      genre: 'Crime, Drama, Mystery',
      plot: 'A modern update finds the famous sleuth and his doctor partner solving crime in 21st century London.',
      director: 'Mark Gatiss, Steven Moffat',
      actors: 'Benedict Cumberbatch, Martin Freeman, Una Stubbs',
      trailer: 'xK7S9mrCuCk'
    },
    {
      id: 'tt2356777',
      title: 'True Detective',
      year: '2014–',
      type: 'series',
      rating: '8.9',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/437/1093121.jpg',
      genre: 'Crime, Drama, Mystery',
      plot: 'Seasonal anthology series in which police investigations unearth the personal and professional secrets of those involved.',
      director: 'Nic Pizzolatto',
      actors: 'Matthew McConaughey, Woody Harrelson, Colin Farrell',
      trailer: 'fVQUcaO4AvE'
    },
    {
      id: 'tt2085059',
      title: 'Black Mirror',
      year: '2011–',
      type: 'series',
      rating: '8.7',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/437/1093122.jpg',
      genre: 'Drama, Mystery, Sci-Fi',
      plot: 'An anthology series exploring a twisted, high-tech multiverse where humanity\'s greatest innovations and darkest instincts collide.',
      director: 'Charlie Brooker',
      actors: 'Daniel Lapaine, Hannah John-Kamen, Michaela Coel',
      trailer: 'jDiYGjp5iFg'
    },
    {
      id: 'tt8111088',
      title: 'The Mandalorian',
      year: '2019–',
      type: 'series',
      rating: '8.7',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/619/1547769.jpg',
      genre: 'Action, Adventure, Sci-Fi',
      plot: 'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.',
      director: 'Jon Favreau',
      actors: 'Pedro Pascal, Carl Weathers, Giancarlo Esposito',
      trailer: 'aOC8EI_otBs'
    },
    {
      id: 'tt2861424',
      title: 'Rick and Morty',
      year: '2013–',
      type: 'series',
      rating: '9.1',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/431/1079315.jpg',
      genre: 'Animation, Adventure, Comedy',
      plot: 'An animated series that follows the exploits of a super scientist and his not-so-bright grandson.',
      director: 'Dan Harmon, Justin Roiland',
      actors: 'Justin Roiland, Chris Parnell, Spencer Grammer',
      trailer: 'BF3bBw6Pqkg'
    },
    {
      id: 'tt0386676',
      title: 'The Office',
      year: '2005–2013',
      type: 'series',
      rating: '9.0',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/0/238.jpg',
      genre: 'Comedy',
      plot: 'A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and boredom.',
      director: 'Greg Daniels',
      actors: 'Steve Carell, Jenna Fischer, John Krasinski',
      trailer: 'L_W_QtjhXwE'
    },
    {
      id: 'tt0108778',
      title: 'Friends',
      year: '1994–2004',
      type: 'series',
      rating: '8.9',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/43/109015.jpg',
      genre: 'Comedy, Romance',
      plot: 'Follows the personal and professional lives of six twenty to thirty-something-year-old friends living in Manhattan.',
      director: 'David Crane, Marta Kauffman',
      actors: 'Jennifer Aniston, Courteney Cox, Lisa Kudrow',
      trailer: 'IEEbUzffzAY'
    },
    {
      id: 'tt11198330',
      title: 'House of the Dragon',
      year: '2022–',
      type: 'series',
      rating: '8.4',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/416/1042308.jpg',
      genre: 'Action, Adventure, Drama',
      plot: 'An internal succession war within House Targaryen at the height of its power, 172 years before the birth of Daenerys Targaryen.',
      director: 'Ryan J. Condal, George R.R. Martin',
      actors: 'Emma D\'Arcy, Matt Smith, Olivia Cooke',
      trailer: 'DotnJ7tTA34'
    },
    {
      id: 'tt8042708',
      title: 'Severance',
      year: '2022–',
      type: 'series',
      rating: '8.7',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/393/983758.jpg',
      genre: 'Drama, Mystery, Sci-Fi',
      plot: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
      director: 'Ben Stiller',
      actors: 'Adam Scott, Zach Cherry, Britt Lower',
      trailer: 'xEQP4VVuyrY'
    },
    {
      id: 'tt10986410',
      title: 'Ted Lasso',
      year: '2020–2023',
      type: 'series',
      rating: '8.8',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/458/1146700.jpg',
      genre: 'Comedy, Drama, Sport',
      plot: 'An American college football coach is hired to manage a British soccer team. What he lacks in knowledge, he makes up for with optimism.',
      director: 'Bill Lawrence, Jason Sudeikis, Brendan Hunt',
      actors: 'Jason Sudeikis, Hannah Waddingham, Brendan Hunt',
      trailer: '3u7EIiozhio'
    },
    {
      id: 'tt0944948',
      title: 'Fargo',
      year: '2014–',
      type: 'series',
      rating: '8.9',
      poster: 'https://static.tvmaze.com/uploads/images/original_untouched/498/1245275.jpg',
      genre: 'Crime, Drama, Thriller',
      plot: 'Various chronological stories involving deception, murder, and malice in snowy American settings.',
      director: 'Noah Hawley',
      actors: 'Billy Bob Thornton, Martin Freeman, Allison Tolman',
      trailer: 'gqSpuAhYkLk'
    }
  ];

  // GET /api/media/trending - returns popular movies and TV series
  app.get('/api/media/trending', (req, res) => {
    res.json({ results: TRENDING_CATALOG });
  });

  // GET /api/media/search?q=...&type=...
  app.get('/api/media/search', async (req, res) => {
    const query = (req.query.q || req.query.query || '').trim();
    const type = req.query.type; // 'movie' or 'series' or 'imdb'
    if (!query) {
      let filtered = TRENDING_CATALOG;
      if (type === 'imdb') {
        filtered = [...TRENDING_CATALOG].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0));
      } else if (type && type !== 'all') {
        filtered = TRENDING_CATALOG.filter(item => item.type === type);
      }
      return res.json({ results: filtered });
    }

    try {
      // First check local catalog for instant matches
      const localMatches = TRENDING_CATALOG.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
        const typeMatch = !type || type === 'all' || item.type === type;
        return titleMatch && typeMatch;
      });

      // 1. Query TVMaze free endpoint for live TV series results
      let liveTvResults = [];
      if (!type || type === 'all' || type === 'series') {
        try {
          const tvUrl = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;
          const tvRes = await fetch(tvUrl, {
            signal: AbortSignal.timeout(4500),
            headers: { 'User-Agent': 'StreamForge/1.0' }
          });
          if (tvRes.ok) {
            const tvData = await tvRes.json();
            if (Array.isArray(tvData)) {
              liveTvResults = tvData.slice(0, 8).map(entry => {
                const show = entry.show;
                const posterUrl = (show.image && (show.image.medium || show.image.original))
                  ? (show.image.medium || show.image.original)
                  : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80';
                return {
                  id: (show.externals && show.externals.imdb) ? show.externals.imdb : `tvm-${show.id}`,
                  title: show.name,
                  year: show.premiered ? show.premiered.slice(0, 4) : '',
                  type: 'series',
                  rating: show.rating && show.rating.average ? String(show.rating.average) : '8.0',
                  poster: posterUrl,
                  genre: (show.genres && show.genres.length > 0) ? show.genres.join(', ') : 'Drama',
                  plot: show.summary ? show.summary.replace(/<[^>]*>/g, '').trim() : `Watch ${show.name} in full HD quality.`,
                  director: (show.network && show.network.name) ? show.network.name : 'TV Series',
                  actors: 'Cast',
                  trailer: null
                };
              });
            }
          }
        } catch (liveErr) {
          console.warn('[Live TV Search Warning]:', liveErr.message);
        }
      }

      // 2. Query IMDb auto-suggestion endpoint for live Movies and Series
      let liveImdbResults = [];
      const cleanSlug = query.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanSlug.length >= 2 && (!type || type === 'all' || type === 'movie')) {
        try {
          const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(cleanSlug)}.json`;
          const imdbRes = await fetch(imdbUrl, {
            signal: AbortSignal.timeout(4500),
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          if (imdbRes.ok) {
            const imdbData = await imdbRes.json();
            if (Array.isArray(imdbData.d)) {
              liveImdbResults = imdbData.d
                .filter(x => x.id && x.l && (x.q === 'feature' || x.q === 'TV series' || x.q === 'TV mini-series' || !x.q))
                .slice(0, 8)
                .map(x => {
                  const isTv = x.q === 'TV series' || x.q === 'TV mini-series';
                  const itemType = isTv ? 'series' : 'movie';
                  const poster = x.i?.imageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80';
                  return {
                    id: x.id,
                    title: x.l,
                    year: x.y ? String(x.y) : '',
                    type: itemType,
                    rating: '8.2',
                    poster: poster,
                    genre: isTv ? 'TV Series' : 'Action, Adventure, Drama',
                    plot: `Stream ${x.l} (${x.y || ''}) in high definition with instant peer swarm playback.`,
                    director: isTv ? 'TV Series' : 'Director',
                    actors: x.s || 'Cast',
                    trailer: null
                  };
                });
            }
          }
        } catch (imdbErr) {
          console.warn('[IMDb Live Search Warning]:', imdbErr.message);
        }
      }

      // Merge and deduplicate by id/title
      const combined = [...localMatches];
      [...liveTvResults, ...liveImdbResults].forEach(item => {
        if (!combined.some(c => (item.id && c.id === item.id) || c.title.toLowerCase() === item.title.toLowerCase())) {
          if (!type || type === 'all' || item.type === type) {
            combined.push(item);
          }
        }
      });

      // If nothing found, filter from trending catalog as fallback
      const finalResults = combined.length > 0 ? combined : TRENDING_CATALOG.filter(i => !type || type === 'all' || i.type === type);

      res.json({
        query,
        count: finalResults.length,
        results: finalResults
      });
    } catch (err) {
      console.error('[Media Search Error]:', err);
      res.status(500).json({ error: 'Failed to search media: ' + err.message });
    }
  });

  // Fast in-memory cache for TV series details: key -> { show, seasons, episodes, totalSeasons }
  const tvSeriesCache = new Map();

  async function fetchTvSeriesData(imdbId, title) {
    const cleanImdb = (imdbId || '').trim();
    const cleanTitle = (title || '').trim().replace(/\s*\(\d{4}[–\d]*\)$/, '').trim();
    const cacheKey = cleanImdb || cleanTitle.toLowerCase();

    if (cacheKey && tvSeriesCache.has(cacheKey)) {
      return tvSeriesCache.get(cacheKey);
    }

    let show = null;

    // 1. Try TVMaze IMDb lookup if we have an IMDb ID
    if (cleanImdb && cleanImdb.startsWith('tt')) {
      try {
        const r = await fetch(`https://api.tvmaze.com/lookup/shows?imdb=${encodeURIComponent(cleanImdb)}`, {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'StreamForge/1.0' }
        });
        if (r.ok) show = await r.json();
      } catch (e) {
        console.warn('[TVMaze IMDb lookup warning]:', e.message);
      }
    }

    // 2. Try search by title if IMDb lookup failed or was not provided
    if (!show && cleanTitle) {
      try {
        const r = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(cleanTitle)}`, {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'StreamForge/1.0' }
        });
        if (r.ok) show = await r.json();
      } catch (e) {
        console.warn('[TVMaze title search warning]:', e.message);
      }
    }

    if (!show) return null;

    // 3. Fetch seasons & episodes in parallel
    try {
      const [seasonsRes, episodesRes] = await Promise.all([
        fetch(`https://api.tvmaze.com/shows/${show.id}/seasons`, {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'StreamForge/1.0' }
        }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`https://api.tvmaze.com/shows/${show.id}/episodes`, {
          signal: AbortSignal.timeout(9000),
          headers: { 'User-Agent': 'StreamForge/1.0' }
        }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      const formattedSeasons = Array.isArray(seasonsRes) ? seasonsRes.map(s => {
        const epCount = s.episodeOrder || (Array.isArray(episodesRes) ? episodesRes.filter(e => e.season === s.number).length : 0);
        return {
          number: s.number,
          episodeCount: epCount,
          premiereDate: s.premiereDate || null,
          endDate: s.endDate || null,
          summary: s.summary ? s.summary.replace(/<[^>]*>/g, '').trim() : '',
          image: s.image ? (s.image.medium || s.image.original) : null
        };
      }) : [];

      const validSeasons = formattedSeasons.filter(s => s.number > 0);

      const formattedEpisodes = Array.isArray(episodesRes) ? episodesRes.map(ep => ({
        id: ep.id,
        season: ep.season,
        episode: ep.number,
        title: ep.name || `Episode ${ep.number}`,
        airDate: ep.airdate || null,
        runtime: ep.runtime ? `${ep.runtime} min` : null,
        rating: ep.rating && ep.rating.average ? String(ep.rating.average) : null,
        image: ep.image ? (ep.image.medium || ep.image.original) : null,
        plot: ep.summary ? ep.summary.replace(/<[^>]*>/g, '').trim() : ''
      })) : [];

      const result = {
        showId: show.id,
        title: show.name,
        premiered: show.premiered,
        status: show.status,
        rating: show.rating && show.rating.average ? String(show.rating.average) : null,
        image: show.image ? (show.image.medium || show.image.original) : null,
        seasons: validSeasons,
        totalSeasons: validSeasons.length || 1,
        episodes: formattedEpisodes
      };

      if (cleanImdb) tvSeriesCache.set(cleanImdb, result);
      if (cleanTitle) tvSeriesCache.set(cleanTitle.toLowerCase(), result);
      if (show.name) tvSeriesCache.set(show.name.toLowerCase(), result);

      return result;
    } catch (e) {
      console.warn('[TVMaze detail fetch warning]:', e.message);
      return null;
    }
  }

  // GET /api/media/seasons?imdbId=tt...&title=... — returns exact seasons count and list
  app.get('/api/media/seasons', async (req, res) => {
    const imdbId = (req.query.imdbId || '').trim();
    const title = (req.query.title || '').trim();
    if (!imdbId && !title) return res.status(400).json({ error: 'Missing imdbId or title' });

    try {
      const data = await fetchTvSeriesData(imdbId, title);
      if (data && data.seasons && data.seasons.length > 0) {
        return res.json({
          imdbId,
          title: data.title,
          totalSeasons: data.totalSeasons,
          seasons: data.seasons,
          status: data.status,
          rating: data.rating
        });
      }
    } catch (e) {
      console.warn('[Seasons Fetch Warning]:', e.message);
    }

    // Fallback: return 1 season if not found
    res.json({
      imdbId,
      title: title || '',
      totalSeasons: 1,
      seasons: [{ number: 1, episodeCount: 10 }]
    });
  });

  // GET /api/media/episodes?imdbId=tt...&title=...&season=N — returns exact episodes for a specific season
  app.get('/api/media/episodes', async (req, res) => {
    const imdbId = (req.query.imdbId || '').trim();
    const title = (req.query.title || '').trim();
    const season = parseInt(req.query.season, 10) || 1;
    if (!imdbId && !title) return res.status(400).json({ error: 'Missing imdbId or title' });

    try {
      const data = await fetchTvSeriesData(imdbId, title);
      if (data && Array.isArray(data.episodes)) {
        const seasonEpisodes = data.episodes.filter(ep => ep.season === season);
        if (seasonEpisodes.length > 0) {
          return res.json({
            imdbId,
            title: data.title,
            season,
            totalEpisodes: seasonEpisodes.length,
            episodes: seasonEpisodes
          });
        }
      }
    } catch (e) {
      console.warn('[Episodes Fetch Warning]:', e.message);
    }

    // Fallback: generate placeholder episodes if series not indexed
    const fallbackEps = Array.from({ length: 10 }, (_, i) => ({
      episode: i + 1,
      title: `Episode ${i + 1}`,
      imdbId: null,
      rating: null,
      airDate: null,
      runtime: '45 min',
      image: null,
      plot: `Season ${season}, Episode ${i + 1}`
    }));
    res.json({ imdbId, season, totalEpisodes: fallbackEps.length, episodes: fallbackEps });
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