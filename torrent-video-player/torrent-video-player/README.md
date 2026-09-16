# StreamForge — Sequential Torrent Video Streaming Player

A full-stack Node.js & HTML5 web application that streams video content directly from BitTorrent swarms sequentially in real-time, just like live streaming.

---

## ⚡ How It Works (Sequential Download & Byte-Range Streaming)

Standard BitTorrent downloads pieces of a file out of order (rarest piece first). For live video playback, this application:
1. Prioritizes the **file header** (`moov` atom in MP4 / MKV header) and initial video chunks.
2. Serves video content over an Express HTTP server with support for `HTTP 206 Partial Content` (Range Requests).
3. Communicates dynamically with `WebTorrent` engine so that whenever the HTML5 `<video>` player requests a byte range (`Range: bytes=X-Y`), the backend automatically adjusts WebTorrent's piece priority queue on-the-fly to download that exact chunk next.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ or v18+ recommended)
- `npm` (packaged with Node.js)

### Installation Steps

1. **Unzip** the archive into a folder of your choice.
2. Open a terminal / command prompt in that folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *For auto-reloading development server:*
   ```bash
   npm run dev
   ```

5. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 💻 Features

- **Sequential Torrent Streaming:** Start watching within seconds of loading a magnet link or `.torrent` file.
- **Modern Responsive Web UI:** Sleek, glassmorphic dark theme built for desktop, tablet, or Smart TV browsers.
- **Live Torrent Swarm Metrics:** Real-time metrics for download speed, upload speed, connected peers, and piece buffering percentage.
- **Multi-file Support:** Select any video episode/file inside multi-file torrents (e.g., TV season torrents).
- **Drag & Drop Uploads:** Upload local `.torrent` files or paste magnet links.
- **Keyboard Shortcuts:** Built-in controls for play/pause, seeking, volume adjustment, and full-screen mode.
- **Sample Magnets Included:** Test instantly with open-source movie torrents (*Sintel*, *Big Buck Bunny*).

---

## 📁 Project Structure

```
torrent-video-player/
├── server.js            # Express & WebTorrent streaming backend
├── package.json         # Dependencies & project scripts
├── README.md            # Documentation
├── start.sh             # Launch script for Linux / macOS
├── start.bat            # Launch script for Windows
└── public/              # Web Frontend UI
    ├── index.html       # HTML5 App Interface
    ├── style.css        # Modern CSS styles & animations
    └── app.js           # Client-side streaming & metrics logic
```

---

## 💡 Codec & Browser Compatibility Notes

- Browsers natively support **MP4 (H.264 + AAC/MP3)** and **WebM (VP8/VP9 + Opus/Vorbis)**.
- For **MKV** or **AVI** files with non-native audio codecs (e.g. AC3/DTS), Chrome or Edge will stream if video is H.264, but if audio codec is unsupported, use browsers like Safari or launch VLC media player with the stream URL:
  `http://localhost:3000/api/torrent/stream?torrent=<MAGNET>&fileIndex=0`

---

## 📜 License
MIT License
