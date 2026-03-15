import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStoryReactions, STORY_EMOJIS } from '@/hooks/useStoryReactions';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactionBurst, setShowReactionBurst] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const currentStory = stories[currentStoryIndex];
  const storyDuration = 5000;

  const { reactionCounts, userReactions, toggleReaction } = useStoryReactions(currentStory?.id);

  useEffect(() => {
    if (!open || isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            return 0;
          } else {
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
      setReplyText('');
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

  const handleReaction = async (emoji: string) => {
    setIsPaused(true);
    setShowReactionBurst(emoji);
    await toggleReaction(emoji);
    setTimeout(() => {
      setShowReactionBurst(null);
      setIsPaused(false);
    }, 800);
  };

  if (!currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full h-[600px] p-0 bg-black border-0">
        <div className="relative w-full h-full flex flex-col">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
            {stories.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
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
          <div className="absolute top-5 left-3 right-3 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border border-white/50">
                <AvatarImage src={currentStory.avatar_url} />
                <AvatarFallback className="text-xs bg-muted">
                  {(currentStory.display_name || currentStory.username)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-xs font-semibold">
                  {currentStory.display_name || currentStory.username}
                </p>
                <p className="text-white/60 text-[10px]">
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
              onClick={() => onOpenChange(false)}
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
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
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

            {/* Tap navigation areas */}
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-0 w-1/3 h-full bg-transparent z-10"
              disabled={currentStoryIndex === 0}
            />
            <button
              onClick={handleNext}
              className="absolute right-0 top-0 w-1/3 h-full bg-transparent z-10"
            />

            {/* Reaction burst animation */}
            {showReactionBurst && (
              <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <span className="text-6xl animate-bounce">{showReactionBurst}</span>
              </div>
            )}
          </div>

          {/* Text overlay for media stories */}
          {currentStory.content && currentStory.media_url && (
            <div className="absolute bottom-28 left-3 right-3 z-20">
              <p className="text-white text-sm leading-relaxed bg-black/40 backdrop-blur-sm p-3 rounded-xl">
                {currentStory.content}
              </p>
            </div>
          )}

          {/* Reaction counts (shown above reaction bar when reactions exist) */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className="absolute bottom-24 left-3 right-3 z-20 flex gap-1.5 flex-wrap">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full backdrop-blur-sm",
                    userReactions.has(emoji)
                      ? "bg-white/30 text-white"
                      : "bg-white/10 text-white/80"
                  )}
                >
                  {emoji} {count}
                </span>
              ))}
            </div>
          )}

          {/* Bottom reaction bar + reply */}
          {user && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-4 px-3 space-y-2">
              {/* Quick emoji reactions */}
              <div className="flex items-center justify-center gap-3">
                {STORY_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className={cn(
                      "text-2xl transition-transform hover:scale-125 active:scale-90",
                      userReactions.has(emoji) && "drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Reply input */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Send a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm h-9 rounded-full"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 h-9 w-9 p-0 rounded-full"
                  disabled={!replyText.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Nav arrows */}
          {currentStoryIndex > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="absolute left-1 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-1.5 h-auto z-20 rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          {currentStoryIndex < stories.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-1.5 h-auto z-20 rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
