import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeZoneOverlay } from '@/components/SafeZoneOverlay';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  showSafeZone?: boolean;
  safeZoneTop?: number;
  safeZoneBottom?: number;
  safeZoneSides?: number;
}

export const VideoPlayer = ({
  src,
  poster,
  className,
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  showSafeZone = true,
  safeZoneTop = 64,
  safeZoneBottom = 96,
  safeZoneSides = 16,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleVideoClick = () => {
    togglePlay();
  };

  return (
    <div 
      className={cn("relative group cursor-pointer", className)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        className="w-full h-full object-cover"
        onClick={handleVideoClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* Custom Controls Overlay */}
      {controls && (
        <div 
          className={cn(
            "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300",
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Play/Pause Button */}
          <Button
            variant="ghost"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="absolute bg-black/50 hover:bg-black/70 text-white border-0 rounded-full w-16 h-16"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="bg-black/50 hover:bg-black/70 text-white border-0 rounded"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="bg-black/50 hover:bg-black/70 text-white border-0 rounded"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!isPlaying && !showControls && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Safe-zone overlay */}
      {showSafeZone && (
        <SafeZoneOverlay
          visible={showControls || !isPlaying}
          top={safeZoneTop}
          bottom={safeZoneBottom}
          sides={safeZoneSides}
        />
      )}
    </div>
  );
};