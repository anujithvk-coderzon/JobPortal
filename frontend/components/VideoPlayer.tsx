'use client';

import { useRef, useEffect, useState } from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  maxWidth?: string;
}

export function VideoPlayer({ videoUrl, title, className = '', maxWidth = '550px' }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Intersection Observer to detect when video scrolls in/out of view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);

          // If video scrolls out of view and is playing, stop it
          if (!entry.isIntersecting && isPlaying) {
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: 0.5, // Video must be at least 50% visible
        rootMargin: '0px',
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [isPlaying]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-md overflow-hidden mx-auto ${className}`}
      style={{ maxWidth }}
      onClick={handleContainerClick}
    >
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {!isPlaying ? (
          // Thumbnail state - show iframe without playing
          <div className="absolute top-0 left-0 w-full h-full">
            <iframe
              src={videoUrl}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              allow="encrypted-media; gyroscope; picture-in-picture"
              title={title || 'Video player'}
              loading="lazy"
            />
            {/* Play button overlay */}
            <div
              className="absolute top-0 left-0 w-full h-full flex items-center justify-center cursor-pointer group"
              onClick={handlePlayClick}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white group-hover:scale-110 transition-transform flex items-center justify-center shadow-2xl">
                <Play className="w-8 h-8 md:w-10 md:h-10 text-gray-900 ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : (
          // Playing state - full interactive iframe
          isVisible && (
            <iframe
              src={`${videoUrl}?autoplay=1`}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title || 'Video player'}
            />
          )
        )}
      </div>
    </div>
  );
}
