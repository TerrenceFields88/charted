import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Maximize, Radio } from 'lucide-react';

export const BloombergTVPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Bloomberg TV Live Stream URL (this would be the actual live stream in production)
  // Bloomberg TV requires authentication, so we'll show a placeholder and direct to official site

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
        {/* Video Player Placeholder */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <Radio className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold mb-2">Bloomberg TV Live</h3>
            <p className="text-blue-100 mb-6">
              Stream live financial news and market coverage
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.open('https://www.bloomberg.com/live/us', '_blank')}
                className="bg-white text-blue-900 hover:bg-blue-50 w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Live on Bloomberg.com
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://www.bloomberg.com/audio', '_blank')}
                className="border-white text-white hover:bg-white/10 w-full"
              >
                <Radio className="w-4 h-4 mr-2" />
                Listen to Bloomberg Radio
              </Button>
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

        {/* Note about streaming */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Bloomberg TV live streaming requires visiting Bloomberg.com directly. 
            Free users get 30 minutes of live streaming per day. For unlimited access, a Bloomberg subscription is required.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};