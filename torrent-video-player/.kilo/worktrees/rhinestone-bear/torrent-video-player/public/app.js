document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons for general UI
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- Core DOM Elements ---
  const torrentForm = document.getElementById('torrentForm');
  const magnetInput = document.getElementById('magnetInput');
  const torrentFileInput = document.getElementById('torrentFileInput');
  const dropzone = document.getElementById('dropzone');
  const sampleBtns = document.querySelectorAll('.btn-sample');

  const loadingState = document.getElementById('loadingState');
  const loadingTitle = document.getElementById('loadingTitle');
  const loadingMessage = document.getElementById('loadingMessage');

  const playerSection = document.getElementById('playerSection');
  const ytPlayerContainer = document.getElementById('ytPlayerContainer');
  const videoPlayer = document.getElementById('videoPlayer');

  // YouTube Bezel & Seek Ripples & Spinner
  const ytBezel = document.getElementById('ytBezel');
  const ytBezelIcon = document.getElementById('ytBezelIcon');
  const bezelPlay = ytBezelIcon ? ytBezelIcon.querySelector('.bezel-play') : null;
  const bezelPause = ytBezelIcon ? ytBezelIcon.querySelector('.bezel-pause') : null;
  const ytSeekLeft = document.getElementById('ytSeekLeft');
  const ytSeekRight = document.getElementById('ytSeekRight');
  const ytSpinner = document.getElementById('ytSpinner');

  // YouTube Volume HUD
  const ytVolumeHud = document.getElementById('ytVolumeHud');
  const ytVolumeHudFill = document.getElementById('ytVolumeHudFill');
  const ytVolumeHudText = document.getElementById('ytVolumeHudText');

  // YouTube Scrubber Elements
  const ytProgressBarContainer = document.getElementById('ytProgressBarContainer');
  const ytProgressBar = document.getElementById('ytProgressBar');
  const ytProgressLoad = document.getElementById('ytProgressLoad');
  const ytProgressHover = document.getElementById('ytProgressHover');
  const ytProgressPlay = document.getElementById('ytProgressPlay');
  const ytScrubberThumb = document.getElementById('ytScrubberThumb');
  const ytTimeTooltip = document.getElementById('ytTimeTooltip');

  // YouTube Control Buttons
  const btnPlayPause = document.getElementById('btnPlayPause');
  const iconPlay = btnPlayPause.querySelector('.yt-icon-play');
  const iconPause = btnPlayPause.querySelector('.yt-icon-pause');
  const btnNextFile = document.getElementById('btnNextFile');

  const btnMute = document.getElementById('btnMute');
  const volHighIcon = btnMute.querySelector('.yt-vol-high');
  const volLowIcon = btnMute.querySelector('.yt-vol-low');
  const volMutedIcon = btnMute.querySelector('.yt-vol-muted');
  const ytVolumeControl = document.getElementById('ytVolumeControl');
  const ytVolumeSlider = document.getElementById('ytVolumeSlider');

  const currentTimeDisplay = document.getElementById('currentTime');
  const durationTimeDisplay = document.getElementById('durationTime');

  const btnAutoplay = document.getElementById('btnAutoplay');
  const autoplaySwitchTrack = document.getElementById('autoplaySwitchTrack');
  const btnSubtitles = document.getElementById('btnSubtitles');
  const btnSettings = document.getElementById('btnSettings');
  const btnMiniplayer = document.getElementById('btnMiniplayer');
  const btnTheater = document.getElementById('btnTheater');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const fsEnterIcon = btnFullscreen.querySelector('.yt-icon-fs-enter');
  const fsExitIcon = btnFullscreen.querySelector('.yt-icon-fs-exit');

  // Settings Menu Elements
  const ytSettingsMenu = document.getElementById('ytSettingsMenu');
  const ytSettingsMain = document.getElementById('ytSettingsMain');
  const ytSettingsSpeed = document.getElementById('ytSettingsSpeed');
  const btnMenuSpeed = document.getElementById('btnMenuSpeed');
  const btnMenuLoop = document.getElementById('btnMenuLoop');
  const btnMenuNerds = document.getElementById('btnMenuNerds');
  const btnSpeedBack = document.getElementById('btnSpeedBack');
  const currentSpeedLabel = document.getElementById('currentSpeedLabel');
  const loopLabel = document.getElementById('loopLabel');
  const nerdLabel = document.getElementById('nerdLabel');
  const speedItems = document.querySelectorAll('.yt-speed-item');

  // Custom Context Menu & Nerd Stats
  const ytContextMenu = document.getElementById('ytContextMenu');
  const ctxLoop = document.getElementById('ctxLoop');
  const ctxCopyUrl = document.getElementById('ctxCopyUrl');
  const ctxCopyDebug = document.getElementById('ctxCopyDebug');
  const ctxNerds = document.getElementById('ctxNerds');
  const ytNerdStats = document.getElementById('ytNerdStats');
  const btnNerdClose = document.getElementById('btnNerdClose');

  const nerdInfoHash = document.getElementById('nerdInfoHash');
  const nerdResolution = document.getElementById('nerdResolution');
  const nerdVolume = document.getElementById('nerdVolume');
  const nerdBuffer = document.getElementById('nerdBuffer');
  const nerdNetwork = document.getElementById('nerdNetwork');
  const nerdFrames = document.getElementById('nerdFrames');
  const nerdPeers = document.getElementById('nerdPeers');

  // Video Info & Details Elements
  const torrentNameDisplay = document.getElementById('torrentNameDisplay');
  const torrentSizeDisplay = document.getElementById('torrentSizeDisplay');
  const peerCountText = document.getElementById('peerCountText');
  const dlSpeedText = document.getElementById('dlSpeedText');
  const ulSpeedText = document.getElementById('ulSpeedText');
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');
  const downloadedAmount = document.getElementById('downloadedAmount');
  const ytStreamStatus = document.getElementById('ytStreamStatus');

  const fileSelect = document.getElementById('fileSelect');
  const fileList = document.getElementById('fileList');
  const fileCountBadge = document.getElementById('fileCountBadge');

  const btnLike = document.getElementById('btnLike');
  const likeCount = document.getElementById('likeCount');
  const btnDislike = document.getElementById('btnDislike');
  const btnShare = document.getElementById('btnShare');
  const btnCloseVideo = document.getElementById('btnCloseVideo');

  // Shortcuts Modal
  const btnShortcuts = document.getElementById('btnShortcuts');
  const shortcutsModal = document.getElementById('shortcutsModal');
  const btnCloseModal = document.getElementById('btnCloseModal');

  // --- Browser WebTorrent Client (WebRTC Trackers) ---
  const WEB_TRACKERS = [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.webtorrent.dev',
    'wss://tracker.files.fm:7073/announce',
    'wss://spug.net:443/announce',
    'wss://tracker.btorrent.xyz'
  ];

  let wtClient = null;

  function getWtClient() {
    if (!wtClient) {
      wtClient = new WebTorrent();
      wtClient.on('error', (err) => console.error('[WebTorrent]', err.message));
    }
    return wtClient;
  }

  // State
  let currentTorrent = null;  // metadata object { name, infoHash, files, ... }
  let activeTorrent = null;   // live WebTorrent torrent instance
  let activeFile = null;      // currently streaming file object
  let statsInterval = null;
  let nerdInterval = null;
  let isScrubbing = false;
  let wasPlayingBeforeScrub = false;
  let controlsHideTimeout = null;
  let clickTimer = null;
  let volumeHudTimeout = null;
  let isAutoplay = true;
  let isLiked = false;
  let isDisliked = false;
  let lastVolume = 1;
  let latestStats = {
    downloadSpeed: 0,
    uploadSpeed: 0,
    formattedDownloadSpeed: '0 B/s',
    formattedUploadSpeed: '0 B/s',
    numPeers: 0
  };

  // --- YouTube Time Formatter ---
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const s = Math.floor(seconds % 60);
    const m = Math.floor((seconds / 60) % 60);
    const h = Math.floor(seconds / 3600);

    const sStr = s < 10 ? '0' + s : String(s);
    if (h > 0) {
      const mStr = m < 10 ? '0' + m : String(m);
      return `${h}:${mStr}:${sStr}`;
    }
    return `${m}:${sStr}`;
  }

  // --- YouTube Bezel Ripple (Center Play/Pause Pulse) ---
  let bezelTimeout = null;
  function triggerBezel(type) {
    if (!ytBezel) return;
    if (type === 'play') {
      bezelPlay.classList.remove('hidden');
      bezelPause.classList.add('hidden');
    } else {
      bezelPlay.classList.add('hidden');
      bezelPause.classList.remove('hidden');
    }
    ytBezel.classList.remove('animate');
    void ytBezel.offsetWidth; // force reflow
    ytBezel.classList.add('animate');

    if (bezelTimeout) clearTimeout(bezelTimeout);
    bezelTimeout = setTimeout(() => {
      ytBezel.classList.remove('animate');
    }, 450);
  }

  // --- YouTube Double Click Seek Ripple ---
  let seekRippleTimeout = null;
  function triggerSeekRipple(direction) {
    const el = direction === 'left' ? ytSeekLeft : ytSeekRight;
    if (!el) return;
    el.classList.remove('active');
    void el.offsetWidth;
    el.classList.add('active');

    if (seekRippleTimeout) clearTimeout(seekRippleTimeout);
    seekRippleTimeout = setTimeout(() => {
      if (ytSeekLeft) ytSeekLeft.classList.remove('active');
      if (ytSeekRight) ytSeekRight.classList.remove('active');
    }, 650);
  }

  // --- YouTube On-Screen Volume HUD ---
  function showVolumeHud(vol) {
    if (!ytVolumeHud) return;
    const pct = Math.round(vol * 100);
    ytVolumeHudFill.style.width = pct + '%';
    ytVolumeHudText.textContent = pct + '%';
    ytVolumeHud.classList.remove('hidden');

    if (volumeHudTimeout) clearTimeout(volumeHudTimeout);
    volumeHudTimeout = setTimeout(() => {
      ytVolumeHud.classList.add('hidden');
    }, 1200);
  }

  // --- Play / Pause Control ---
  function togglePlay() {
    if (videoPlayer.paused || videoPlayer.ended) {
      videoPlayer.play().then(() => {
        triggerBezel('play');
      }).catch(err => console.warn('Play error:', err));
    } else {
      videoPlayer.pause();
      triggerBezel('pause');
    }
  }

  function updatePlayBtnUI() {
    if (videoPlayer.paused) {
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
      btnPlayPause.setAttribute('title', 'Play (k)');
      btnPlayPause.setAttribute('aria-label', 'Play');
      showControls();
    } else {
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
      btnPlayPause.setAttribute('title', 'Pause (k)');
      btnPlayPause.setAttribute('aria-label', 'Pause');
      resetControlsTimer();
    }
  }

  btnPlayPause.addEventListener('click', togglePlay);
  videoPlayer.addEventListener('play', updatePlayBtnUI);
  videoPlayer.addEventListener('pause', updatePlayBtnUI);

  // --- Video Screen Click & Double Click Handling ---
  ytPlayerContainer.addEventListener('click', (e) => {
    // Prevent click on controls bar, context menu, or settings from triggering play toggle
    if (
      e.target.closest('.yt-controls') ||
      e.target.closest('.yt-settings-menu') ||
      e.target.closest('.yt-context-menu') ||
      e.target.closest('.yt-nerd-stats')
    ) {
      return;
    }

    // Close open menus on video screen click
    closeAllMenus();

    if (clickTimer === null) {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        togglePlay();
      }, 250);
    }
  });

  ytPlayerContainer.addEventListener('dblclick', (e) => {
    if (
      e.target.closest('.yt-controls') ||
      e.target.closest('.yt-settings-menu') ||
      e.target.closest('.yt-context-menu') ||
      e.target.closest('.yt-nerd-stats')
    ) {
      return;
    }

    if (clickTimer !== null) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }

    const rect = ytPlayerContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    if (clickX < rect.width * 0.45) {
      // Seek backward 10s
      videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
      triggerSeekRipple('left');
    } else if (clickX > rect.width * 0.55) {
      // Seek forward 10s
      videoPlayer.currentTime = Math.min(videoPlayer.duration || 0, videoPlayer.currentTime + 10);
      triggerSeekRipple('right');
    } else {
      // Center double click -> toggle fullscreen
      toggleFullscreen();
    }
  });

  // --- Video Buffering & Waiting Indicators ---
  videoPlayer.addEventListener('waiting', () => {
    ytSpinner.classList.remove('hidden');
  });

  videoPlayer.addEventListener('playing', () => {
    ytSpinner.classList.add('hidden');
  });

  videoPlayer.addEventListener('canplay', () => {
    ytSpinner.classList.add('hidden');
  });

  // --- YouTube Timeline Scrubber Mechanics ---
  function updateTimeDisplay() {
    currentTimeDisplay.textContent = formatTime(videoPlayer.currentTime);
    durationTimeDisplay.textContent = formatTime(videoPlayer.duration || 0);

    if (!isScrubbing && videoPlayer.duration) {
      const pct = (videoPlayer.currentTime / videoPlayer.duration) * 100;
      ytProgressPlay.style.width = pct + '%';
      ytScrubberThumb.style.left = pct + '%';
    }
    updateBufferProgress();
  }

  function updateBufferProgress() {
    if (!videoPlayer.duration || !videoPlayer.buffered.length) {
      ytProgressLoad.style.width = '0%';
      return;
    }

    const current = videoPlayer.currentTime;
    let bufferEnd = 0;
    for (let i = 0; i < videoPlayer.buffered.length; i++) {
      if (videoPlayer.buffered.start(i) <= current && current <= videoPlayer.buffered.end(i)) {
        bufferEnd = videoPlayer.buffered.end(i);
        break;
      }
    }
    if (bufferEnd === 0 && videoPlayer.buffered.length > 0) {
      bufferEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
    }

    const pct = Math.min(100, (bufferEnd / videoPlayer.duration) * 100);
    ytProgressLoad.style.width = pct + '%';
  }

  videoPlayer.addEventListener('timeupdate', updateTimeDisplay);
  videoPlayer.addEventListener('loadedmetadata', updateTimeDisplay);
  videoPlayer.addEventListener('progress', updateBufferProgress);

  // Scrubber Hover & Seeking
  function getScrubberFraction(e) {
    const rect = ytProgressBarContainer.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    return { fraction: offsetX / rect.width, offsetX, width: rect.width };
  }

  ytProgressBarContainer.addEventListener('mousemove', (e) => {
    const { fraction, offsetX } = getScrubberFraction(e);
    ytProgressHover.style.width = (fraction * 100) + '%';

    if (videoPlayer.duration) {
      const hoverTime = fraction * videoPlayer.duration;
      ytTimeTooltip.textContent = formatTime(hoverTime);
      ytTimeTooltip.style.left = offsetX + 'px';
    }
  });

  ytProgressBarContainer.addEventListener('mouseleave', () => {
    if (!isScrubbing) {
      ytProgressHover.style.width = '0%';
    }
  });

  ytProgressBarContainer.addEventListener('mousedown', (e) => {
    isScrubbing = true;
    wasPlayingBeforeScrub = !videoPlayer.paused;
    if (wasPlayingBeforeScrub) videoPlayer.pause();

    ytProgressBarContainer.classList.add('scrubbing');
    const { fraction } = getScrubberFraction(e);
    applyScrub(fraction);

    document.addEventListener('mousemove', onScrubMove);
    document.addEventListener('mouseup', onScrubEnd);
  });

  function onScrubMove(e) {
    if (!isScrubbing) return;
    const { fraction, offsetX } = getScrubberFraction(e);
    applyScrub(fraction);
    if (videoPlayer.duration) {
      ytTimeTooltip.textContent = formatTime(fraction * videoPlayer.duration);
      ytTimeTooltip.style.left = offsetX + 'px';
    }
  }

  function applyScrub(fraction) {
    if (!videoPlayer.duration) return;
    const seekTo = fraction * videoPlayer.duration;
    videoPlayer.currentTime = seekTo;
    const pct = fraction * 100;
    ytProgressPlay.style.width = pct + '%';
    ytScrubberThumb.style.left = pct + '%';
  }

  function onScrubEnd() {
    if (!isScrubbing) return;
    isScrubbing = false;
    ytProgressBarContainer.classList.remove('scrubbing');
    document.removeEventListener('mousemove', onScrubMove);
    document.removeEventListener('mouseup', onScrubEnd);

    if (wasPlayingBeforeScrub) {
      videoPlayer.play().catch(() => {});
    }
  }

  // --- Volume Slider & Mute ---
  function updateVolumeUI() {
    const isMuted = videoPlayer.muted || videoPlayer.volume === 0;
    ytVolumeSlider.value = isMuted ? 0 : videoPlayer.volume;

    volHighIcon.classList.add('hidden');
    volLowIcon.classList.add('hidden');
    volMutedIcon.classList.add('hidden');

    if (isMuted) {
      volMutedIcon.classList.remove('hidden');
      btnMute.setAttribute('title', 'Unmute (m)');
      btnMute.setAttribute('aria-label', 'Unmute');
    } else if (videoPlayer.volume < 0.5) {
      volLowIcon.classList.remove('hidden');
      btnMute.setAttribute('title', 'Mute (m)');
      btnMute.setAttribute('aria-label', 'Mute');
    } else {
      volHighIcon.classList.remove('hidden');
      btnMute.setAttribute('title', 'Mute (m)');
      btnMute.setAttribute('aria-label', 'Mute');
    }
  }

  ytVolumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    videoPlayer.volume = val;
    videoPlayer.muted = (val === 0);
    if (val > 0) lastVolume = val;
    updateVolumeUI();
    showVolumeHud(val);
  });

  btnMute.addEventListener('click', () => {
    if (videoPlayer.muted || videoPlayer.volume === 0) {
      videoPlayer.muted = false;
      videoPlayer.volume = lastVolume > 0 ? lastVolume : 1;
    } else {
      lastVolume = videoPlayer.volume;
      videoPlayer.muted = true;
    }
    updateVolumeUI();
    showVolumeHud(videoPlayer.muted ? 0 : videoPlayer.volume);
  });

  // --- Autoplay Toggle ---
  btnAutoplay.addEventListener('click', () => {
    isAutoplay = !isAutoplay;
    autoplaySwitchTrack.classList.toggle('active', isAutoplay);
    btnAutoplay.setAttribute('title', isAutoplay ? 'Autoplay is on' : 'Autoplay is off');
  });

  // When video ends, automatically play next file if Autoplay is on
  videoPlayer.addEventListener('ended', () => {
    if (isAutoplay && currentTorrent && currentTorrent.files.length > 1) {
      playNextFile();
    }
  });

  // Next file button
  btnNextFile.addEventListener('click', playNextFile);

  function playNextFile() {
    if (!currentTorrent || !currentTorrent.files.length) return;
    const currentIdx = parseInt(fileSelect.value, 10);
    const files = currentTorrent.files;

    let currentIndexInList = files.findIndex(f => (f.index != null ? f.index : f.id) === currentIdx);
    if (currentIndexInList === -1) currentIndexInList = 0;

    const nextIndexInList = (currentIndexInList + 1) % files.length;
    const nextFile = files[nextIndexInList];
    const nextFileIdx = nextFile.index != null ? nextFile.index : nextFile.id;

    fileSelect.value = nextFileIdx;
    switchFileStream(currentTorrent.infoHash, nextFileIdx);
    updateActiveFileUI(nextFileIdx);
  }

  // --- Theater Mode ---
  btnTheater.addEventListener('click', toggleTheaterMode);

  function toggleTheaterMode() {
    playerSection.classList.toggle('theater-mode');
    const isTheater = playerSection.classList.contains('theater-mode');
    btnTheater.setAttribute('title', isTheater ? 'Default view (t)' : 'Theater mode (t)');
  }

  // --- Fullscreen Toggle ---
  btnFullscreen.addEventListener('click', toggleFullscreen);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (ytPlayerContainer.requestFullscreen) {
        ytPlayerContainer.requestFullscreen();
      } else if (ytPlayerContainer.webkitRequestFullscreen) {
        ytPlayerContainer.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    if (isFs) {
      fsEnterIcon.classList.add('hidden');
      fsExitIcon.classList.remove('hidden');
      btnFullscreen.setAttribute('title', 'Exit full screen (f)');
    } else {
      fsEnterIcon.classList.remove('hidden');
      fsExitIcon.classList.add('hidden');
      btnFullscreen.setAttribute('title', 'Full screen (f)');
    }
  });

  // --- Picture-in-Picture (Miniplayer) ---
  btnMiniplayer.addEventListener('click', async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoPlayer.requestPictureInPicture) {
        await videoPlayer.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP not available:', err);
    }
  });

  // --- YouTube Settings Menu Popover ---
  btnSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    ytSettingsMenu.classList.toggle('hidden');
    ytContextMenu.classList.add('hidden');
    // Reset to main panel
    ytSettingsMain.classList.remove('hidden');
    ytSettingsSpeed.classList.add('hidden');
  });

  btnMenuSpeed.addEventListener('click', (e) => {
    e.stopPropagation();
    ytSettingsMain.classList.add('hidden');
    ytSettingsSpeed.classList.remove('hidden');
  });

  btnSpeedBack.addEventListener('click', (e) => {
    e.stopPropagation();
    ytSettingsSpeed.classList.add('hidden');
    ytSettingsMain.classList.remove('hidden');
  });

  speedItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const speed = parseFloat(item.dataset.speed);
      videoPlayer.playbackRate = speed;

      speedItems.forEach(si => si.classList.remove('active'));
      item.classList.add('active');

      currentSpeedLabel.textContent = speed === 1 ? 'Normal' : speed + 'x';
      ytSettingsSpeed.classList.add('hidden');
      ytSettingsMain.classList.remove('hidden');
    });
  });

  btnMenuLoop.addEventListener('click', (e) => {
    e.stopPropagation();
    videoPlayer.loop = !videoPlayer.loop;
    loopLabel.textContent = videoPlayer.loop ? 'On' : 'Off';
  });

  btnMenuNerds.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNerdStats();
    ytSettingsMenu.classList.add('hidden');
  });

  // --- YouTube Stats for Nerds ---
  function toggleNerdStats() {
    ytNerdStats.classList.toggle('hidden');
    const isOpen = !ytNerdStats.classList.contains('hidden');
    nerdLabel.textContent = isOpen ? 'On' : 'Off';

    if (isOpen) {
      updateNerdStatsDisplay();
      if (!nerdInterval) {
        nerdInterval = setInterval(updateNerdStatsDisplay, 1000);
      }
    } else {
      if (nerdInterval) {
        clearInterval(nerdInterval);
        nerdInterval = null;
      }
    }
  }

  btnNerdClose.addEventListener('click', () => {
    ytNerdStats.classList.add('hidden');
    nerdLabel.textContent = 'Off';
    if (nerdInterval) {
      clearInterval(nerdInterval);
      nerdInterval = null;
    }
  });

  function updateNerdStatsDisplay() {
    if (ytNerdStats.classList.contains('hidden')) return;

    nerdInfoHash.textContent = currentTorrent ? currentTorrent.infoHash.substring(0, 16) + '...' : '--';
    nerdResolution.textContent = `${videoPlayer.videoWidth || 0}x${videoPlayer.videoHeight || 0}@${videoPlayer.playbackRate}x`;
    nerdVolume.textContent = `${Math.round((videoPlayer.muted ? 0 : videoPlayer.volume) * 100)}%`;

    // Buffer length calculation
    let bufferHealth = 0;
    const cur = videoPlayer.currentTime;
    for (let i = 0; i < videoPlayer.buffered.length; i++) {
      if (videoPlayer.buffered.start(i) <= cur && cur <= videoPlayer.buffered.end(i)) {
        bufferHealth = videoPlayer.buffered.end(i) - cur;
        break;
      }
    }
    nerdBuffer.textContent = bufferHealth.toFixed(2) + ' s';
    nerdNetwork.textContent = latestStats.formattedDownloadSpeed || '0 B/s';

    // Dropped frames
    if (videoPlayer.getVideoPlaybackQuality) {
      const q = videoPlayer.getVideoPlaybackQuality();
      nerdFrames.textContent = `${q.droppedVideoFrames} / ${q.totalVideoFrames}`;
    } else {
      nerdFrames.textContent = '0 / 0';
    }

    nerdPeers.textContent = latestStats.numPeers || '0';
  }

  // --- YouTube Custom Context Menu ---
  ytPlayerContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = ytPlayerContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ytContextMenu.style.left = `${Math.min(x, rect.width - 200)}px`;
    ytContextMenu.style.top = `${Math.min(y, rect.height - 160)}px`;
    ytContextMenu.classList.remove('hidden');
    ytSettingsMenu.classList.add('hidden');
  });

  ctxLoop.addEventListener('click', () => {
    videoPlayer.loop = !videoPlayer.loop;
    loopLabel.textContent = videoPlayer.loop ? 'On' : 'Off';
    ytContextMenu.classList.add('hidden');
  });

  ctxCopyUrl.addEventListener('click', () => {
    if (videoPlayer.src) {
      const url = `${window.location.origin}${videoPlayer.getAttribute('src')}#t=${Math.floor(videoPlayer.currentTime)}`;
      navigator.clipboard.writeText(url).then(() => alert('Copied video URL to clipboard!'));
    }
    ytContextMenu.classList.add('hidden');
  });

  ctxCopyDebug.addEventListener('click', () => {
    const debugInfo = {
      infoHash: currentTorrent ? currentTorrent.infoHash : null,
      currentTime: videoPlayer.currentTime,
      duration: videoPlayer.duration,
      resolution: `${videoPlayer.videoWidth}x${videoPlayer.videoHeight}`,
      playbackRate: videoPlayer.playbackRate,
      volume: videoPlayer.volume,
      muted: videoPlayer.muted,
      stats: latestStats,
      userAgent: navigator.userAgent
    };
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2)).then(() => alert('Copied debug info to clipboard!'));
    ytContextMenu.classList.add('hidden');
  });

  ctxNerds.addEventListener('click', () => {
    toggleNerdStats();
    ytContextMenu.classList.add('hidden');
  });

  function closeAllMenus() {
    if (ytSettingsMenu) ytSettingsMenu.classList.add('hidden');
    if (ytContextMenu) ytContextMenu.classList.add('hidden');
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#ytSettingsMenu') && !e.target.closest('#btnSettings')) {
      if (ytSettingsMenu) ytSettingsMenu.classList.add('hidden');
    }
    if (!e.target.closest('#ytContextMenu')) {
      if (ytContextMenu) ytContextMenu.classList.add('hidden');
    }
  });

  // --- Auto-Hide Controls on Mouse Inactivity ---
  function showControls() {
    ytPlayerContainer.classList.remove('yt-hide-controls');
  }

  function resetControlsTimer() {
    showControls();
    if (controlsHideTimeout) clearTimeout(controlsHideTimeout);

    // Only hide if video is playing and user isn't actively interacting with settings/menus
    if (!videoPlayer.paused && ytSettingsMenu.classList.contains('hidden') && ytContextMenu.classList.contains('hidden')) {
      controlsHideTimeout = setTimeout(() => {
        if (!videoPlayer.paused) {
          ytPlayerContainer.classList.add('yt-hide-controls');
        }
      }, 2500);
    }
  }

  ytPlayerContainer.addEventListener('mousemove', resetControlsTimer);
  ytPlayerContainer.addEventListener('mouseleave', () => {
    if (!videoPlayer.paused) {
      ytPlayerContainer.classList.add('yt-hide-controls');
    }
  });

  // --- Like, Dislike & Share Actions ---
  btnLike.addEventListener('click', () => {
    isLiked = !isLiked;
    if (isLiked) isDisliked = false;
    btnLike.style.color = isLiked ? '#3ea6ff' : '#f1f1f1';
    btnDislike.style.color = '#f1f1f1';
    likeCount.textContent = isLiked ? '1.5K' : '1.4K';
  });

  btnDislike.addEventListener('click', () => {
    isDisliked = !isDisliked;
    if (isDisliked) isLiked = false;
    btnDislike.style.color = isDisliked ? '#3ea6ff' : '#f1f1f1';
    btnLike.style.color = '#f1f1f1';
    likeCount.textContent = '1.4K';
  });

  btnShare.addEventListener('click', () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  });

  // --- Subtitles / CC Notification ---
  btnSubtitles.addEventListener('click', () => {
    alert('Subtitles / Closed Captions: Embedded torrent subtitle tracks will be rendered when present.');
  });

  // --- Form & Torrent Loading ---
  torrentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const magnet = magnetInput.value.trim();
    if (magnet) loadTorrent(magnet);
  });

  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const magnet = btn.getAttribute('data-magnet');
      magnetInput.value = magnet;
      loadTorrent(magnet);
    });
  });

  torrentFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) uploadTorrentFile(e.target.files[0]);
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--primary)';
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    if (e.dataTransfer.files.length > 0) uploadTorrentFile(e.dataTransfer.files[0]);
  });


  // --- Read a .torrent file as ArrayBuffer and stream in the browser ---
  function uploadTorrentFile(file) {
    showLoading('Reading .torrent file...', 'Initializing WebTorrent stream in your browser...');
    playerSection.classList.add('hidden');
    stopStatsPolling();
    destroyActiveTorrent();

    const reader = new FileReader();
    reader.onload = (e) => {
      startBrowserTorrent(e.target.result);
    };
    reader.onerror = () => {
      alert('Failed to read .torrent file.');
      hideLoading();
    };
    reader.readAsArrayBuffer(file);
  }

  // --- Load and Stream Torrent in Browser ---
  async function loadTorrent(torrentId) {
    showLoading('Starting Browser Stream...', 'Connecting to WebTorrent swarm...');
    playerSection.classList.add('hidden');
    stopStatsPolling();
    destroyActiveTorrent();

    let input = String(torrentId)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    if (/^[a-fA-F0-9]{40}$/.test(input) || /^[a-zA-Z2-7]{32}$/.test(input)) {
      input = 'magnet:?xt=urn:btih:' + input;
    }

    // Step 1: Pre-fetch torrent metadata buffer for instant 0-second browser startup
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`/api/torrent/file?torrent=${encodeURIComponent(input)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const torrentBuffer = await res.arrayBuffer();
        startBrowserTorrent(torrentBuffer);
        return;
      }
    } catch (e) {
      console.log('[WebTorrent] Pre-fetch skipped, connecting to browser trackers directly:', e.message);
    }

    // Step 2: Fallback to direct magnet URI with all WebRTC trackers
    let browserInput = input;
    if (browserInput.startsWith('magnet:')) {
      WEB_TRACKERS.forEach(tr => {
        if (!browserInput.includes(encodeURIComponent(tr))) {
          browserInput += '&tr=' + encodeURIComponent(tr);
        }
      });
    }

    startBrowserTorrent(browserInput);
  }

  // --- Core: add torrent to browser WebTorrent client ---
  function startBrowserTorrent(torrentInput) {
    const client = getWtClient();
    const opts = { announce: WEB_TRACKERS };

    let torrent;
    try {
      torrent = client.add(torrentInput, opts);
    } catch (err) {
      console.error('[WebTorrent Add Error]:', err);
      alert('Error adding torrent to browser: ' + err.message);
      hideLoading();
      return;
    }

    activeTorrent = torrent;

    // Attach local WebSeed so all standard public swarms download directly into the browser
    const setupWebSeed = () => {
      if (torrent.infoHash) {
        try {
          const webSeedUrl = `${window.location.origin}/api/webseed/${torrent.infoHash}/`;
          torrent.addWebSeed(webSeedUrl);
        } catch (e) {}
      }
    };
    setupWebSeed();

    const metadataTimeout = setTimeout(() => {
      alert('Could not find active peers for this torrent. Try another torrent with more seeders.');
      hideLoading();
    }, 45000);

    torrent.on('error', (err) => {
      clearTimeout(metadataTimeout);
      console.error('[Browser WebTorrent Error]:', err.message);
      alert('Browser WebTorrent Error: ' + err.message);
      hideLoading();
    });

    const onTorrentMetadataReady = () => {
      clearTimeout(metadataTimeout);
      setupWebSeed();

      const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg', '.ts', '.ogv'];

      let defaultFileIndex = 0;
      let maxVideoSize = 0;

      const enrichedFiles = torrent.files.map((file, index) => {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const isVideo = VIDEO_EXTENSIONS.includes(ext);
        if (isVideo && file.length > maxVideoSize) {
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
          isVideo
        };
      });

      const totalSize = enrichedFiles.reduce((s, f) => s + f.length, 0);

      currentTorrent = {
        name: torrent.name || 'Unknown Torrent',
        infoHash: torrent.infoHash,
        formattedTotalSize: formatBytes(totalSize),
        defaultFileIndex,
        files: enrichedFiles
      };

      renderTorrentData(currentTorrent);
      hideLoading();
      playerSection.classList.remove('hidden');
      startStatsPolling();
    };

    if (torrent.metadata) {
      onTorrentMetadataReady();
    } else {
      torrent.on('metadata', onTorrentMetadataReady);
      torrent.on('ready', onTorrentMetadataReady);
    }
  }

  // --- Render Torrent Data & YouTube Playlist Queue ---
  function renderTorrentData(torrentData) {
    torrentNameDisplay.textContent = torrentData.name || 'Torrent Stream';
    torrentSizeDisplay.textContent = torrentData.formattedTotalSize || '';
    fileCountBadge.textContent = `${torrentData.files.length} file${torrentData.files.length > 1 ? 's' : ''}`;

    const infoHash = torrentData.infoHash;
    const defaultIdx = torrentData.defaultFileIndex || 0;

    fileSelect.innerHTML = '';
    fileList.innerHTML = '';

    torrentData.files.forEach((file, listIdx) => {
      const fileIdx = file.index != null ? file.index : file.id;

      // Dropdown option
      const option = document.createElement('option');
      option.value = fileIdx;
      option.textContent = `${file.name} (${file.formattedSize || formatBytes(file.length)})`;
      if (fileIdx === defaultIdx) option.selected = true;
      fileSelect.appendChild(option);

      // YouTube Playlist Queue Item
      const li = document.createElement('li');
      li.className = `yt-queue-item ${fileIdx === defaultIdx ? 'active' : ''}`;
      li.innerHTML = `
        <div class="yt-queue-thumb">
          <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
        </div>
        <div class="yt-queue-info">
          <span class="yt-queue-title" title="${file.name}">${file.name}</span>
          <span class="yt-queue-size">${file.formattedSize || formatBytes(file.length)}</span>
        </div>
      `;
      li.addEventListener('click', () => {
        fileSelect.value = fileIdx;
        switchFileStream(infoHash, fileIdx);
        updateActiveFileUI(fileIdx);
      });
      fileList.appendChild(li);
    });

    fileSelect.onchange = (e) => {
      const fileIdx = parseInt(e.target.value, 10);
      switchFileStream(infoHash, fileIdx);
      updateActiveFileUI(fileIdx);
    };

    switchFileStream(infoHash, defaultIdx);
    if (window.lucide) lucide.createIcons();
  }

  function switchFileStream(infoHash, fileIndex) {
    if (!activeTorrent) {
      console.warn('No active torrent to stream from in browser.');
      return;
    }

    const file = activeTorrent.files[fileIndex];
    if (!file) {
      console.warn('File index not found:', fileIndex);
      return;
    }

    // Deselect all files, then prioritise only the chosen one in browser
    activeTorrent.files.forEach(f => f.deselect());
    file.select();
    activeFile = file;

    // Revoke any previous blob URL to free memory
    if (videoPlayer._blobUrl) {
      URL.revokeObjectURL(videoPlayer._blobUrl);
      videoPlayer._blobUrl = null;
    }

    // Reset video element
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();

    // Stream directly into HTML5 video via browser MSE
    file.renderTo(videoPlayer, { autoplay: true }, (err) => {
      if (err) {
        console.warn('renderTo failed, falling back to getBlobURL:', err.message);
        file.getBlobURL((blobErr, url) => {
          if (!blobErr && url) {
            videoPlayer._blobUrl = url;
            videoPlayer.src = url;
            videoPlayer.play().catch(() => {});
          }
        });
      }
    });
  }

  function updateActiveFileUI(selectedIndex) {
    const items = fileList.querySelectorAll('.yt-queue-item');
    items.forEach((item, idx) => {
      if (currentTorrent && currentTorrent.files[idx]) {
        const fileIdx = currentTorrent.files[idx].index != null ? currentTorrent.files[idx].index : currentTorrent.files[idx].id;
        item.classList.toggle('active', fileIdx === selectedIndex);
      }
    });
  }

  // --- Torrent Swarm Stats Polling (reads 100% from browser WebTorrent) ---
  function startStatsPolling() {
    stopStatsPolling();
    statsInterval = setInterval(() => {
      if (!activeTorrent) return;

      const dlSpeed = activeTorrent.downloadSpeed || 0;
      const ulSpeed = activeTorrent.uploadSpeed || 0;
      const numPeers = activeTorrent.numPeers || 0;
      const downloaded = activeTorrent.downloaded || 0;
      const progress = parseFloat(((activeTorrent.progress || 0) * 100).toFixed(1));

      latestStats = {
        downloadSpeed: dlSpeed,
        uploadSpeed: ulSpeed,
        formattedDownloadSpeed: formatBytes(dlSpeed) + '/s',
        formattedUploadSpeed: formatBytes(ulSpeed) + '/s',
        numPeers,
        downloaded,
        formattedDownloaded: formatBytes(downloaded),
        progress
      };

      peerCountText.textContent = `${numPeers} active peer${numPeers !== 1 ? 's' : ''}`;
      dlSpeedText.textContent = latestStats.formattedDownloadSpeed + ' DL';
      ulSpeedText.textContent = latestStats.formattedUploadSpeed + ' UL';
      downloadedAmount.textContent = latestStats.formattedDownloaded;

      const pct = Math.min(100, Math.max(0, progress));
      progressPercent.textContent = pct + '%';
      progressBarFill.style.width = pct + '%';

      if (!ytNerdStats.classList.contains('hidden')) {
        updateNerdStatsDisplay();
      }
    }, 1000);
  }

  function stopStatsPolling() {
    if (statsInterval) {
      clearInterval(statsInterval);
      statsInterval = null;
    }
  }

  // --- Destroy the active torrent cleanly in browser ---
  function destroyActiveTorrent() {
    if (activeTorrent) {
      try { activeTorrent.destroy(); } catch (e) {}
      activeTorrent = null;
    }
    activeFile = null;
  }

  // --- Stop Video & Torrent Clean up ---
  function closeVideo() {
    if (videoPlayer) {
      videoPlayer.pause();
      if (videoPlayer._blobUrl) {
        URL.revokeObjectURL(videoPlayer._blobUrl);
        videoPlayer._blobUrl = null;
      }
      videoPlayer.removeAttribute('src');
      videoPlayer.load();
    }
    stopStatsPolling();
    if (nerdInterval) {
      clearInterval(nerdInterval);
      nerdInterval = null;
    }

    destroyActiveTorrent();
    currentTorrent = null;

    playerSection.classList.add('hidden');
    peerCountText.textContent = '0 active peers';
    dlSpeedText.textContent = '0 KB/s DL';
    ulSpeedText.textContent = '0 KB/s UL';
    downloadedAmount.textContent = '0 MB';
    progressPercent.textContent = '0%';
    progressBarFill.style.width = '0%';
  }

  btnCloseVideo.addEventListener('click', closeVideo);

  window.addEventListener('beforeunload', () => {
    // Clean up browser-side WebTorrent on page unload
    destroyActiveTorrent();
    if (wtClient) {
      try { wtClient.destroy(); } catch (e) {}
      wtClient = null;
    }
  });


  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function showLoading(title, message) {
    loadingTitle.textContent = title;
    loadingMessage.textContent = message;
    loadingState.classList.remove('hidden');
  }

  function hideLoading() {
    loadingState.classList.add('hidden');
  }

  // --- Complete YouTube Keyboard Shortcuts ---
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
      return;
    }

    // Number keys 0-9 to jump to 0% - 90%
    if (/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (videoPlayer.duration) {
        const pct = parseInt(e.key, 10) / 10;
        videoPlayer.currentTime = pct * videoPlayer.duration;
      }
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;

      case 'j':
        e.preventDefault();
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
        triggerSeekRipple('left');
        break;

      case 'l':
        e.preventDefault();
        videoPlayer.currentTime = Math.min(videoPlayer.duration || 0, videoPlayer.currentTime + 10);
        triggerSeekRipple('right');
        break;

      case 'arrowleft':
        e.preventDefault();
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 5);
        break;

      case 'arrowright':
        e.preventDefault();
        videoPlayer.currentTime = Math.min(videoPlayer.duration || 0, videoPlayer.currentTime + 5);
        break;

      case 'arrowup':
        e.preventDefault();
        videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.05);
        videoPlayer.muted = false;
        updateVolumeUI();
        showVolumeHud(videoPlayer.volume);
        break;

      case 'arrowdown':
        e.preventDefault();
        videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.05);
        updateVolumeUI();
        showVolumeHud(videoPlayer.volume);
        break;

      case 'm':
        e.preventDefault();
        videoPlayer.muted = !videoPlayer.muted;
        updateVolumeUI();
        showVolumeHud(videoPlayer.muted ? 0 : videoPlayer.volume);
        break;

      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;

      case 't':
        e.preventDefault();
        toggleTheaterMode();
        break;

      case 'i':
        e.preventDefault();
        if (videoPlayer.requestPictureInPicture) {
          if (document.pictureInPictureElement) document.exitPictureInPicture();
          else videoPlayer.requestPictureInPicture();
        }
        break;

      case '>': // Shift + .
        if (e.shiftKey) {
          e.preventDefault();
          const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
          const curIdx = speeds.findIndex(s => Math.abs(s - videoPlayer.playbackRate) < 0.05);
          if (curIdx < speeds.length - 1) {
            const nextSpeed = speeds[curIdx + 1];
            videoPlayer.playbackRate = nextSpeed;
            currentSpeedLabel.textContent = nextSpeed === 1 ? 'Normal' : nextSpeed + 'x';
            speedItems.forEach(si => si.classList.toggle('active', parseFloat(si.dataset.speed) === nextSpeed));
          }
        }
        break;

      case '<': // Shift + ,
        if (e.shiftKey) {
          e.preventDefault();
          const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
          const curIdx = speeds.findIndex(s => Math.abs(s - videoPlayer.playbackRate) < 0.05);
          if (curIdx > 0) {
            const prevSpeed = speeds[curIdx - 1];
            videoPlayer.playbackRate = prevSpeed;
            currentSpeedLabel.textContent = prevSpeed === 1 ? 'Normal' : prevSpeed + 'x';
            speedItems.forEach(si => si.classList.toggle('active', parseFloat(si.dataset.speed) === prevSpeed));
          }
        }
        break;

      case 'n':
        if (e.shiftKey) {
          e.preventDefault();
          playNextFile();
        }
        break;
    }
  });

  // ==========================================
  // NAVIGATION TABS (PLAYER VS SEARCH ENGINE)
  // ==========================================
  const navTabPlayer = document.getElementById('navTabPlayer');
  const navTabSearch = document.getElementById('navTabSearch');
  const playerView = document.getElementById('playerView');
  const searchView = document.getElementById('searchView');
  const btnJumpToSearch = document.getElementById('btnJumpToSearch');

  function switchView(viewName) {
    if (viewName === 'player') {
      if (navTabPlayer) {
        navTabPlayer.classList.add('active');
        navTabPlayer.setAttribute('aria-selected', 'true');
      }
      if (navTabSearch) {
        navTabSearch.classList.remove('active');
        navTabSearch.setAttribute('aria-selected', 'false');
      }
      if (playerView) playerView.classList.remove('hidden');
      if (searchView) searchView.classList.add('hidden');
    } else if (viewName === 'search') {
      if (navTabSearch) {
        navTabSearch.classList.add('active');
        navTabSearch.setAttribute('aria-selected', 'true');
      }
      if (navTabPlayer) {
        navTabPlayer.classList.remove('active');
        navTabPlayer.setAttribute('aria-selected', 'false');
      }
      if (searchView) searchView.classList.remove('hidden');
      if (playerView) playerView.classList.add('hidden');
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 50);
      }
    }
  }

  if (navTabPlayer) navTabPlayer.addEventListener('click', () => switchView('player'));
  if (navTabSearch) navTabSearch.addEventListener('click', () => switchView('search'));
  if (btnJumpToSearch) btnJumpToSearch.addEventListener('click', () => switchView('search'));

  // Toast notification helper
  function showToast(message, type = 'info') {
    let toast = document.getElementById('streamToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'streamToast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.zIndex = '9999';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '10px';
      toast.style.fontSize = '0.9rem';
      toast.style.fontWeight = '600';
      toast.style.color = '#fff';
      toast.style.backdropFilter = 'blur(12px)';
      toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
      toast.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '8px';
      document.body.appendChild(toast);
    }
    toast.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.9)' :
                             type === 'success' ? 'rgba(16, 185, 129, 0.9)' :
                             'rgba(56, 189, 248, 0.9)';
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 2800);
  }

  // ==========================================
  // TORRENT SEARCH ENGINE LOGIC
  // ==========================================
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const btnSearchClear = document.getElementById('btnSearchClear');
  const btnSearchSubmit = document.getElementById('btnSearchSubmit');
  const categoryPills = document.querySelectorAll('.cat-pill');
  const searchSortSelect = document.getElementById('searchSortSelect');
  const searchLimitSelect = document.getElementById('searchLimitSelect');
  const tagBtns = document.querySelectorAll('.tag-btn, .btn-empty-demo');
  const searchStatsBar = document.getElementById('searchStatsBar');
  const searchResultCount = document.getElementById('searchResultCount');
  const searchQueryBadge = document.getElementById('searchQueryBadge');
  const searchLoading = document.getElementById('searchLoading');
  const searchEmptyState = document.getElementById('searchEmptyState');
  const searchErrorState = document.getElementById('searchErrorState');
  const searchErrorTitle = document.getElementById('searchErrorTitle');
  const searchErrorMessage = document.getElementById('searchErrorMessage');
  const btnSearchRetry = document.getElementById('btnSearchRetry');
  const searchResultsGrid = document.getElementById('searchResultsGrid');

  let currentSearchQuery = '';
  let currentSearchCategory = 'All';
  let searchResultsData = [];

  // Clear button visibility
  if (searchInput && btnSearchClear) {
    searchInput.addEventListener('input', () => {
      btnSearchClear.classList.toggle('hidden', !searchInput.value);
    });
    btnSearchClear.addEventListener('click', () => {
      searchInput.value = '';
      btnSearchClear.classList.add('hidden');
      searchInput.focus();
    });
  }

  // Category pill handlers
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentSearchCategory = pill.dataset.category || 'All';
      if (currentSearchQuery) {
        performSearch(currentSearchQuery, currentSearchCategory);
      }
    });
  });

  // Sort change handler
  if (searchSortSelect) {
    searchSortSelect.addEventListener('change', () => {
      if (searchResultsData.length > 0) {
        sortAndRenderResults();
      }
    });
  }

  // Limit change handler
  if (searchLimitSelect) {
    searchLimitSelect.addEventListener('change', () => {
      if (currentSearchQuery) {
        performSearch(currentSearchQuery, currentSearchCategory);
      }
    });
  }

  // Trending & empty demo tags
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.dataset.query || btn.dataset.demo;
      if (query) {
        if (searchInput) {
          searchInput.value = query;
          if (btnSearchClear) btnSearchClear.classList.remove('hidden');
        }
        performSearch(query, currentSearchCategory);
      }
    });
  });

  // Retry button
  if (btnSearchRetry) {
    btnSearchRetry.addEventListener('click', () => {
      if (currentSearchQuery) {
        performSearch(currentSearchQuery, currentSearchCategory);
      }
    });
  }

  // Form submit
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput ? searchInput.value.trim() : '';
      if (q) {
        performSearch(q, currentSearchCategory);
      }
    });
  }

  function parseSizeToBytes(sizeStr) {
    if (!sizeStr) return 0;
    const match = String(sizeStr).match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers = { 'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024, 'TB': 1024 * 1024 * 1024 * 1024 };
    return num * (multipliers[unit] || 1);
  }

  function sortAndRenderResults() {
    const sortVal = searchSortSelect ? searchSortSelect.value : 'seeds-desc';
    searchResultsData.sort((a, b) => {
      if (sortVal === 'seeds-desc') return (b.seeds || 0) - (a.seeds || 0);
      if (sortVal === 'peers-desc') return (b.peers || 0) - (a.peers || 0);
      if (sortVal === 'size-desc') return parseSizeToBytes(b.size) - parseSizeToBytes(a.size);
      if (sortVal === 'size-asc') return parseSizeToBytes(a.size) - parseSizeToBytes(b.size);
      if (sortVal === 'title-asc') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });
    renderResultsGrid(searchResultsData);
  }

  async function performSearch(query, category = 'All') {
    currentSearchQuery = query;
    const limit = searchLimitSelect ? parseInt(searchLimitSelect.value, 10) || 20 : 20;

    // Show loading UI
    if (searchLoading) searchLoading.classList.remove('hidden');
    if (searchEmptyState) searchEmptyState.classList.add('hidden');
    if (searchErrorState) searchErrorState.classList.add('hidden');
    if (searchResultsGrid) searchResultsGrid.classList.add('hidden');
    if (searchStatsBar) searchStatsBar.classList.add('hidden');

    try {
      const url = `/api/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status} search error`);
      }

      const data = await res.json();
      searchResultsData = Array.isArray(data.results) ? data.results : [];

      if (searchLoading) searchLoading.classList.add('hidden');

      if (searchResultsData.length === 0) {
        if (searchEmptyState) {
          searchEmptyState.classList.remove('hidden');
          const h3 = searchEmptyState.querySelector('h3');
          const p = searchEmptyState.querySelector('p');
          if (h3) h3.textContent = 'No Torrents Found';
          if (p) p.textContent = `No results found for "${query}". Try different search terms or select the "All" category.`;
        }
        return;
      }

      // Show stats bar
      if (searchStatsBar) searchStatsBar.classList.remove('hidden');
      if (searchResultCount) searchResultCount.textContent = `${searchResultsData.length} torrents found`;
      if (searchQueryBadge) searchQueryBadge.textContent = `"${query}" (${category})`;

      sortAndRenderResults();
    } catch (err) {
      console.error('[Search Error]:', err);
      if (searchLoading) searchLoading.classList.add('hidden');
      if (searchErrorState) {
        searchErrorState.classList.remove('hidden');
        if (searchErrorTitle) searchErrorTitle.textContent = 'Search Error';
        if (searchErrorMessage) searchErrorMessage.textContent = err.message || 'Unable to fetch torrents. Please verify your backend server.';
      }
    }
  }

  function getProviderClass(provider) {
    if (!provider) return 'p-tpb';
    const lower = provider.toLowerCase();
    if (lower.includes('1337')) return 'p-1337x';
    if (lower.includes('pirate') || lower.includes('tpb')) return 'p-tpb';
    if (lower.includes('yts')) return 'p-yts';
    if (lower.includes('eztv')) return 'p-eztv';
    if (lower.includes('lime')) return 'p-lime';
    return 'p-tpb';
  }

  function renderResultsGrid(results) {
    if (!searchResultsGrid) return;
    searchResultsGrid.innerHTML = '';
    searchResultsGrid.classList.remove('hidden');

    results.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'torrent-card';

      const providerClass = getProviderClass(item.provider);
      const safeTitle = (item.title || 'Untitled Torrent').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const safeSize = item.size || 'N/A';
      const seeds = Number(item.seeds) || 0;
      const peers = Number(item.peers) || 0;
      const time = item.time || '';

      card.innerHTML = `
        <div class="torrent-card-top">
          <div class="torrent-card-badges">
            <span class="card-provider-badge provider-pill ${providerClass}">${item.provider || 'Public'}</span>
            <span class="card-size-badge"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ${safeSize}</span>
          </div>
          <div class="torrent-card-title" title="${safeTitle}">${safeTitle}</div>
          <div class="torrent-card-stats">
            <span class="stat-item seeds" title="${seeds} Active Seeders">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
              ${seeds} Seeds
            </span>
            <span class="stat-item peers" title="${peers} Active Leechers">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
              ${peers} Peers
            </span>
            ${time ? `<span class="stat-item time" title="Uploaded">${time}</span>` : ''}
          </div>
        </div>
        <div class="torrent-card-actions">
          <button type="button" class="btn-card-stream" data-idx="${index}">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <span>Stream Now</span>
          </button>
          <button type="button" class="btn-card-copy" data-idx="${index}" title="Copy Magnet URI">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        </div>
      `;

      // Button handlers
      const btnStream = card.querySelector('.btn-card-stream');
      const btnCopy = card.querySelector('.btn-card-copy');

      async function resolveMagnetIfNeeded(targetBtn) {
        if (item.magnet && item.magnet.startsWith('magnet:?')) {
          return item.magnet;
        }

        const origHtml = targetBtn.innerHTML;
        targetBtn.disabled = true;
        targetBtn.innerHTML = `<span>Resolving...</span>`;

        try {
          const res = await fetch('/api/search/magnet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ torrent: item })
          });
          const json = await res.json();
          if (json.magnet) {
            item.magnet = json.magnet;
            return json.magnet;
          }
          throw new Error(json.error || 'Could not resolve magnet link');
        } catch (err) {
          showToast('Could not resolve magnet: ' + err.message, 'error');
          return null;
        } finally {
          targetBtn.disabled = false;
          targetBtn.innerHTML = origHtml;
        }
      }

      btnStream.addEventListener('click', async () => {
        const magnetUri = await resolveMagnetIfNeeded(btnStream);
        if (magnetUri) {
          switchView('player');
          if (magnetInput) magnetInput.value = magnetUri;
          loadTorrent(magnetUri);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });

      btnCopy.addEventListener('click', async () => {
        const magnetUri = await resolveMagnetIfNeeded(btnCopy);
        if (magnetUri) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(magnetUri).then(() => {
              btnCopy.classList.add('copied');
              btnCopy.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
              setTimeout(() => {
                btnCopy.classList.remove('copied');
                btnCopy.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
              }, 2000);
              showToast('Magnet URI copied to clipboard!', 'success');
            }).catch(() => {
              prompt('Copy magnet link manually:', magnetUri);
            });
          } else {
            prompt('Copy magnet link manually:', magnetUri);
          }
        }
      });

      searchResultsGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  // Modal Handlers
  btnShortcuts.onclick = () => shortcutsModal.classList.remove('hidden');
  btnCloseModal.onclick = () => shortcutsModal.classList.add('hidden');
  shortcutsModal.onclick = (e) => {
    if (e.target === shortcutsModal) shortcutsModal.classList.add('hidden');
  };
});
