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

  // State
  let currentTorrent = null;  // metadata object { name, infoHash, files, ... }
  let browserTorrentClient = null;
  let activeBrowserTorrent = null;
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

  // --- StreamForge Cinema & Audio Fix State ---
  let audioCtx = null;
  let gainNode = null;
  let compressorNode = null;
  let currentGain = 1.0;
  let isAudioFixActive = false;
  let audioGraphConnected = false;
  let silentAudioTimer = null;
  let autoAudioFixAttempted = false;
  let allCatalogItems = [];
  let currentFeaturedHero = null;
  let activeGenre = 'all';

  const btnAudioFix = document.getElementById('btnAudioFix');
  const btnAudioFixText = document.getElementById('btnAudioFixText');
  const btnVolumeBoost = document.getElementById('btnVolumeBoost');
  const boostMenu = document.getElementById('boostMenu');
  const boostLevelText = document.getElementById('boostLevelText');
  const ytUnmuteBanner = document.getElementById('ytUnmuteBanner');
  const btnMenuAudioFix = document.getElementById('btnMenuAudioFix');
  const audioFixStatusLabel = document.getElementById('audioFixStatusLabel');
  const hudAudioStatus = document.getElementById('hudAudioStatus');
  const nerdAudio = document.getElementById('nerdAudio');
  const nerdVolumeBoost = document.getElementById('nerdVolumeBoost');

  const logoHome = document.getElementById('logoHome');
  const btnBackToCatalog = document.getElementById('btnBackToCatalog');
  const btnNowPlayingBar = document.getElementById('btnNowPlayingBar');
  const nowPlayingText = document.getElementById('nowPlayingText');
  const playerActiveBadge = document.getElementById('playerActiveBadge');
  const playerNowTitle = document.getElementById('playerNowTitle');
  const btnOpenMagnetModal = document.getElementById('btnOpenMagnetModal');
  const btnPlayerToggleMagnet = document.getElementById('btnPlayerToggleMagnet');
  const magnetModal = document.getElementById('magnetModal');
  const btnCloseMagnetModal = document.getElementById('btnCloseMagnetModal');
  const globalSearchForm = document.getElementById('globalSearchForm');
  const globalSearchInput = document.getElementById('globalSearchInput');
  const btnGlobalSearchClear = document.getElementById('btnGlobalSearchClear');

  function parseSizeToBytes(sizeStr) {
    if (!sizeStr) return 0;
    const match = String(sizeStr).match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const multipliers = { 'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024, 'TB': 1024 * 1024 * 1024 * 1024 };
    return num * (multipliers[unit] || 1);
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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
    // Start playing as soon as browser has sufficient audio/video data
    if (videoPlayer.paused) {
      videoPlayer.play().catch(() => {});
    }
  });

  videoPlayer.addEventListener('loadeddata', () => {
    // The very first frame is ready to render
    ytSpinner.classList.add('hidden');
    if (videoPlayer.paused) {
      videoPlayer.play().catch(() => {});
    }
  });

  videoPlayer.addEventListener('error', () => {
    ytSpinner.classList.add('hidden');
    const err = videoPlayer.error;
    console.error('[Video Player Error]:', err);
    let msg = 'Could not load video stream.';
    if (err) {
      switch (err.code) {
        case 1: msg = 'Video playback aborted.'; break;
        case 2: msg = 'Network error while downloading video stream.'; break;
        case 3: msg = 'Video decoding failed (unsupported codec). Try enabling Audio/Codec Fix or opening stream in VLC.'; break;
        case 4: msg = 'Video format not supported or file not found.'; break;
      }
    }
    showLoading('Playback Error', msg);
    setTimeout(() => hideLoading(), 8000);
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

  // --- Audio Fix & Volume Booster Logic ---
  // Important: createMediaElementSource() permanently hijacks <video> audio.
  // If AudioContext is suspended (browser default), the movie plays with no sound.
  // Only connect the Web Audio graph when the user actually boosts volume.
  function unlockAudioOutput() {
    try {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  function ensureAudiblePlayback() {
    try {
      videoPlayer.muted = false;
      if (!videoPlayer.volume) {
        videoPlayer.volume = lastVolume > 0 ? lastVolume : 1;
      }
      unlockAudioOutput();
      if (ytUnmuteBanner) ytUnmuteBanner.classList.add('hidden');
      updateVolumeUI();
    } catch (e) {}
  }

  document.addEventListener('pointerdown', unlockAudioOutput);
  document.addEventListener('keydown', unlockAudioOutput);

  function filenameNeedsAudioFix(name) {
    return /\b(ac3|eac3|e-ac-3|dd\+|ddp|dts(?:-hd)?|truehd|true\.hd|atmos|thd|flac)\b/i.test(String(name || ''));
  }

  function initAudioBooster() {
    if (currentGain <= 1.01) return;
    if (audioGraphConnected) {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = audioCtx || new AudioContextClass();
      gainNode = audioCtx.createGain();
      compressorNode = audioCtx.createDynamicsCompressor();

      compressorNode.threshold.setValueAtTime(-24, audioCtx.currentTime);
      compressorNode.knee.setValueAtTime(30, audioCtx.currentTime);
      compressorNode.ratio.setValueAtTime(12, audioCtx.currentTime);
      compressorNode.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressorNode.release.setValueAtTime(0.25, audioCtx.currentTime);

      const source = audioCtx.createMediaElementSource(videoPlayer);
      source.connect(compressorNode);
      compressorNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      audioGraphConnected = true;
      audioCtx.resume().catch(() => {});
      setVolumeBoost(currentGain);
    } catch (e) {
      console.warn('[AudioBooster] Notice:', e.message);
    }
  }

  function setVolumeBoost(level) {
    currentGain = level;
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      if (gainNode) {
        gainNode.gain.setValueAtTime(level, audioCtx.currentTime);
      }
    }
    const percentStr = Math.round(level * 100) + '%';
    if (boostLevelText) boostLevelText.textContent = percentStr;
    if (nerdVolumeBoost) nerdVolumeBoost.textContent = percentStr + (level > 1 ? ' (Amplified)' : ' (Normal)');

    const options = document.querySelectorAll('.boost-option');
    options.forEach(opt => {
      const optGain = parseFloat(opt.dataset.gain || '1.0');
      opt.classList.toggle('active', Math.abs(optGain - level) < 0.05);
    });
  }

  function applyAudioFixUi(enabled) {
    if (btnAudioFix) btnAudioFix.classList.toggle('active', enabled);
    if (audioFixStatusLabel) audioFixStatusLabel.textContent = enabled ? 'AAC Stereo ›' : 'Off ›';
    if (btnAudioFixText) btnAudioFixText.textContent = enabled ? 'Audio Fixed (AAC)' : 'Fix Audio';
    if (hudAudioStatus) {
      hudAudioStatus.textContent = enabled ? 'AAC Stereo' : 'Direct Audio';
      hudAudioStatus.style.color = enabled ? '#f59e0b' : '#10b981';
    }
    if (nerdAudio) nerdAudio.textContent = enabled ? 'AAC Stereo (Transcoded via ffmpeg)' : 'Direct Passthrough';
  }

  function setAudioFixEnabled(enabled, opts = {}) {
    if (!currentTorrent || !currentTorrent.infoHash) {
      if (!opts.silent) showToast('Start playing a video to use Audio Fix', 'info');
      return;
    }
    if (isAudioFixActive === enabled) return;
    isAudioFixActive = enabled;
    applyAudioFixUi(enabled);

    const currentTime = videoPlayer.currentTime || 0;
    const fileIndex = activeFile && activeFile.index != null
      ? activeFile.index
      : parseInt(fileSelect && fileSelect.value, 10) || 0;

    if (enabled) {
      if (!opts.silent) showToast('Transcoding unsupported audio (AC3/DTS) to AAC so you can hear it', 'success');
      streamFromBrowser(fileIndex, true, currentTime);
    } else {
      if (!opts.silent) showToast('Reverted to Direct Audio stream', 'info');
      streamFromBrowser(fileIndex, false, currentTime);
    }
  }

  function toggleAudioFix() {
    setAudioFixEnabled(!isAudioFixActive);
  }

  function startSilentAudioWatch() {
    if (silentAudioTimer) clearTimeout(silentAudioTimer);
    silentAudioTimer = setTimeout(() => {
      if (isAudioFixActive || autoAudioFixAttempted) return;
      if (!videoPlayer || videoPlayer.paused) return;

      if (videoPlayer.muted || videoPlayer.volume === 0) {
        if (ytUnmuteBanner) ytUnmuteBanner.classList.remove('hidden');
        return;
      }

      const decodedBytes = videoPlayer.webkitAudioDecodedByteCount;
      const audioTracks = videoPlayer.audioTracks;
      const noDecodedAudio = typeof decodedBytes === 'number' && decodedBytes === 0 && videoPlayer.currentTime > 1.5;
      const noAudioTracks = audioTracks && typeof audioTracks.length === 'number' && audioTracks.length === 0;

      if (noDecodedAudio || noAudioTracks) {
        autoAudioFixAttempted = true;
        showToast('No audible track detected — switching to AAC audio engine', 'info');
        setAudioFixEnabled(true, { silent: true });
      }
    }, 4500);
  }

  if (btnAudioFix) btnAudioFix.addEventListener('click', toggleAudioFix);
  if (btnMenuAudioFix) btnMenuAudioFix.addEventListener('click', toggleAudioFix);

  if (btnVolumeBoost) {
    btnVolumeBoost.addEventListener('click', (e) => {
      e.stopPropagation();
      if (boostMenu) boostMenu.classList.toggle('hidden');
    });
  }

  document.querySelectorAll('.boost-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const gain = parseFloat(opt.dataset.gain || '1.0');
      initAudioBooster();
      setVolumeBoost(gain);
      if (boostMenu) boostMenu.classList.add('hidden');
      showToast(`Volume booster set to ${Math.round(gain * 100)}%`, 'info');
    });
  });

  document.addEventListener('click', (e) => {
    if (boostMenu && !boostMenu.contains(e.target) && e.target !== btnVolumeBoost) {
      boostMenu.classList.add('hidden');
    }
  });

  if (ytUnmuteBanner) {
    ytUnmuteBanner.addEventListener('click', () => {
      videoPlayer.muted = false;
      videoPlayer.volume = lastVolume > 0 ? lastVolume : 1;
      initAudioBooster();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      updateVolumeUI();
      ytUnmuteBanner.classList.add('hidden');
      showToast('Audio unmuted and sound boosted', 'success');
    });
  }

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

  if (ctxLoop) {
    ctxLoop.addEventListener('click', () => {
      videoPlayer.loop = !videoPlayer.loop;
      if (loopLabel) loopLabel.textContent = videoPlayer.loop ? 'On' : 'Off';
      ytContextMenu.classList.add('hidden');
    });
  }

  if (ctxCopyUrl) {
    ctxCopyUrl.addEventListener('click', () => {
      if (videoPlayer.src) {
        const url = `${window.location.origin}${videoPlayer.getAttribute('src')}#t=${Math.floor(videoPlayer.currentTime)}`;
        navigator.clipboard.writeText(url).then(() => alert('Copied video URL to clipboard!'));
      }
      ytContextMenu.classList.add('hidden');
    });
  }

  const ctxAudioFix = document.getElementById('ctxAudioFix');
  if (ctxAudioFix) {
    ctxAudioFix.addEventListener('click', () => {
      toggleAudioFix();
      ytContextMenu.classList.add('hidden');
    });
  }

  if (ctxCopyDebug) {
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
  }

  if (ctxNerds) {
    ctxNerds.addEventListener('click', () => {
      toggleNerdStats();
      ytContextMenu.classList.add('hidden');
    });
  }

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
  if (btnLike) {
    btnLike.addEventListener('click', () => {
      isLiked = !isLiked;
      if (isLiked) isDisliked = false;
      btnLike.style.color = isLiked ? '#3ea6ff' : '#f1f1f1';
      if (btnDislike) btnDislike.style.color = '#f1f1f1';
      if (likeCount) likeCount.textContent = isLiked ? '1.5K' : '1.4K';
    });
  }

  if (btnDislike) {
    btnDislike.addEventListener('click', () => {
      isDisliked = !isDisliked;
      if (isDisliked) isLiked = false;
      btnDislike.style.color = isDisliked ? '#3ea6ff' : '#f1f1f1';
      if (btnLike) btnLike.style.color = '#f1f1f1';
      if (likeCount) likeCount.textContent = '1.4K';
    });
  }

  if (btnShare) {
    btnShare.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    });
  }

  // --- Subtitles / CC Notification ---
  if (btnSubtitles) {
    btnSubtitles.addEventListener('click', () => {
      alert('Subtitles / Closed Captions: Embedded torrent subtitle tracks will be rendered when present.');
    });
  }

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


  // --- Add a .torrent file directly to the browser WebTorrent engine ---
  async function uploadTorrentFile(file) {
    showLoading('Opening .torrent file...', 'Connecting to BitTorrent swarm through the browser...');
    playerSection.classList.add('hidden');
    stopStatsPolling();

    try {
      const torrent = await addBrowserTorrent(file);
      const torrentData = buildTorrentData(torrent);
      currentTorrent = torrentData;
      activeBrowserTorrent = torrent;
      renderTorrentData(torrentData);
      hideLoading();
      playerSection.classList.remove('hidden');
      startStatsPolling();
      markNowPlaying(torrentData.name || 'Streaming');
    } catch (err) {
      console.error('[Upload Error]:', err);
      showLoading('Upload Failed', err.message);
      setTimeout(() => hideLoading(), 5000);
    }
  }

  // --- Load and stream a torrent entirely in the browser ---
  let activeTargetEpisode = null;
  let activeIsEpisode = false;
  let activeIsMovie = false;

  async function loadTorrent(torrentId, options = {}) {
    switchView('player');
    if (magnetModal) magnetModal.classList.add('hidden');
    ensureAudiblePlayback();
    isAudioFixActive = false;
    autoAudioFixAttempted = false;
    applyAudioFixUi(false);
    showLoading('Connecting to Swarm...', 'Contacting DHT nodes and peer trackers (uTP/UDP)...');
    stopStatsPolling();
    if (activeBrowserTorrent) {
      try { activeBrowserTorrent.destroy(); } catch (e) {}
      activeBrowserTorrent = null;
    }

    if (options.episode) activeTargetEpisode = options.episode;
    if (options.type === 'series') { activeIsEpisode = true; activeIsMovie = false; }
    else if (options.type === 'movie') { activeIsMovie = true; activeIsEpisode = false; }

    let input = String(torrentId)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    if (/^[a-fA-F0-9]{40}$/.test(input) || /^[a-zA-Z2-7]{32}$/.test(input)) {
      input = 'magnet:?xt=urn:btih:' + input;
    }

    try {
      loadingMessage.textContent = 'Contacting seeders across public trackers and DHT...';
      const torrent = await addBrowserTorrent(input);
      activeBrowserTorrent = torrent;
      const torrentData = buildTorrentData(torrent);
      currentTorrent = torrentData;
      renderTorrentData(torrentData);
      hideLoading();
      playerSection.classList.remove('hidden');
      startStatsPolling();
      markNowPlaying(torrentData.name || 'Streaming');
    } catch (e) {
      console.error('[Browser WebTorrent Error]:', e);
      showLoading('Could not start stream', e.message || 'No seeders answered. Pick a release with more seeds.');
      return;
    }

  const browserTrackers = [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.webtorrent.dev',
    'wss://tracker.files.fm:7073/announce'
  ];

  function getBrowserTorrentClient() {
    if (!window.WebTorrent) throw new Error('WebTorrent browser engine is unavailable. Reload the page and try again.');
    if (!browserTorrentClient) browserTorrentClient = new WebTorrent();
    return browserTorrentClient;
  }

  function addBrowserTorrent(input) {
    return new Promise((resolve, reject) => {
      const client = getBrowserTorrentClient();
      const torrent = client.add(input, { announce: browserTrackers }, (readyTorrent) => resolve(readyTorrent));
      torrent.once('error', reject);
      const timeout = setTimeout(() => reject(new Error('No seeders answered in time. Pick a release with more seeds.')), 125000);
      torrent.once('ready', () => clearTimeout(timeout));
    });
  }

  function buildTorrentData(torrent) {
    const files = (torrent.files || []).map((file, index) => ({
      id: index,
      index,
      name: file.name,
      length: file.length,
      formattedSize: formatBytes(file.length),
      path: file.path,
      isVideo: /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v|ts|ogv|mpg|mpeg)$/i.test(file.name),
      needsAudioFix: filenameNeedsAudioFix(file.name),
      browserFile: file
    }));
    const videoFiles = files.filter(file => file.isVideo);
    const largest = (videoFiles.length ? videoFiles : files).reduce((best, file) =>
      !best || file.length > best.length ? file : best, null);
    const totalSize = files.reduce((sum, file) => sum + file.length, 0);
    return {
      name: torrent.name || 'Unknown Torrent',
      infoHash: torrent.infoHash,
      formattedTotalSize: formatBytes(totalSize),
      defaultFileIndex: largest ? largest.index : 0,
      files,
      browserTorrent: torrent
    };
  }
  }


  // --- Render Torrent Data & YouTube Playlist Queue ---
  function renderTorrentData(torrentData) {
    if (torrentNameDisplay) torrentNameDisplay.textContent = torrentData.name || 'Torrent Stream';
    if (torrentSizeDisplay) torrentSizeDisplay.textContent = torrentData.formattedTotalSize || '';
    if (fileCountBadge) fileCountBadge.textContent = `${(torrentData.files || []).length} file${(torrentData.files || []).length !== 1 ? 's' : ''}`;

    const infoHash = torrentData.infoHash;
    let defaultIdx = torrentData.defaultFileIndex || 0;

    // Smart file selector based on episode / movie size constraints
    if (torrentData.files && torrentData.files.length > 1) {
      const isVideo = (f) => f.isVideo !== false && /\.(mp4|mkv|avi|mov|webm|flv|wmv|m4v|ts)$/i.test(f.name);
      const isSample = (f) => /sample/i.test(f.name);

      // 1. If looking for a specific episode (e.g. S01E01), match the episode code in the filename & prefer < 1 GB
      if (activeTargetEpisode) {
        const epClean = activeTargetEpisode.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Prioritize matching episode file under 1 GB
        let epFile = torrentData.files.find(f => {
          if (!isVideo(f) || isSample(f)) return false;
          if (f.length >= 1024 * 1024 * 1024) return false;
          const nameClean = f.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return nameClean.includes(epClean);
        });
        if (!epFile) {
          // Fallback to any file matching episode code if none under 1 GB
          epFile = torrentData.files.find(f => {
            if (!isVideo(f)) return false;
            const nameClean = f.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return nameClean.includes(epClean);
          });
        }
        if (epFile) {
          defaultIdx = epFile.index != null ? epFile.index : epFile.id;
        }
      } else if (activeIsEpisode) {
        // 2. If it's a TV show episode, select a video file < 1 GB (and > 25 MB to exclude samples)
        const tvFile = torrentData.files.find(f => {
          return isVideo(f) && !isSample(f) && f.length < 1024 * 1024 * 1024 && f.length > 25 * 1024 * 1024;
        });
        if (tvFile) {
          defaultIdx = tvFile.index != null ? tvFile.index : tvFile.id;
        }
      } else if (activeIsMovie) {
        const movieFiles = torrentData.files.filter(f => {
          return isVideo(f) && !isSample(f) && f.length > 50 * 1024 * 1024;
        }).sort((a, b) => (b.length || 0) - (a.length || 0));
        if (movieFiles[0]) {
          defaultIdx = movieFiles[0].index != null ? movieFiles[0].index : movieFiles[0].id;
        }
      }
    }

    if (fileSelect) fileSelect.innerHTML = '';
    if (fileList) fileList.innerHTML = '';

    torrentData.files.forEach((file, listIdx) => {
      const fileIdx = file.index != null ? file.index : file.id;

      // Dropdown option
      const option = document.createElement('option');
      option.value = fileIdx;
      option.textContent = `${file.name} (${file.formattedSize || formatBytes(file.length)})`;
      if (fileIdx === defaultIdx) option.selected = true;
      if (fileSelect) fileSelect.appendChild(option);

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
      if (fileList) fileList.appendChild(li);
    });

    if (fileSelect) {
      fileSelect.onchange = (e) => {
        const fileIdx = parseInt(e.target.value, 10);
        switchFileStream(infoHash, fileIdx);
        updateActiveFileUI(fileIdx);
      };
    }

    switchFileStream(infoHash, defaultIdx);
    if (window.lucide) lucide.createIcons();
  }

  function switchFileStream(infoHash, fileIndex) {
    if (videoPlayer._blobUrl) {
      URL.revokeObjectURL(videoPlayer._blobUrl);
      videoPlayer._blobUrl = null;
    }

    videoPlayer.pause();
    isAudioFixActive = false;
    autoAudioFixAttempted = false;
    applyAudioFixUi(false);

    const file = currentTorrent && currentTorrent.files
      ? currentTorrent.files.find(f => (f.index != null ? f.index : f.id) === fileIndex)
      : null;
    activeFile = file || { index: fileIndex, name: '' };

    const autoFix = !!(file && (file.needsAudioFix || filenameNeedsAudioFix(file.name)));
    if (autoFix) {
      isAudioFixActive = true;
      autoAudioFixAttempted = true;
      applyAudioFixUi(true);
      showToast('This release uses cinema audio (AC3/DTS). Transcoding to AAC so sound plays in the browser.', 'info');
    }

    streamFromBrowser(fileIndex, autoFix);
  }

  function streamFromBrowser(fileIndex, audioFix = false, startTime = 0) {
    const fileData = currentTorrent && currentTorrent.files
      ? currentTorrent.files.find(file => file.index === fileIndex)
      : null;
    const file = fileData && fileData.browserFile;
    if (!file) return;
    ensureAudiblePlayback();
    videoPlayer.removeAttribute('src');
    videoPlayer.src = typeof file.streamURL === 'function' ? file.streamURL() : '';
    videoPlayer.load();
    videoPlayer.currentTime = startTime > 0 ? startTime : 0;
    if (currentGain > 1.01) initAudioBooster();
    startSilentAudioWatch();

    const playPromise = videoPlayer.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        ensureAudiblePlayback();
      }).catch(() => {
        console.log('[Autoplay]: User interaction needed to start audio playback');
        if (ytUnmuteBanner) ytUnmuteBanner.classList.remove('hidden');
      });
    }
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

  // --- Torrent Swarm Stats Polling (browser torrent engine) ---
  function startStatsPolling() {
    stopStatsPolling();
    statsInterval = setInterval(async () => {
      if (activeBrowserTorrent) {
        try {
          updateStatsUI(activeBrowserTorrent.downloadSpeed || 0, activeBrowserTorrent.uploadSpeed || 0,
            activeBrowserTorrent.numPeers || 0, activeBrowserTorrent.downloaded || 0,
            (activeBrowserTorrent.progress || 0) * 100);
        } catch (e) {}
      }
    }, 1000);
  }

  function updateStatsUI(dlSpeed, ulSpeed, numPeers, downloaded, progress) {
    latestStats = {
      downloadSpeed: dlSpeed,
      formattedDownloadSpeed: formatBytes(dlSpeed) + '/s',
      downloaded,
      formattedDownloaded: formatBytes(downloaded)
    };

    if (dlSpeedText) dlSpeedText.textContent = latestStats.formattedDownloadSpeed;
    if (downloadedAmount) downloadedAmount.textContent = latestStats.formattedDownloaded;

    const hudSpeed = document.getElementById('hudSpeed');
    const hudDownloaded = document.getElementById('hudDownloaded');
    const descViewCount = document.getElementById('descViewCount');
    if (hudSpeed) hudSpeed.textContent = latestStats.formattedDownloadSpeed;
    if (hudDownloaded) hudDownloaded.textContent = latestStats.formattedDownloaded;
    if (descViewCount) descViewCount.innerHTML = `<i data-lucide="download"></i> ${latestStats.formattedDownloadSpeed}`;

    if (!ytNerdStats.classList.contains('hidden')) {
      updateNerdStatsDisplay();
    }
  }

  function stopStatsPolling() {
    if (statsInterval) {
      clearInterval(statsInterval);
      statsInterval = null;
    }
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

    if (activeBrowserTorrent) {
      try { activeBrowserTorrent.destroy(); } catch (e) {}
      activeBrowserTorrent = null;
    }

    currentTorrent = null;
    markNowPlaying(null);

    playerSection.classList.add('hidden');
    if (dlSpeedText) dlSpeedText.textContent = '0 KB/s';
    if (downloadedAmount) downloadedAmount.textContent = '0 MB';
  }

  if (btnCloseVideo) btnCloseVideo.addEventListener('click', closeVideo);

  window.addEventListener('beforeunload', () => {
    if (activeBrowserTorrent) {
      try { activeBrowserTorrent.destroy(); } catch (e) {}
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
    if (loadingTitle) loadingTitle.textContent = title;
    if (loadingMessage) loadingMessage.textContent = message;
    if (loadingState) loadingState.classList.remove('hidden');
    const overlay = document.getElementById('playerOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayMessage = document.getElementById('overlayMessage');
    if (overlayTitle) overlayTitle.textContent = title;
    if (overlayMessage) overlayMessage.textContent = message;
    if (overlay) overlay.classList.remove('hidden', 'is-idle');
    if (playerSection) playerSection.classList.remove('hidden');
  }

  function hideLoading() {
    if (loadingState) loadingState.classList.add('hidden');
    const overlay = document.getElementById('playerOverlay');
    if (overlay) overlay.classList.add('hidden');
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

      case 'a':
        e.preventDefault();
        toggleAudioFix();
        break;

      case 'b':
        e.preventDefault();
        const nextGain = currentGain === 1.0 ? 1.5 : (currentGain === 1.5 ? 2.0 : (currentGain === 2.0 ? 3.0 : 1.0));
        initAudioBooster();
        setVolumeBoost(nextGain);
        showToast(`Volume booster: ${Math.round(nextGain * 100)}%`, 'info');
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
  // NAVIGATION TABS (PLAYER VS DISCOVER VS SEARCH)
  // ==========================================
  const navTabPlayer = document.getElementById('navTabPlayer');
  const navTabHome = document.getElementById('navTabHome');
  const navTabMovies = document.getElementById('navTabMovies');
  const navTabTV = document.getElementById('navTabTV');
  const navTabIMDB = document.getElementById('navTabIMDB');
  const playerView = document.getElementById('playerView');
  const discoverView = document.getElementById('discoverView');
  const searchView = document.getElementById('searchView');
  const detailView = document.getElementById('detailView');
  const btnJumpToSearch = document.getElementById('btnJumpToSearch');

  function markNowPlaying(title) {
    const live = Boolean(title);
    if (btnNowPlayingBar) btnNowPlayingBar.classList.toggle('hidden', !live);
    if (playerActiveBadge) playerActiveBadge.classList.toggle('hidden', !live);
    if (nowPlayingText) nowPlayingText.textContent = live ? String(title).slice(0, 42) : 'Streaming';
    if (playerNowTitle) playerNowTitle.textContent = live ? title : 'Movie Title';
    if (torrentNameDisplay && live) torrentNameDisplay.textContent = title;
  }

  function hasActiveStream() {
    return Boolean(currentTorrent && videoPlayer && (videoPlayer.src || !videoPlayer.paused));
  }

  function setCinemaDock(enabled) {
    document.body.classList.toggle('cinema-docked', enabled);
    const btnExpandDock = document.getElementById('btnExpandDock');
    if (btnExpandDock) btnExpandDock.classList.toggle('hidden', !enabled);
  }

  function switchView(viewName, filterType = 'all') {
    // Reset all tabs
    [navTabPlayer, navTabHome, navTabMovies, navTabTV, navTabIMDB].forEach(tab => {
      if (tab) {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    // Reset all panes
    [playerView, discoverView, searchView, detailView].forEach(pane => {
      if (pane) pane.classList.add('hidden');
    });

    if (viewName === 'player') {
      setCinemaDock(false);
      if (navTabPlayer) {
        navTabPlayer.classList.add('active');
        navTabPlayer.setAttribute('aria-selected', 'true');
      }
      if (playerView) playerView.classList.remove('hidden');
    } else if (viewName === 'discover') {
      currentDiscoverType = filterType === 'movies' ? 'movie' : (filterType === 'tv' ? 'series' : (filterType === 'imdb' ? 'imdb' : 'all'));
      if (filterType === 'movies' && navTabMovies) {
        navTabMovies.classList.add('active');
        navTabMovies.setAttribute('aria-selected', 'true');
      } else if (filterType === 'tv' && navTabTV) {
        navTabTV.classList.add('active');
        navTabTV.setAttribute('aria-selected', 'true');
      } else if (filterType === 'imdb' && navTabIMDB) {
        navTabIMDB.classList.add('active');
        navTabIMDB.setAttribute('aria-selected', 'true');
      } else if (navTabHome) {
        navTabHome.classList.add('active');
        navTabHome.setAttribute('aria-selected', 'true');
      }
      if (discoverView) discoverView.classList.remove('hidden');
      setCinemaDock(hasActiveStream());
      loadDiscoverMedia('');
    } else if (viewName === 'search') {
      if (navTabHome) {
        navTabHome.classList.add('active');
        navTabHome.setAttribute('aria-selected', 'true');
      }
      if (searchView) searchView.classList.remove('hidden');
      setCinemaDock(hasActiveStream());
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 50);
      }
    } else if (viewName === 'detail') {
      if (navTabHome) {
        navTabHome.classList.add('active');
        navTabHome.setAttribute('aria-selected', 'true');
      }
      if (detailView) detailView.classList.remove('hidden');
      setCinemaDock(hasActiveStream());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (navTabPlayer) navTabPlayer.addEventListener('click', () => switchView('player'));
  if (navTabHome) navTabHome.addEventListener('click', () => switchView('discover', 'all'));
  if (navTabMovies) navTabMovies.addEventListener('click', () => switchView('discover', 'movies'));
  if (navTabTV) navTabTV.addEventListener('click', () => switchView('discover', 'tv'));
  if (navTabIMDB) navTabIMDB.addEventListener('click', () => switchView('discover', 'imdb'));
  if (btnJumpToSearch) btnJumpToSearch.addEventListener('click', () => switchView('search'));

  // Putlocker Platform Navigation
  if (logoHome) {
    logoHome.addEventListener('click', () => {
      if (globalSearchInput) globalSearchInput.value = '';
      if (btnGlobalSearchClear) btnGlobalSearchClear.classList.add('hidden');
      switchView('discover', 'all');
    });
  }
  if (btnBackToCatalog) {
    btnBackToCatalog.addEventListener('click', () => {
      switchView('discover');
    });
  }
  if (btnNowPlayingBar) {
    btnNowPlayingBar.addEventListener('click', () => {
      switchView('player');
    });
  }
  const btnExpandDock = document.getElementById('btnExpandDock');
  if (btnExpandDock) {
    btnExpandDock.addEventListener('click', (e) => {
      e.stopPropagation();
      switchView('player');
    });
  }
  if (playerView) {
    playerView.addEventListener('click', () => {
      if (document.body.classList.contains('cinema-docked')) {
        switchView('player');
      }
    });
  }
  const btnStopDownload = document.getElementById('btnStopDownload');
  if (btnStopDownload) {
    btnStopDownload.addEventListener('click', () => {
      closeVideo();
      setCinemaDock(false);
      switchView('discover');
    });
  }
  if (btnOpenMagnetModal) {
    btnOpenMagnetModal.addEventListener('click', () => {
      if (magnetModal) magnetModal.classList.remove('hidden');
    });
  }
  if (btnPlayerToggleMagnet) {
    btnPlayerToggleMagnet.addEventListener('click', () => {
      if (magnetModal) magnetModal.classList.remove('hidden');
    });
  }
  if (btnCloseMagnetModal) {
    btnCloseMagnetModal.addEventListener('click', () => {
      if (magnetModal) magnetModal.classList.add('hidden');
    });
  }
  if (magnetModal) {
    magnetModal.addEventListener('click', (e) => {
      if (e.target === magnetModal) magnetModal.classList.add('hidden');
    });
  }

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
  const categoryPills = document.querySelectorAll('#categoryPills .cat-pill');
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

  // =======================================================
  // MOVIES & TV SHOWS DISCOVERY & TRAILERS
  // =======================================================
  const discoverForm = document.getElementById('discoverForm');
  const discoverInput = document.getElementById('discoverInput');
  const btnDiscoverClear = document.getElementById('btnDiscoverClear');
  const discoverTypePills = document.getElementById('discoverTypePills');
  const discoverLoading = document.getElementById('discoverLoading');
  const discoverGrid = document.getElementById('discoverGrid');
  const discoverQuickTags = document.querySelectorAll('.discover-quick-tag');

  // Trailer Modal Elements
  const trailerModal = document.getElementById('trailerModal');
  const trailerModalTitle = document.getElementById('trailerModalTitle');
  const trailerIframe = document.getElementById('trailerIframe');
  const btnCloseTrailer = document.getElementById('btnCloseTrailer');

  let currentDiscoverType = 'all';
  let discoverLoadedOnce = false;

  function updateHeroBillboard(item) {
    if (!item) return;
    currentFeaturedHero = item;
    const heroBackdrop = document.getElementById('heroBackdrop');
    const heroTitle = document.getElementById('heroTitle');
    const heroRating = document.getElementById('heroRating');
    const heroYear = document.getElementById('heroYear');
    const heroRuntime = document.getElementById('heroRuntime');
    const heroGenres = document.getElementById('heroGenres');
    const heroPlot = document.getElementById('heroPlot');

    if (heroBackdrop) {
      const backdropUrl = item.backdrop || item.poster || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80';
      heroBackdrop.style.backgroundImage = `url("${backdropUrl}")`;
    }
    if (heroTitle) heroTitle.textContent = item.title || 'Featured Film';
    if (heroRating) heroRating.textContent = item.rating || '8.6';
    if (heroYear) heroYear.textContent = item.year || '2024';
    if (heroRuntime) heroRuntime.textContent = item.runtime || (item.type === 'series' ? 'TV Series' : '2h 15m');
    if (heroGenres) heroGenres.textContent = item.genre || 'Action, Sci-Fi';
    if (heroPlot) heroPlot.textContent = item.plot || 'Experience full high-definition streaming with instant swarm piece prioritization.';
  }

  function createMediaCard(item) {
    const card = document.createElement('div');
    card.className = 'media-card';
    const safeTitle = (item.title || 'Untitled').replace(/"/g, '&quot;');
    const isSeries = item.type === 'series';
    const rating = item.rating || '8.0';
    const posterImg = item.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80';

    card.innerHTML = `
      <div class="media-poster-wrap">
        <img src="${posterImg}" alt="${safeTitle}" class="media-poster" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80'">
        <div class="media-rating-badge">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="#ffb800"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span>${rating}</span>
        </div>
        <div class="media-type-badge ${isSeries ? 'series' : 'movie'}">${isSeries ? 'TV' : 'Movie'}</div>
        <div class="media-overlay">
          <button type="button" class="btn-card-stream-quick" title="Stream Now">
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M8 5v14l11-7z"/></svg>
            <span>Stream Now</span>
          </button>
          <button type="button" class="btn-trailer" data-title="${safeTitle}" data-trailer="${item.trailer || ''}" title="Watch Trailer">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            <span>Trailer</span>
          </button>
        </div>
      </div>
      <div class="media-info">
        <div class="media-title" title="${safeTitle}">${item.title}</div>
        <div class="media-meta">
          <span class="media-year">${item.year}</span>
          <span class="media-genre">${item.genre || (isSeries ? 'Drama, Series' : 'Action, Cinema')}</span>
        </div>
        <button type="button" class="btn-media-open-detail">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <span>${isSeries ? 'Episodes &amp; Streams' : 'Details &amp; Streams'}</span>
        </button>
      </div>
    `;

    // Quick stream button
    const btnQuick = card.querySelector('.btn-card-stream-quick');
    if (btnQuick) {
      btnQuick.addEventListener('click', (e) => {
        e.stopPropagation();
        streamMediaFromDetail(item.title, isSeries ? 'S01E01' : '');
      });
    }

    // Trailer hover button
    const trailerBtn = card.querySelector('.btn-trailer');
    if (trailerBtn) {
      trailerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTrailerModal(trailerBtn.dataset.title, trailerBtn.dataset.trailer);
      });
    }

    // Card click OR Details button
    const openDetailBtn = card.querySelector('.btn-media-open-detail');
    const onOpen = (e) => {
      e.stopPropagation();
      openMediaDetail(item);
    };
    if (openDetailBtn) openDetailBtn.addEventListener('click', onOpen);
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-trailer') && !e.target.closest('.btn-card-stream-quick')) {
        onOpen(e);
      }
    });

    return card;
  }

  function renderStreamingShelves(items) {
    const shelfTrendingGrid = document.getElementById('shelfTrendingGrid');
    const shelfMoviesGrid = document.getElementById('shelfMoviesGrid');
    const shelfShowsGrid = document.getElementById('shelfShowsGrid');

    if (!shelfTrendingGrid || !shelfMoviesGrid || !shelfShowsGrid) return;
    shelfTrendingGrid.innerHTML = '';
    shelfMoviesGrid.innerHTML = '';
    shelfShowsGrid.innerHTML = '';

    // Shelf 1: Trending Now (first 6-8)
    const trending = items.slice(0, 8);
    trending.forEach(item => shelfTrendingGrid.appendChild(createMediaCard(item)));

    // Shelf 2: Movies
    const movies = items.filter(i => i.type === 'movie' || !i.type);
    movies.slice(0, 8).forEach(item => shelfMoviesGrid.appendChild(createMediaCard(item)));

    // Shelf 3: TV Series
    const shows = items.filter(i => i.type === 'series');
    shows.slice(0, 20).forEach(item => shelfShowsGrid.appendChild(createMediaCard(item)));

    if (window.lucide) lucide.createIcons();
  }

  async function loadDiscoverMedia(query = '') {
    if (discoverLoading) discoverLoading.classList.remove('hidden');

    const streamingShelves = document.getElementById('streamingShelves');
    const heroBillboard = document.getElementById('heroBillboard');
    if (!query.trim()) hideUnifiedTorrentShelf();

    try {
      let url = '/api/media/trending';
      if (query.trim()) {
        url = `/api/media/search?q=${encodeURIComponent(query.trim())}&type=${currentDiscoverType}`;
      } else if (currentDiscoverType !== 'all') {
        url = `/api/media/search?q=&type=${currentDiscoverType}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} discover error`);
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];

      if (!query.trim()) {
        allCatalogItems = results;
      }

      if (discoverLoading) discoverLoading.classList.add('hidden');

      if (!query.trim() && currentDiscoverType === 'all' && activeGenre === 'all') {
        // Show rich homepage with Hero Billboard & Curated Shelves
        if (streamingShelves) streamingShelves.classList.remove('hidden');
        if (heroBillboard) heroBillboard.classList.remove('hidden');
        if (discoverGrid) discoverGrid.classList.add('hidden');

        if (results.length > 0) {
          updateHeroBillboard(results[0]);
          renderStreamingShelves(results);
        }
      } else {
        // Filter or search mode: show clean responsive grid
        if (streamingShelves) streamingShelves.classList.add('hidden');
        if (heroBillboard) heroBillboard.classList.add('hidden');
        renderDiscoverGrid(results);
      }
    } catch (err) {
      console.error('[Discover Error]:', err);
      if (discoverLoading) discoverLoading.classList.add('hidden');
      if (discoverGrid) {
        discoverGrid.classList.remove('hidden');
        discoverGrid.innerHTML = `
          <div class="discover-error card">
            <p>Could not load movies: ${err.message}. Showing top recommendations instead.</p>
          </div>
        `;
      }
    }
  }

  function renderDiscoverGrid(items) {
    if (!discoverGrid) return;
    discoverGrid.innerHTML = '';
    discoverGrid.classList.remove('hidden');

    if (!items || items.length === 0) {
      discoverGrid.innerHTML = `
        <div class="discover-empty">
          <h3>No Movies or Shows Found</h3>
          <p>Try searching for a different title or keyword.</p>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      discoverGrid.appendChild(createMediaCard(item));
    });

    if (window.lucide) lucide.createIcons();
  }

  async function fetchAndRenderAvailableStreams(query, seasonEpisode = '') {
    const fullQuery = seasonEpisode ? `${query} ${seasonEpisode}` : query;
    const streamsLoading = document.getElementById('streamsLoading');
    const streamsList = document.getElementById('streamsList');
    if (!streamsList) return;

    streamsList.innerHTML = '';
    if (streamsLoading) streamsLoading.classList.remove('hidden');

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(fullQuery)}&limit=15`);
      const data = await res.json();
      if (streamsLoading) streamsLoading.classList.add('hidden');

      if (data.results && data.results.length > 0) {
        const sorted = [...data.results].sort((a, b) => (Number(b.seeds) || 0) - (Number(a.seeds) || 0));

        sorted.forEach((release, idx) => {
          const card = document.createElement('div');
          const isRec = idx === 0;
          card.className = 'stream-release-card' + (isRec ? ' recommended' : '');

          const titleLower = release.title.toLowerCase();
          const is4K = titleLower.includes('2160p') || titleLower.includes('4k');
          const is1080p = titleLower.includes('1080p');
          const is720p = titleLower.includes('720p');
          const qualityTag = is4K ? '4K UHD' : (is1080p ? '1080p HD' : (is720p ? '720p HD' : 'HD'));

          card.innerHTML = `
            <div class="stream-release-top">
              <span class="stream-quality-tag ${is4K ? 'res-4k' : ''}">${qualityTag}</span>
              <span class="stream-provider-badge">${release.provider || 'BitTorrent'}</span>
              ${isRec ? '<span class="stream-rec-badge">Recommended</span>' : ''}
            </div>
            <div class="stream-release-title" title="${escapeHtml(release.title)}">${escapeHtml(release.title)}</div>
            <div class="stream-release-meta">
              <span>Size: ${escapeHtml(release.size || 'N/A')}</span>
              <span class="stream-seeds-count">${release.seeds || 0} Seeds</span>
            </div>
            <button type="button" class="btn-stream-release">
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M8 5v14l11-7z"/></svg>
              <span>Stream This Release</span>
            </button>
          `;

          const btnStream = card.querySelector('.btn-stream-release');
          btnStream.addEventListener('click', async () => {
            showToast(`Connecting to ${release.provider || 'BitTorrent'} swarm...`, 'info');
            let magnetUri = release.magnet;
            if (!magnetUri || !magnetUri.startsWith('magnet:?')) {
              try {
                const magRes = await fetch('/api/search/magnet', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ torrent: release })
                });
                const magData = await magRes.json();
                magnetUri = magData.magnet;
              } catch (e) {}
            }

            if (magnetUri && magnetUri.startsWith('magnet:?')) {
              switchView('player');
              if (magnetInput) magnetInput.value = magnetUri;
              loadTorrent(magnetUri, {
                type: seasonEpisode ? 'series' : 'movie',
                episode: seasonEpisode || null
              });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              showToast('Could not resolve magnet link for this release', 'error');
            }
          });

          streamsList.appendChild(card);
        });
        if (window.lucide) lucide.createIcons();
      } else {
        streamsList.innerHTML = '<div style="color:var(--text-muted);font-size:0.88rem;padding:12px 0;">No active torrent releases found for this title. Search directly in Torrent Search.</div>';
      }
    } catch (err) {
      if (streamsLoading) streamsLoading.classList.add('hidden');
      streamsList.innerHTML = '<div style="color:var(--text-muted);font-size:0.88rem;padding:12px 0;">Failed to load available releases. Please check your network.</div>';
    }
  }

  // ================================================================
  // MEDIA DETAIL PAGE LOGIC (Full Separate Page)
  // ================================================================
  const btnBackToDiscover = document.getElementById('btnBackToDiscover');
  const crumbDiscover = document.getElementById('crumbDiscover');
  const crumbType = document.getElementById('crumbType');
  const crumbTitle = document.getElementById('crumbTitle');
  const btnDetailNavTrailer = document.getElementById('btnDetailNavTrailer');
  const btnDetailNavStream = document.getElementById('btnDetailNavStream');
  const btnDetailNavStreamText = document.getElementById('btnDetailNavStreamText');

  const detailBackdrop = document.getElementById('detailBackdrop');
  const mediaDetailPoster = document.getElementById('mediaDetailPoster');
  const mediaDetailRating = document.getElementById('mediaDetailRating');
  const mediaDetailTypeBadge = document.getElementById('mediaDetailTypeBadge');
  const mediaDetailYear = document.getElementById('mediaDetailYear');
  const mediaDetailRuntime = document.getElementById('mediaDetailRuntime');
  const mediaDetailStatus = document.getElementById('mediaDetailStatus');
  const mediaDetailTitle = document.getElementById('mediaDetailTitle');
  const mediaDetailGenre = document.getElementById('mediaDetailGenre');
  const mediaDetailPlot = document.getElementById('mediaDetailPlot');
  const mediaDetailDirectorLabel = document.getElementById('mediaDetailDirectorLabel');
  const mediaDetailDirector = document.getElementById('mediaDetailDirector');
  const mediaDetailActors = document.getElementById('mediaDetailActors');

  const btnDetailStream = document.getElementById('btnDetailStream');
  const btnDetailStreamLabel = document.getElementById('btnDetailStreamLabel');
  const btnDetailTrailer = document.getElementById('btnDetailTrailer');
  const btnDetailSearchTorrent = document.getElementById('btnDetailSearchTorrent');

  const detailTrailerSection = document.getElementById('detailTrailerSection');
  const detailTrailerEmbed = document.getElementById('detailTrailerEmbed');
  const btnCloseInlineTrailer = document.getElementById('btnCloseInlineTrailer');

  const mediaDetailTVPanel = document.getElementById('mediaDetailTVPanel');
  const seasonsSummaryBadge = document.getElementById('seasonsSummaryBadge');
  const seasonsTabBar = document.getElementById('seasonsTabBar');
  const currentSeasonHeading = document.getElementById('currentSeasonHeading');
  const currentSeasonEpCount = document.getElementById('currentSeasonEpCount');
  const episodesLoading = document.getElementById('episodesLoading');
  const episodesList = document.getElementById('episodesList');

  const mediaDetailMoviePanel = document.getElementById('mediaDetailMoviePanel');
  const btnMovieDirectStream = document.getElementById('btnMovieDirectStream');

  let currentDetailItem = null;
  let currentDetailSeason = 1;

  // Back Navigation Handlers
  function returnToDiscover() {
    closeInlineTrailer();
    switchView('discover');
  }

  if (btnBackToDiscover) btnBackToDiscover.addEventListener('click', returnToDiscover);
  if (crumbDiscover) crumbDiscover.addEventListener('click', returnToDiscover);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (detailTrailerSection && !detailTrailerSection.classList.contains('hidden')) {
        closeInlineTrailer();
      } else if (detailView && !detailView.classList.contains('hidden')) {
        returnToDiscover();
      }
    }
  });

  // Close inline trailer
  function closeInlineTrailer() {
    if (detailTrailerSection) detailTrailerSection.classList.add('hidden');
    if (detailTrailerEmbed) detailTrailerEmbed.innerHTML = '';
  }
  if (btnCloseInlineTrailer) btnCloseInlineTrailer.addEventListener('click', closeInlineTrailer);

  function openInlineTrailer(title, trailerId) {
    let embedUrl = '';
    if (trailerId && trailerId.trim()) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailerId.trim())}?autoplay=1&rel=0`;
    } else {
      embedUrl = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(title + ' official trailer')}&autoplay=1`;
    }

    if (detailTrailerSection && detailTrailerEmbed) {
      detailTrailerEmbed.innerHTML = `<iframe src="${embedUrl}" title="${title} Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      detailTrailerSection.classList.remove('hidden');
      detailTrailerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      openTrailerModal(title, trailerId);
    }
  }

  // Open Full Page Media Detail
  async function openMediaDetail(item) {
    currentDetailItem = item;
    currentDetailSeason = 1;
    closeInlineTrailer();

    // 1. Breadcrumbs
    if (crumbType) crumbType.textContent = item.type === 'series' ? 'TV Series' : 'Movie';
    if (crumbTitle) crumbTitle.textContent = item.title || 'Untitled';

    // 2. Backdrop & Poster
    const posterImg = item.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80';
    if (detailBackdrop) detailBackdrop.style.backgroundImage = `url("${posterImg}")`;
    if (mediaDetailPoster) {
      mediaDetailPoster.src = posterImg;
      mediaDetailPoster.alt = item.title || '';
    }

    // 3. Ratings & Badges
    if (mediaDetailRating) mediaDetailRating.textContent = item.rating || '--';
    if (mediaDetailTypeBadge) {
      mediaDetailTypeBadge.textContent = item.type === 'series' ? 'TV Series' : 'Movie';
      mediaDetailTypeBadge.className = 'media-type-badge ' + (item.type === 'series' ? 'series' : 'movie');
    }
    if (mediaDetailYear) mediaDetailYear.textContent = item.year || '';
    if (mediaDetailTitle) mediaDetailTitle.textContent = item.title || 'Unknown Title';

    // 4. Genres
    if (mediaDetailGenre) {
      mediaDetailGenre.innerHTML = '';
      (item.genre || '').split(',').map(g => g.trim()).filter(Boolean).forEach(g => {
        const tag = document.createElement('span');
        tag.className = 'genre-tag';
        tag.textContent = g;
        mediaDetailGenre.appendChild(tag);
      });
    }

    // 5. Synopsis & Credits
    if (mediaDetailPlot) mediaDetailPlot.textContent = item.plot || 'No description available for this title.';
    if (mediaDetailDirectorLabel) mediaDetailDirectorLabel.textContent = item.type === 'series' ? 'Creator / Network:' : 'Director:';
    if (mediaDetailDirector) mediaDetailDirector.textContent = item.director || '—';
    if (mediaDetailActors) mediaDetailActors.textContent = item.actors || '—';

    // 6. Action buttons wiring
    const playTrailer = () => openInlineTrailer(item.title, item.trailer || '');
    if (btnDetailTrailer) btnDetailTrailer.onclick = playTrailer;
    if (btnDetailNavTrailer) btnDetailNavTrailer.onclick = playTrailer;

    if (btnDetailSearchTorrent) {
      btnDetailSearchTorrent.onclick = () => {
        switchView('search');
        if (searchInput) {
          searchInput.value = item.title;
          performSearch(item.title, 'All');
        }
      };
    }

    // 7. Series vs Movie Panels
    if (item.type === 'series') {
      if (mediaDetailStatus) {
        mediaDetailStatus.classList.add('hidden');
        mediaDetailStatus.textContent = '';
      }
      if (mediaDetailRuntime) mediaDetailRuntime.textContent = 'Series';
      if (btnDetailStreamLabel) btnDetailStreamLabel.textContent = 'Stream S01E01';
      if (btnDetailNavStreamText) btnDetailNavStreamText.textContent = 'Stream S01E01';

      if (btnDetailStream) btnDetailStream.onclick = () => streamMediaFromDetail(item.title, 'S01E01');
      if (btnDetailNavStream) btnDetailNavStream.onclick = () => streamMediaFromDetail(item.title, 'S01E01');

      if (mediaDetailTVPanel) mediaDetailTVPanel.classList.remove('hidden');
      if (mediaDetailMoviePanel) mediaDetailMoviePanel.classList.add('hidden');

      // Switch to detail view right away for instant responsiveness
      switchView('detail');
      if (window.lucide) lucide.createIcons();

      // Fetch accurate seasons and episodes
      await loadSeasonTabs(item);
    } else {
      if (mediaDetailStatus) mediaDetailStatus.classList.add('hidden');
      if (mediaDetailRuntime) mediaDetailRuntime.textContent = 'Feature Film';
      if (btnDetailStreamLabel) btnDetailStreamLabel.textContent = 'Stream Movie in HD';
      if (btnDetailNavStreamText) btnDetailNavStreamText.textContent = 'Stream Movie';

      const streamMovie = () => streamMediaFromDetail(item.title);
      if (btnDetailStream) btnDetailStream.onclick = streamMovie;
      if (btnDetailNavStream) btnDetailNavStream.onclick = streamMovie;
      if (btnMovieDirectStream) btnMovieDirectStream.onclick = streamMovie;

      if (mediaDetailTVPanel) mediaDetailTVPanel.classList.add('hidden');
      if (mediaDetailMoviePanel) mediaDetailMoviePanel.classList.remove('hidden');

      // Switch to detail view
      switchView('detail');
      if (window.lucide) lucide.createIcons();
    }

    // Automatically scan & populate Available Torrent Streams list for this title
    fetchAndRenderAvailableStreams(item.title, item.type === 'series' ? 'S01E01' : '');
  }

  // Stream Media helper with strict size limits:
  // - TV Show Episode: < 1 GB (and highest seeders)
  // - Movie: < 5 GB (and highest seeders)
  async function streamMediaFromDetail(title, seasonEpisode = '') {
    const isEpisode = Boolean(seasonEpisode);
    const maxSize = isEpisode ? (1024 * 1024 * 1024) : (5 * 1024 * 1024 * 1024); // 1GB for TV, 5GB for Movies
    const sizeLabel = isEpisode ? 'under 1 GB' : 'under 5 GB';

    const query = seasonEpisode ? `${title} ${seasonEpisode}` : title;
    showToast(`Searching highest-seeded release (${sizeLabel}) for "${query}"...`, 'info');

    try {
      const searchUrl = `/api/search?q=${encodeURIComponent(query)}&limit=25`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (searchData.results && searchData.results.length > 0) {
        // Priority 1: Torrents strictly below the size limit, sorted by seeds (descending)
        const validCandidates = searchData.results
          .filter(c => {
            const bytes = parseSizeToBytes(c.size);
            return bytes > 0 && bytes <= maxSize;
          })
          .sort((a, b) => (Number(b.seeds) || 0) - (Number(a.seeds) || 0));

        // Priority 2: Torrents where size is not provided in metadata, sorted by seeds
        const unknownSizeCandidates = searchData.results
          .filter(c => parseSizeToBytes(c.size) === 0)
          .sort((a, b) => (Number(b.seeds) || 0) - (Number(a.seeds) || 0));

        // Priority 3: Fallback torrents above the limit if nothing under limit was found
        const oversizedCandidates = searchData.results
          .filter(c => {
            const bytes = parseSizeToBytes(c.size);
            return bytes > maxSize;
          })
          .sort((a, b) => (Number(b.seeds) || 0) - (Number(a.seeds) || 0));

        const candidates = [...validCandidates, ...unknownSizeCandidates, ...oversizedCandidates];

        // Select the candidate with highest seeders that successfully yields a playable magnet
        for (const candidate of candidates) {
          let magnetUri = candidate.magnet;

          if (!magnetUri || !magnetUri.startsWith('magnet:?')) {
            try {
              const magRes = await fetch('/api/search/magnet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ torrent: candidate })
              });
              const magJson = await magRes.json();
              magnetUri = magJson.magnet;
            } catch (resolveErr) {
              console.warn(`[Stream Selection] Magnet resolution failed for "${candidate.title}", trying next candidate...`);
              continue;
            }
          }

          if (magnetUri && magnetUri.startsWith('magnet:?')) {
            const seedCount = Number(candidate.seeds) || 0;
            const sizeStr = candidate.size || 'unknown size';
            showToast(`Selected: ${seedCount} seeders, ${sizeStr} (${candidate.provider || 'BitTorrent'})`, 'success');
            switchView('player');
            if (magnetInput) magnetInput.value = magnetUri;
            loadTorrent(magnetUri, {
              type: isEpisode ? 'series' : 'movie',
              episode: seasonEpisode || null
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
      }

      // Fallback: open torrent search view pre-filled if no direct match resolved
      showToast(`Finding torrent releases for "${query}"...`, 'info');
      switchView('search');
      if (searchInput) {
        searchInput.value = query;
        performSearch(query, 'All');
      }
    } catch (err) {
      console.error('[Detail Stream Error]:', err);
      switchView('search');
      if (searchInput) {
        searchInput.value = query;
        performSearch(query, 'All');
      }
    }
  }

  // Load Seasons Tabs with real season count & episode counts
  async function loadSeasonTabs(item) {
    if (!seasonsTabBar) return;
    seasonsTabBar.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;padding:8px 0">Fetching accurate seasons from database...</span>';
    if (episodesList) episodesList.innerHTML = '';
    if (episodesLoading) episodesLoading.classList.remove('hidden');

    let totalSeasons = 1;
    let seasonsArray = [];

    try {
      const r = await fetch(`/api/media/seasons?imdbId=${encodeURIComponent(item.id || '')}&title=${encodeURIComponent(item.title || '')}`);
      if (r.ok) {
        const d = await r.json();
        totalSeasons = d.totalSeasons || 1;
        if (Array.isArray(d.seasons) && d.seasons.length > 0) {
          seasonsArray = d.seasons;
        }
        if (d.status && mediaDetailStatus) {
          mediaDetailStatus.textContent = d.status;
          mediaDetailStatus.classList.remove('hidden');
        }
      }
    } catch (e) {
      console.warn('[Seasons Load Error]:', e);
    }

    if (seasonsArray.length === 0) {
      seasonsArray = Array.from({ length: totalSeasons }, (_, i) => ({
        number: i + 1,
        episodeCount: 10
      }));
    }

    if (seasonsSummaryBadge) {
      seasonsSummaryBadge.textContent = `${seasonsArray.length} Season${seasonsArray.length > 1 ? 's' : ''}`;
    }
    if (mediaDetailRuntime) {
      mediaDetailRuntime.textContent = `${seasonsArray.length} Season${seasonsArray.length > 1 ? 's' : ''}`;
    }

    // Render Season selection tabs
    seasonsTabBar.innerHTML = '';
    seasonsArray.forEach((sObj, idx) => {
      const sNum = sObj.number || (idx + 1);
      const epCount = sObj.episodeCount ? `${sObj.episodeCount} eps` : '';

      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'season-tab' + (idx === 0 ? ' active' : '');
      tab.dataset.season = sNum;
      tab.innerHTML = `<span>Season ${sNum}</span>${epCount ? `<span class="ep-count-pill">${epCount}</span>` : ''}`;

      tab.addEventListener('click', async () => {
        document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentDetailSeason = sNum;
        if (currentSeasonHeading) currentSeasonHeading.textContent = `Season ${sNum}`;
        await loadEpisodes(item, sNum);
      });

      seasonsTabBar.appendChild(tab);
    });

    if (currentSeasonHeading) currentSeasonHeading.textContent = `Season ${seasonsArray[0]?.number || 1}`;

    // Load Season 1 episodes
    await loadEpisodes(item, seasonsArray[0]?.number || 1);
  }

  // Load Episodes with real titles, episode numbers, thumbnails, ratings & overviews
  async function loadEpisodes(item, season) {
    if (episodesLoading) episodesLoading.classList.remove('hidden');
    if (episodesList) episodesList.innerHTML = '';
    if (currentSeasonEpCount) currentSeasonEpCount.textContent = 'Loading episodes...';

    let episodes = [];
    try {
      const r = await fetch(`/api/media/episodes?imdbId=${encodeURIComponent(item.id || '')}&title=${encodeURIComponent(item.title || '')}&season=${season}`);
      if (r.ok) {
        const d = await r.json();
        episodes = Array.isArray(d.episodes) ? d.episodes : [];
      }
    } catch (e) {
      console.warn('[Episodes Load Error]:', e);
    }

    if (episodesLoading) episodesLoading.classList.add('hidden');

    if (currentSeasonEpCount) {
      currentSeasonEpCount.textContent = `${episodes.length} Episode${episodes.length !== 1 ? 's' : ''}`;
    }

    if (episodes.length === 0) {
      if (episodesList) {
        episodesList.innerHTML = '<p style="color:var(--text-muted);padding:24px 0;grid-column:1/-1">No episode data available for this season.</p>';
      }
      return;
    }

    episodes.forEach(ep => {
      const card = document.createElement('div');
      card.className = 'episode-card';

      const seasonEpCode = `S${String(season).padStart(2, '0')}E${String(ep.episode).padStart(2, '0')}`;
      const epTitle = ep.title || `Episode ${ep.episode}`;
      const epThumb = ep.image || item.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80';
      const epPlot = ep.plot || 'No episode synopsis available.';
      const epRating = ep.rating ? `★ ${ep.rating}` : '';
      const epRuntime = ep.runtime || '45 min';
      const epAirDate = ep.airDate || '';

      card.innerHTML = `
        <div class="ep-thumb-container">
          <img src="${epThumb}" alt="${epTitle}" class="ep-thumb-img" loading="lazy">
          <div class="ep-thumb-overlay">
            <span class="ep-code-badge">${seasonEpCode}</span>
            <span class="ep-runtime-badge">${epRuntime}</span>
          </div>
        </div>
        <div class="ep-body">
          <div class="ep-title-row">
            <h4 class="ep-card-title">${ep.episode}. ${epTitle}</h4>
            ${epRating ? `<span class="ep-card-rating">${epRating}</span>` : ''}
          </div>
          <div class="ep-card-meta">
            ${epAirDate ? `<span>${epAirDate}</span>` : ''}
            <span>•</span>
            <span style="color:var(--primary)">${seasonEpCode}</span>
          </div>
          <p class="ep-card-plot">${epPlot}</p>
          <div class="ep-actions-row">
            <button type="button" class="btn-ep-play">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
              <span>Stream ${seasonEpCode}</span>
            </button>
            <button type="button" class="btn-ep-torrents" title="Search all torrent releases for ${seasonEpCode}">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span>Torrents</span>
            </button>
          </div>
        </div>
      `;

      // Stream Episode button
      const playBtn = card.querySelector('.btn-ep-play');
      if (playBtn) {
        playBtn.addEventListener('click', async () => {
          const originalText = playBtn.innerHTML;
          playBtn.disabled = true;
          playBtn.innerHTML = '<span>Searching Swarm...</span>';
          try {
            await streamMediaFromDetail(item.title, seasonEpCode);
          } finally {
            playBtn.disabled = false;
            playBtn.innerHTML = originalText;
          }
        });
      }

      // Torrents search button
      const torrentsBtn = card.querySelector('.btn-ep-torrents');
      if (torrentsBtn) {
        torrentsBtn.addEventListener('click', () => {
          const q = `${item.title} ${seasonEpCode}`;
          switchView('search');
          if (searchInput) {
            searchInput.value = q;
            performSearch(q, 'All');
          }
        });
      }

      episodesList.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  // --- Trailer Modal Logic ---
  function openTrailerModal(title, trailerId) {
    if (!trailerModal || !trailerIframe) return;

    if (trailerModalTitle) {
      trailerModalTitle.textContent = `${title} — Official Trailer`;
    }

    let embedUrl = '';
    if (trailerId && trailerId.trim()) {
      embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(trailerId)}?autoplay=1&rel=0`;
    } else {
      // Free YouTube search query fallback embed
      embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(title + ' official trailer')}&autoplay=1`;
    }

    trailerIframe.src = embedUrl;
    trailerModal.classList.remove('hidden');
  }

  function closeTrailerModal() {
    if (!trailerModal || !trailerIframe) return;
    trailerIframe.src = '';
    trailerModal.classList.add('hidden');
  }

  if (btnCloseTrailer) btnCloseTrailer.addEventListener('click', closeTrailerModal);
  if (trailerModal) {
    trailerModal.addEventListener('click', (e) => {
      if (e.target === trailerModal) closeTrailerModal();
    });
  }

  // Discover Form & Filters
  if (discoverForm) {
    discoverForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = discoverInput ? discoverInput.value.trim() : '';
      loadDiscoverMedia(q);
    });
  }

  if (discoverInput) {
    discoverInput.addEventListener('input', () => {
      if (btnDiscoverClear) {
        btnDiscoverClear.classList.toggle('hidden', !discoverInput.value);
      }
    });
  }

  if (btnDiscoverClear) {
    btnDiscoverClear.addEventListener('click', () => {
      if (discoverInput) discoverInput.value = '';
      btnDiscoverClear.classList.add('hidden');
      loadDiscoverMedia('');
    });
  }

  if (discoverTypePills) {
    const pills = discoverTypePills.querySelectorAll('.cat-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentDiscoverType = pill.dataset.type || 'all';
        const q = discoverInput ? discoverInput.value.trim() : '';
        loadDiscoverMedia(q);
      });
    });
  }

  discoverQuickTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const title = tag.dataset.title || '';
      if (discoverInput) discoverInput.value = title;
      if (btnDiscoverClear) btnDiscoverClear.classList.remove('hidden');
      loadDiscoverMedia(title);
    });
  });

  // Modal Handlers
  btnShortcuts.onclick = () => shortcutsModal.classList.remove('hidden');
  btnCloseModal.onclick = () => shortcutsModal.classList.add('hidden');
  shortcutsModal.onclick = (e) => {
    if (e.target === shortcutsModal) shortcutsModal.classList.add('hidden');
  };

  // --- Cinema Platform Global Search, Hero Billboard & Genre Filters ---
  if (globalSearchForm) {
    globalSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = globalSearchInput ? globalSearchInput.value.trim() : '';
      if (!q) return;
      runUnifiedSearch(q);
    });
  }

  if (globalSearchInput) {
    let searchDebounce = null;
    globalSearchInput.addEventListener('input', () => {
      const val = globalSearchInput.value;
      if (btnGlobalSearchClear) btnGlobalSearchClear.classList.toggle('hidden', !val);
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        if (val.trim().length >= 2) {
          runUnifiedSearch(val.trim());
        } else if (val.trim().length === 0) {
          hideUnifiedTorrentShelf();
          switchView('discover');
          loadDiscoverMedia('');
        }
      }, 350);
    });
  }

  if (btnGlobalSearchClear) {
    btnGlobalSearchClear.addEventListener('click', () => {
      if (globalSearchInput) globalSearchInput.value = '';
      btnGlobalSearchClear.classList.add('hidden');
      hideUnifiedTorrentShelf();
      loadDiscoverMedia('');
    });
  }

  async function runUnifiedSearch(query) {
    switchView('discover');
    if (searchInput) {
      searchInput.value = query;
      if (btnSearchClear) btnSearchClear.classList.remove('hidden');
    }
    loadDiscoverMedia(query);
    fetchUnifiedTorrentResults(query);
  }

  function hideUnifiedTorrentShelf() {
    const shelf = document.getElementById('unifiedTorrentShelf');
    if (shelf) shelf.classList.add('hidden');
  }

  async function fetchUnifiedTorrentResults(query) {
    const shelf = document.getElementById('unifiedTorrentShelf');
    const grid = document.getElementById('unifiedTorrentGrid');
    const status = document.getElementById('unifiedTorrentStatus');
    if (!shelf || !grid) return;
    shelf.classList.remove('hidden');
    grid.innerHTML = '';
    if (status) status.textContent = 'Searching torrent swarms…';

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&category=Movies&limit=8`);
      if (!res.ok) throw new Error('search failed');
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];
      results.sort((a, b) => (Number(b.seeds) || 0) - (Number(a.seeds) || 0));
      const top = results.slice(0, 8);

      if (status) {
        status.textContent = top.length
          ? `${top.length} playable torrents — click Stream to watch instantly`
          : 'No torrent matches. Try Torrent Search for more sources.';
      }

      top.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'unified-torrent-card';
        const seeds = Number(item.seeds) || 0;
        card.innerHTML = `
          <div class="unified-torrent-title" title="${escapeHtml(item.title || '')}">${escapeHtml(item.title || 'Untitled')}</div>
          <div class="unified-torrent-meta">
            <span>${escapeHtml(item.size || 'N/A')}</span>
            <span class="seeds">${seeds} seeds</span>
            <span>${escapeHtml(item.provider || '')}</span>
          </div>
          <button type="button" class="btn-card-stream">Stream Now</button>
        `;
        card.querySelector('.btn-card-stream').addEventListener('click', async () => {
          let magnetUri = item.magnet;
          if (!magnetUri || !magnetUri.startsWith('magnet:?')) {
            try {
              const magRes = await fetch('/api/search/magnet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ torrent: item })
              });
              const magData = await magRes.json();
              magnetUri = magData.magnet;
            } catch (e) {}
          }
          if (magnetUri && magnetUri.startsWith('magnet:?')) {
            if (magnetInput) magnetInput.value = magnetUri;
            loadTorrent(magnetUri, { type: 'movie' });
          } else {
            showToast('Could not resolve magnet for this title', 'error');
          }
        });
        grid.appendChild(card);
      });
    } catch (err) {
      if (status) status.textContent = 'Torrent search unavailable right now.';
    }
  }

  // Hero Billboard Action Buttons
  const btnHeroStream = document.getElementById('btnHeroStream');
  const btnHeroTrailer = document.getElementById('btnHeroTrailer');
  const btnHeroDetails = document.getElementById('btnHeroDetails');

  if (btnHeroStream) {
    btnHeroStream.addEventListener('click', () => {
      if (currentFeaturedHero) {
        streamMediaFromDetail(currentFeaturedHero.title, currentFeaturedHero.type === 'series' ? 'S01E01' : '');
      } else {
        streamMediaFromDetail('Dune: Part Two');
      }
    });
  }

  if (btnHeroTrailer) {
    btnHeroTrailer.addEventListener('click', () => {
      if (currentFeaturedHero) {
        openTrailerModal(currentFeaturedHero.title, currentFeaturedHero.trailer || '');
      } else {
        openTrailerModal('Dune: Part Two', 'Way9Dexny3w');
      }
    });
  }

  if (btnHeroDetails) {
    btnHeroDetails.addEventListener('click', () => {
      if (currentFeaturedHero) {
        openMediaDetail(currentFeaturedHero);
      }
    });
  }

  // Genre Filters Bar
  const genrePillEls = document.querySelectorAll('.genre-pill');
  genrePillEls.forEach(pill => {
    pill.addEventListener('click', () => {
      genrePillEls.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeGenre = pill.dataset.genre || 'all';

      const streamingShelves = document.getElementById('streamingShelves');
      const heroBillboard = document.getElementById('heroBillboard');

      if (activeGenre === 'all') {
        if (streamingShelves) streamingShelves.classList.remove('hidden');
        if (heroBillboard) heroBillboard.classList.remove('hidden');
        if (discoverGrid) discoverGrid.classList.add('hidden');
        renderStreamingShelves(allCatalogItems);
      } else {
        if (streamingShelves) streamingShelves.classList.add('hidden');
        if (heroBillboard) heroBillboard.classList.add('hidden');
        const filtered = allCatalogItems.filter(item => {
          return item.genre && item.genre.toLowerCase().includes(activeGenre.toLowerCase());
        });
        renderDiscoverGrid(filtered);
      }
    });
  });

  // --- Initial Startup: Open Movie Streaming Home Catalog ---
  switchView('discover');
});

