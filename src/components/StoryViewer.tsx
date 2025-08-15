import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Story {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  created_at: string;
  expires_at: string;
}

interface StoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stories: Story[];
  initialStoryIndex?: number;
}

export const StoryViewer = ({ open, onOpenChange, stories, initialStoryIndex = 0 }: StoryViewerProps) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentStoryIndex];
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    if (!open || isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next story
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            return 0;
          } else {
            // All stories finished
            onOpenChange(false);
            return 0;
          }
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [open, currentStoryIndex, stories.length, storyDuration, isPaused, onOpenChange]);

  useEffect(() => {
    if (open) {
      setCurrentStoryIndex(initialStoryIndex);
      setProgress(0);
    }
  }, [open, initialStoryIndex]);

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full h-[600px] p-0 bg-black border-0">
        <div className="relative w-full h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width: index < currentStoryIndex ? '100%' : 
                           index === currentStoryIndex ? `${progress}%` : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8 border-2 border-white">
                <AvatarImage src={currentStory.avatar_url} />
                <AvatarFallback className="text-xs">
                  {(currentStory.display_name || currentStory.username)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-medium">
                  {currentStory.display_name || currentStory.username}
                </p>
                <p className="text-white/70 text-xs">
                  {new Date(currentStory.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-1 h-auto"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div 
            className="flex-1 relative bg-black flex items-center justify-center"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {currentStory.media_url ? (
              currentStory.media_type === 'video' ? (
                <video
                  src={currentStory.media_url}
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={currentStory.media_url}
                  alt="Story content"
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <p className="text-white text-lg text-center leading-relaxed">
                  {currentStory.content}
                </p>
              </div>
            )}

            {/* Navigation areas */}
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-0 w-1/3 h-full bg-transparent z-10"
              disabled={currentStoryIndex === 0}
            />
            <button
              onClick={handleNext}
              className="absolute right-0 top-0 w-1/3 h-full bg-transparent z-10"
            />
          </div>

          {/* Text content overlay */}
          {currentStory.content && currentStory.media_url && (
            <div className="absolute bottom-8 left-4 right-4 z-20">
              <p className="text-white text-sm leading-relaxed bg-black/50 p-3 rounded-lg">
                {currentStory.content}
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          {currentStoryIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 h-auto z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          {currentStoryIndex < stories.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 h-auto z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};