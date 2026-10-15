import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, ExternalLink, AlertCircle, Copy, Check, X } from 'lucide-react';

interface MediaEmbedProps {
  url: string;
  title?: string;
  autoplay?: boolean;
  embedType?: 'video' | 'music';
}

export interface SpotifyEmbedInfo {
  embedUrl: string;
  type: 'track' | 'album' | 'playlist' | 'artist' | 'episode' | 'show';
  id: string;
}

// In-app browser detection (Instagram, LinkedIn, Facebook, etc.)
export function checkIsInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  // Allow manual testing via ?inapp=true in URL
  if (window.location.search.includes('inapp=true')) return true;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /Instagram|LinkedInApp|FBAN|FBAV|Twitter|Snapchat/i.test(ua);
}

// Open link inside Chrome / native external browser
export function openInExternalBrowser(customUrl?: string) {
  const currentUrl = customUrl || (typeof window !== 'undefined' ? window.location.href : '');
  if (!currentUrl) return;

  const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, '');
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid) {
    // Android Chrome Intent - directly opens Google Chrome
    const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    return;
  }

  if (isIOS) {
    // iOS Google Chrome URL scheme
    const chromeScheme = `googlechrome://${urlWithoutProtocol}`;
    window.location.href = chromeScheme;
    return;
  }

  window.open(currentUrl, '_blank');
}

// Banner displayed directly under media players when viewed in Instagram/LinkedIn
export function InAppBrowserNotice({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpen();
      }}
      className="w-full mt-2 p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 flex items-center justify-between gap-2.5 cursor-pointer transition-all active:scale-[0.99] group select-none shadow-sm"
    >
      <div className="flex items-center gap-2 min-w-0 text-left">
        <AlertCircle size={16} className="text-amber-400 shrink-0" />
        <span className="text-[11px] font-medium text-amber-200/95 leading-tight">
          Please open this link in Chrome. Cannot play this audio or video in Instagram and LinkedIn browser.
        </span>
      </div>
      <span className="shrink-0 text-[10px] font-bold text-amber-300 bg-amber-500/20 group-hover:bg-amber-500/30 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors">
        Open Chrome <ExternalLink size={11} />
      </span>
    </div>
  );
}

// Modal helper to guide users to open in Chrome or copy the link
export function InAppBrowserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 p-5 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-3.5 shadow-lg">
          <AlertCircle size={24} />
        </div>

        <h3 className="text-base font-extrabold text-white mb-1.5">
          Open in Chrome to Play
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Instagram and LinkedIn in-app browsers restrict background audio & video playback inside iframes. Open this link in Chrome for full uninterrupted playback.
        </p>

        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={() => openInExternalBrowser()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <span>Open in Chrome</span>
            <ExternalLink size={15} />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold">Link Copied! Paste in Chrome</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-slate-300" />
                <span>Copy Page Link</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/5 text-[11px] text-slate-400 leading-normal">
          <p className="font-semibold text-slate-200 mb-1">💡 Quick Tip for Instagram / LinkedIn:</p>
          <p>
            Tap the <span className="font-bold text-white">3 dots (•••)</span> in the top-right corner of your screen and select <span className="font-bold text-white">"Open in external browser"</span> or <span className="font-bold text-white">"Open in Chrome"</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// Extract YouTube Video ID
export function getYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const raw = url.trim();
  const iframeMatch = raw.match(/<iframe.*?src=["'](.*?)["']/i);
  const target = iframeMatch ? iframeMatch[1] : raw;
  const clean = target.replace(/^(https?:\/\/)?/, 'https://');

  try {
    const parsed = new URL(clean);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) return v;
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'live', 'v'].includes(pathParts[0]) && pathParts[1]) {
        return pathParts[1];
      }
    }
    if (parsed.hostname === 'youtu.be' || parsed.hostname.endsWith('.youtu.be')) {
      return parsed.pathname.slice(1).split('?')[0];
    }
  } catch {
    return null;
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return Boolean(getYouTubeVideoId(url));
}

// Extract YouTube embed URL
export function getYouTubeEmbedUrl(url: string, autoplay: boolean = false): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;

  const embedBase = `https://www.youtube-nocookie.com/embed/${id}`;
  if (autoplay) {
    return `${embedBase}?autoplay=1&mute=0&enablejsapi=1`;
  }
  return embedBase;
}

// Minimal Audio Player Card for YouTube (Instagram, LinkedIn & mobile WebViews bulletproof)
function YouTubeMinimalMusicCard({
  videoId,
  title,
  autoplay = false,
}: {
  videoId: string;
  title?: string;
  autoplay?: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [pendingPlay, setPendingPlay] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [showInAppModal, setShowInAppModal] = useState(false);
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-audio-${videoId}-${Math.random().toString(36).substring(2, 7)}`).current;

  useEffect(() => {
    setIsInApp(checkIsInAppBrowser());
  }, []);

  // Execute playback with mobile WebView unmute fallback sequence
  const startPlayback = () => {
    if (!playerRef.current) return;
    try {
      playerRef.current.unMute();
      playerRef.current.playVideo();
    } catch (e) {
      try {
        playerRef.current.mute();
        playerRef.current.playVideo();
        setTimeout(() => {
          try {
            playerRef.current.unMute();
          } catch {}
        }, 150);
      } catch {}
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted || !(window as any).YT || !(window as any).YT.Player) return;
      if (playerRef.current) return; // already initialized

      try {
        playerRef.current = new (window as any).YT.Player(containerId, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
            widget_referrer: typeof window !== 'undefined' ? window.location.href : undefined,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsReady(true);

              // Crucial permissions for Instagram/LinkedIn WebViews
              try {
                const iframe = event.target.getIframe?.();
                if (iframe) {
                  iframe.setAttribute('allow', 'autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture');
                  iframe.setAttribute('playsinline', '1');
                  iframe.setAttribute('webkit-playsinline', '1');
                }
              } catch {}

              // If user tapped before player was ready OR autoplay is on
              if (autoplay || pendingPlay) {
                startPlayback();
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2 || event.data === 0) {
                setIsPlaying(false);
              }
            },
            onError: (err: any) => {
              console.warn('YouTube audio player error:', err);
            },
          },
        });
      } catch (err) {
        console.warn('YouTube audio player init error:', err);
      }
    };

    // 1. Direct initialization if YT is already available
    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      // 2. Inject script if not present
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.body.appendChild(tag);
      }

      const prevHandler = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevHandler) prevHandler();
        if (isMounted) initPlayer();
      };
    }

    // 3. Fallback poller for Instagram/LinkedIn WebViews (in case onYouTubeIframeAPIReady missed)
    const poller = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player && !playerRef.current) {
        initPlayer();
        clearInterval(poller);
      }
    }, 100);
    const stopPollerTimeout = setTimeout(() => clearInterval(poller), 6000);

    return () => {
      isMounted = false;
      clearInterval(poller);
      clearTimeout(stopPollerTimeout);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [videoId, autoplay, pendingPlay]);

  const togglePlay = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If viewed within Instagram or LinkedIn in-app browser, prompt user to open in Chrome
    if (isInApp) {
      openInExternalBrowser();
      setShowInAppModal(true);
      return;
    }

    // If player not initialized yet, queue play request
    if (!playerRef.current || !isReady) {
      setPendingPlay(true);
      return;
    }

    if (isPlaying) {
      try {
        playerRef.current.pauseVideo();
      } catch {}
    } else {
      startPlayback();
    }
  };

  const displayTitle = (title && title.trim() && title.trim().toLowerCase() !== 'new link') 
    ? title.trim() 
    : 'YouTube Audio Track';

  return (
    <div className="w-full">
      <div
        onClick={togglePlay}
        onTouchEnd={togglePlay}
        className={`w-full rounded-2xl p-3 my-2 transition-all duration-300 cursor-pointer border shadow-lg backdrop-blur-xl group relative overflow-hidden select-none ${
          isPlaying
            ? 'bg-rose-950/40 border-rose-500/40 shadow-rose-950/30 ring-1 ring-rose-500/20'
            : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
        }`}
      >
        {/* Content Layer (Above hidden iframe) */}
        <div className="relative z-10 w-full flex items-center justify-between gap-3">
          {/* Thumbnail with Vinyl/Track Badge */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md bg-black/40">
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt={displayTitle}
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : ''}`}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              </div>
            )}
          </div>

          {/* Title & Animated Equalizer Waves */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-extrabold text-white truncate group-hover:text-rose-300 transition-colors">
              {displayTitle}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${isPlaying ? 'bg-rose-500 animate-pulse' : (pendingPlay ? 'bg-amber-400 animate-ping' : 'bg-slate-500')}`} />
                {isPlaying ? 'Playing Music' : (pendingPlay ? 'Starting Audio...' : (isInApp ? 'Tap to Open in Chrome' : 'Tap to Play'))}
              </span>

              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-3" />
                  <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.8s_ease-in-out_infinite_0.15s] h-2" />
                  <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.3s] h-3" />
                  <span className="w-0.5 bg-rose-500 rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.1s] h-1.5" />
                </div>
              )}
            </div>
          </div>

          {/* Minimal Play / Pause Round Button */}
          <button
            type="button"
            onClick={togglePlay}
            onTouchEnd={togglePlay}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 ${
              isPlaying
                ? 'bg-rose-600 text-white shadow-rose-600/40'
                : 'bg-white/10 group-hover:bg-rose-600 text-white group-hover:shadow-rose-600/30'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} className="translate-x-0.5" />}
          </button>
        </div>

        {/* Background Active Non-Zero Iframe Container for Instagram/LinkedIn WebViews */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
          style={{
            opacity: 0.005,
            zIndex: 0,
            width: '100%',
            height: '100%',
          }}
          aria-hidden="true"
        >
          <div id={containerId} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* Warning Notice for Instagram & LinkedIn Browsers */}
      {isInApp && (
        <InAppBrowserNotice onOpen={() => {
          openInExternalBrowser();
          setShowInAppModal(true);
        }} />
      )}

      {/* Guide Modal */}
      <InAppBrowserModal
        isOpen={showInAppModal}
        onClose={() => setShowInAppModal(false)}
      />
    </div>
  );
}

// Extract Spotify embed info
export function getSpotifyEmbedInfo(url: string): SpotifyEmbedInfo | null {
  if (!url || typeof url !== 'string') return null;
  const raw = url.trim();

  // If user pasted an iframe tag
  const iframeMatch = raw.match(/<iframe.*?src=["'](.*?)["']/i);
  const target = iframeMatch ? iframeMatch[1] : raw;

  // Handle Spotify URI format (e.g., spotify:track:4cOdK2wGLETKBW3PvgPWqT)
  const uriMatch = target.match(/^spotify:(track|album|playlist|artist|episode|show):([a-zA-Z0-9]+)/i);
  if (uriMatch) {
    const type = uriMatch[1].toLowerCase() as SpotifyEmbedInfo['type'];
    const id = uriMatch[2];
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`,
    };
  }

  // Handle web URLs (e.g. open.spotify.com/track/..., open.spotify.com/intl-en/track/..., etc.)
  const clean = target.replace(/^(https?:\/\/)?/, 'https://');
  try {
    const parsed = new URL(clean);
    if (!parsed.hostname.includes('spotify.com')) return null;

    const match = parsed.pathname.match(/(?:intl-[a-z]{2,5}\/)?(?:embed\/)?(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/i);
    if (match) {
      const type = match[1].toLowerCase() as SpotifyEmbedInfo['type'];
      const id = match[2];
      return {
        type,
        id,
        embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`,
      };
    }
  } catch {
    return null;
  }
  return null;
}

// Extract Spotify embed URL string
export function getSpotifyEmbedUrl(url: string): string | null {
  return getSpotifyEmbedInfo(url)?.embedUrl || null;
}

export function isEmbeddableUrl(url: string): boolean {
  if (!url) return false;
  return Boolean(getYouTubeEmbedUrl(url) || getSpotifyEmbedInfo(url));
}

export default function MediaEmbed({ url, title, autoplay = false, embedType = 'video' }: MediaEmbedProps) {
  const [isInApp, setIsInApp] = useState(false);
  const [showInAppModal, setShowInAppModal] = useState(false);

  useEffect(() => {
    setIsInApp(checkIsInAppBrowser());
  }, []);

  const handleOpenInAppModal = () => {
    openInExternalBrowser();
    setShowInAppModal(true);
  };

  const ytVideoId = getYouTubeVideoId(url);
  if (ytVideoId) {
    if (embedType === 'music') {
      return (
        <YouTubeMinimalMusicCard
          videoId={ytVideoId}
          title={title}
          autoplay={autoplay}
        />
      );
    }

    const ytUrl = getYouTubeEmbedUrl(url, autoplay);
    return (
      <div className="w-full my-2">
        <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/40 aspect-video relative">
          <iframe
            src={ytUrl!}
            title={title || 'YouTube Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0 absolute inset-0"
          />
        </div>

        {isInApp && <InAppBrowserNotice onOpen={handleOpenInAppModal} />}

        <InAppBrowserModal
          isOpen={showInAppModal}
          onClose={() => setShowInAppModal(false)}
        />
      </div>
    );
  }

  const spotifyInfo = getSpotifyEmbedInfo(url);
  if (spotifyInfo) {
    const isFullPlayer = ['album', 'playlist', 'artist', 'show'].includes(spotifyInfo.type);
    const height = embedType === 'music'
      ? (isFullPlayer ? 152 : 80)
      : (isFullPlayer ? 352 : 152);

    const embedUrl = autoplay
      ? `${spotifyInfo.embedUrl}&autoplay=1`
      : spotifyInfo.embedUrl;

    return (
      <div className="w-full my-2">
        <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-slate-950/80">
          <iframe
            src={embedUrl}
            title={title || `Spotify ${spotifyInfo.type}`}
            width="100%"
            height={height}
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="eager"
            className="w-full border-0 block"
            style={{ borderRadius: '12px', minHeight: `${height}px` }}
          />
        </div>

        {isInApp && <InAppBrowserNotice onOpen={handleOpenInAppModal} />}

        <InAppBrowserModal
          isOpen={showInAppModal}
          onClose={() => setShowInAppModal(false)}
        />
      </div>
    );
  }

  return null;
}
