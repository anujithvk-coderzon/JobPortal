'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  aspectRatio?: '16:9' | '1:1' | '4:5' | '9:16' | 'auto';
  autoPlay?: boolean;
}

// Aspect ratio values (height/width)
const ASPECT_RATIOS: Record<string, number> = {
  '16:9': 9 / 16,
  '1:1': 1,
  '4:5': 5 / 4,
  '9:16': 16 / 9,
};

// Build iframe URL with proper parameters
const buildIframeUrl = (baseUrl: string, autoplay: boolean = false): string => {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('responsive', 'true');
    url.searchParams.set('preload', 'true');
    if (autoplay) {
      url.searchParams.set('autoplay', 'true');
    }
    return url.toString();
  } catch {
    return baseUrl;
  }
};

export function VideoPlayer({
  videoUrl,
  title,
  className = '',
  aspectRatio = 'auto',
  autoPlay = false
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [detectedRatio, setDetectedRatio] = useState<string>(aspectRatio !== 'auto' ? aspectRatio : '16:9');

  useEffect(() => {
    if (aspectRatio !== 'auto') {
      setDetectedRatio(aspectRatio);
    }
  }, [aspectRatio]);

  useEffect(() => {
    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [autoPlay]);

  const stopVideo = useCallback(() => {
    setIsPlaying(false);
    setIframeLoaded(false);
    setIframeKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isPlaying) {
            stopVideo();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isPlaying, stopVideo]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsPlaying(true);
    setIframeLoaded(false);
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  const ratioValue = ASPECT_RATIOS[detectedRatio] || ASPECT_RATIOS['16:9'];
  const isPortrait = ratioValue > 1;
  const maxHeight = '60vh';
  const maxWidth = isPortrait ? `calc(${maxHeight} / ${ratioValue})` : '100%';

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto ${className}`}
      style={{
        maxWidth: isPortrait ? maxWidth : '600px',
        width: '100%'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-full rounded-lg overflow-hidden bg-black"
        style={{
          aspectRatio: `1 / ${ratioValue}`,
          maxHeight: maxHeight
        }}
      >
        {!isPlaying ? (
          <>
            <iframe
              key={`thumb-${iframeKey}`}
              src={buildIframeUrl(videoUrl, false)}
              className="absolute inset-0 w-full h-full border-0"
              allow="encrypted-media; gyroscope; picture-in-picture"
              title={title || 'Video player'}
              loading="lazy"
              style={{ pointerEvents: 'none' }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer group bg-black/5 hover:bg-black/20 transition-colors"
              onClick={handlePlayClick}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 group-hover:bg-white group-hover:scale-110 transition-all flex items-center justify-center shadow-2xl">
                <Play className="w-6 h-6 sm:w-7 sm:h-7 text-gray-900 ml-1" fill="currentColor" />
              </div>
            </div>
          </>
        ) : (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}

            <iframe
              key={`play-${iframeKey}`}
              ref={iframeRef}
              src={buildIframeUrl(videoUrl, true)}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title || 'Video player'}
              onLoad={handleIframeLoad}
            />
          </>
        )}
      </div>
    </div>
  );
}
