import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface StoryRingProps {
  avatarUrl?: string | null;
  username: string;
  displayName?: string | null;
  hasStory?: boolean;
  isViewed?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const StoryRing = ({
  avatarUrl,
  username,
  displayName,
  hasStory = false,
  isViewed = false,
  onClick,
  size = 'md'
}: StoryRingProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      <div
        className={cn(
          'relative cursor-pointer transition-transform hover:scale-105',
          hasStory && 'ring-2 ring-offset-2',
          hasStory && !isViewed && 'ring-primary',
          hasStory && isViewed && 'ring-muted-foreground',
          'ring-offset-background rounded-full'
        )}
        onClick={onClick}
      >
        <Avatar className={cn(sizeClasses[size], 'border-2 border-background')}>
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className={textSizeClasses[size]}>
            {(displayName || username)[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <p className={cn(
        'text-center max-w-[80px] truncate',
        textSizeClasses[size]
      )}>
        {displayName || username}
      </p>
    </div>
  );
};