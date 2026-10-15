import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

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

// Minimal Audio Player Card for YouTube
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
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-audio-${videoId}-${Math.random().toString(36).substring(2, 7)}`).current;

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted || !(window as any).YT || !(window as any).YT.Player) return;

      try {
        playerRef.current = new (window as any).YT.Player(containerId, {
          height: '1',
          width: '1',
          videoId: videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              if (autoplay) {
                try {
                  event.target.playVideo();
                } catch {}
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              if (event.data === 1) {
                setIsPlaying(true);
              } else {
                setIsPlaying(false);
              }
            },
          },
        });
      } catch (err) {
        console.warn('YouTube audio player init error:', err);
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }

      const prevHandler = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevHandler) prevHandler();
        if (isMounted) initPlayer();
      };
    }

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [videoId, autoplay]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (err) {
      console.warn('Failed to toggle play:', err);
    }
  };

  return (
    <div
      onClick={togglePlay}
      className={`w-full rounded-2xl p-3 my-2 transition-all duration-300 cursor-pointer border shadow-lg backdrop-blur-xl flex items-center justify-between gap-3 group relative overflow-hidden select-none ${
        isPlaying
          ? 'bg-rose-950/40 border-rose-500/40 shadow-rose-950/30 ring-1 ring-rose-500/20'
          : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
      }`}
    >
      {/* Thumbnail with Vinyl/Track Badge */}
      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md bg-black/40">
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={title || 'Track'}
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
          {(title && title.trim() && title.trim().toLowerCase() !== 'new link') ? title.trim() : 'YouTube Audio Track'}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-slate-500'}`} />
            {isPlaying ? 'Playing Music' : 'Minimal Player'}
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
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 ${
          isPlaying
            ? 'bg-rose-600 text-white shadow-rose-600/40'
            : 'bg-white/10 group-hover:bg-rose-600 text-white group-hover:shadow-rose-600/30'
        }`}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={17} /> : <Play size={17} className="translate-x-0.5" />}
      </button>

      {/* Hidden YouTube Iframe Mount (0x0 offscreen) */}
      <div style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div id={containerId} />
      </div>
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
      <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/40 aspect-video relative my-2">
        <iframe
          src={ytUrl!}
          title={title || 'YouTube Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
        />
      </div>
    );
  }

  const spotifyInfo = getSpotifyEmbedInfo(url);
  if (spotifyInfo) {
    const isFullPlayer = ['album', 'playlist', 'artist', 'show'].includes(spotifyInfo.type);
    const height = isFullPlayer ? 352 : 152;
    const elementRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<any>(null);

    useEffect(() => {
      if (!autoplay) return;

      let isMounted = true;

      const initSpotifyApi = (IFrameAPI: any) => {
        if (!elementRef.current || !isMounted) return;
        elementRef.current.innerHTML = '';

        const options = {
          width: '100%',
          height: `${height}`,
          uri: `spotify:${spotifyInfo.type}:${spotifyInfo.id}`,
        };

        try {
          IFrameAPI.createController(elementRef.current, options, (EmbedController: any) => {
            if (!isMounted) {
              try { EmbedController.destroy(); } catch {}
              return;
            }
            controllerRef.current = EmbedController;

            EmbedController.addListener('ready', () => {
              try { EmbedController.play(); } catch {}
            });

            // Browser policy fallback: play on first user tap/click/scroll
            const playOnInteraction = () => {
              try { EmbedController.play(); } catch {}
              window.removeEventListener('click', playOnInteraction);
              window.removeEventListener('touchstart', playOnInteraction);
              window.removeEventListener('scroll', playOnInteraction);
            };
            window.addEventListener('click', playOnInteraction, { once: true, passive: true });
            window.addEventListener('touchstart', playOnInteraction, { once: true, passive: true });
            window.addEventListener('scroll', playOnInteraction, { once: true, passive: true });
          });
        } catch (e) {
          console.warn('Spotify iFrame API createController error:', e);
        }
      };

      if ((window as any).IFrameAPI) {
        initSpotifyApi((window as any).IFrameAPI);
      } else {
        if (!document.getElementById('spotify-iframe-api-script')) {
          const script = document.createElement('script');
          script.id = 'spotify-iframe-api-script';
          script.src = 'https://open.spotify.com/embed/iframe-api/v1';
          script.async = true;
          document.body.appendChild(script);
        }

        const prevReady = (window as any).onSpotifyIframeApiReady;
        (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
          (window as any).IFrameAPI = IFrameAPI;
          if (prevReady) prevReady(IFrameAPI);
          if (isMounted) initSpotifyApi(IFrameAPI);
        };
      }

      return () => {
        isMounted = false;
        if (controllerRef.current) {
          try { controllerRef.current.destroy(); } catch {}
          controllerRef.current = null;
        }
      };
    }, [url, autoplay, height, spotifyInfo.type, spotifyInfo.id]);

    // If autoplay is requested, use controller container ref, otherwise standard iframe
    if (autoplay) {
      return (
        <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg my-2 bg-slate-950/80">
          <div ref={elementRef} style={{ minHeight: `${height}px` }}>
            <iframe
              src={spotifyInfo.embedUrl}
              title={title || `Spotify ${spotifyInfo.type}`}
              width="100%"
              height={height}
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full border-0 block"
              style={{ borderRadius: '12px', minHeight: `${height}px` }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg my-2 bg-slate-950/80">
        <iframe
          src={spotifyInfo.embedUrl}
          title={title || `Spotify ${spotifyInfo.type}`}
          width="100%"
          height={height}
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="w-full border-0 block"
          style={{ borderRadius: '12px', minHeight: `${height}px` }}
        />
      </div>
    );
  }

  return null;
}
