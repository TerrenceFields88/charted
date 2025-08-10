import { Button } from '@/components/ui/button';
import { useRealTimeFollows } from '@/hooks/useRealTimeFollows';
import { UserPlus, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserFollowButtonProps {
  userId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
}

export const UserFollowButton = ({ 
  userId, 
  className, 
  variant = 'default',
  size = 'sm',
  showIcon = true 
}: UserFollowButtonProps) => {
  const { followUser, unfollowUser, isFollowing, loading } = useRealTimeFollows();
  const following = isFollowing(userId);

  const handleToggleFollow = async () => {
    if (following) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  return (
    <Button
      variant={following ? 'outline' : variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={loading}
      className={cn(className)}
    >
      {showIcon && (
        following ? (
          <UserMinus className="w-4 h-4 mr-2" />
        ) : (
          <UserPlus className="w-4 h-4 mr-2" />
        )
      )}
      {following ? 'Unfollow' : 'Follow'}
    </Button>
  );
};