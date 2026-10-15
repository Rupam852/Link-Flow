import React, { useEffect, useRef } from 'react';

interface MediaEmbedProps {
  url: string;
  title?: string;
  autoplay?: boolean;
}

export interface SpotifyEmbedInfo {
  embedUrl: string;
  type: 'track' | 'album' | 'playlist' | 'artist' | 'episode' | 'show';
  id: string;
}

// Extract YouTube embed URL
export function getYouTubeEmbedUrl(url: string, autoplay: boolean = false): string | null {
  if (!url || typeof url !== 'string') return null;
  const raw = url.trim();
  const iframeMatch = raw.match(/<iframe.*?src=["'](.*?)["']/i);
  const target = iframeMatch ? iframeMatch[1] : raw;
  const clean = target.replace(/^(https?:\/\/)?/, 'https://');

  try {
    const parsed = new URL(clean);
    let embedBase = '';
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v) embedBase = `https://www.youtube-nocookie.com/embed/${v}`;
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'live', 'v'].includes(pathParts[0]) && pathParts[1]) {
        embedBase = `https://www.youtube-nocookie.com/embed/${pathParts[1]}`;
      }
    }
    if (parsed.hostname === 'youtu.be' || parsed.hostname.endsWith('.youtu.be')) {
      const id = parsed.pathname.slice(1).split('?')[0];
      if (id) embedBase = `https://www.youtube-nocookie.com/embed/${id}`;
    }

    if (embedBase) {
      if (autoplay) {
        return `${embedBase}?autoplay=1&mute=0&enablejsapi=1`;
      }
      return embedBase;
    }
  } catch {
    return null;
  }
  return null;
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

export default function MediaEmbed({ url, title, autoplay = false }: MediaEmbedProps) {
  const ytUrl = getYouTubeEmbedUrl(url, autoplay);
  if (ytUrl) {
    return (
      <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/40 aspect-video relative my-2">
        <iframe
          src={ytUrl}
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
