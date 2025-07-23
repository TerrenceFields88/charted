import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Maximize, Radio } from 'lucide-react';

export const BloombergTVPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Bloomberg TV Live Stream URL (this would be the actual live stream in production)
  const bloombergTVUrl = "https://www.youtube.com/embed/live_stream?channel=UCIALMKvObZNtJ6AmdCLP7Lg&autoplay=1&mute=0";

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    window.open('https://www.bloomberg.com/live', '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500" />
            Bloomberg TV Live
          </CardTitle>
          <Badge variant="destructive" className="animate-pulse">
            LIVE
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time market coverage and financial news
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Player */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={bloombergTVUrl}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Bloomberg TV Live"
          />
          
          {/* Overlay Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm">Now: Market Overview</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Program Schedule */}
        <div className="space-y-2">
          <h4 className="font-medium">Today's Schedule</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span>Market Open</span>
              <span className="text-muted-foreground">6:00 AM - 9:00 AM EST</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-primary/10 border border-primary/20">
              <span className="font-medium">Bloomberg Markets</span>
              <Badge variant="secondary">Live Now</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span>Bloomberg Technology</span>
              <span className="text-muted-foreground">3:00 PM - 4:00 PM EST</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/50">
              <span>Bloomberg Markets: Close</span>
              <span className="text-muted-foreground">4:00 PM - 5:00 PM EST</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://www.bloomberg.com/live/us', '_blank')}
            className="flex-1"
          >
            Watch on Bloomberg.com
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://www.bloomberg.com/audio', '_blank')}
            className="flex-1"
          >
            Bloomberg Radio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};