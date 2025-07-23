
import { PostCard } from './PostCard';
import { usePosts } from '@/hooks/useSupabaseData';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const FeedPage = () => {
  const { posts, loading, error, refetch } = usePosts();

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Trading Feed</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 py-4">
        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-card rounded-lg border space-y-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground py-8">
            Error loading posts: {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No posts yet. Create the first one!
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {loading && (
              <div className="mt-4 p-4 bg-card rounded-lg border">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
