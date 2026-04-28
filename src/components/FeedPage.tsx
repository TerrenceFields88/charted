import { useState } from 'react';
import { PostCard } from './PostCard';
import { NewsWidget } from '@/components/NewsWidget';
import { usePosts } from '@/hooks/useSupabaseData';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserSearchPage } from '@/components/UserSearchPage';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorFallback } from './ErrorFallback';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';

export const FeedPage = () => {
  const { posts, loading, error, refetch } = usePosts();
  const [showSearch, setShowSearch] = useState(false);

  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: async () => { await refetch(); },
  });

  return (
    <div ref={containerRef} className="pb-20 min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 glass border-b hairline z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-ember shadow-ember flex items-center justify-center">
              <span className="font-display font-bold text-primary-foreground text-sm">C</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent ember-pulse" />
            </div>
            <div className="leading-none">
              <h1 className="font-display text-lg font-bold tracking-tight">
                Charted
              </h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-primary/10"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
        {showSearch && (
          <div className="mt-2 animate-scale-in">
            <UserSearchPage />
          </div>
        )}
      </div>

      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} progress={progress} />

      {/* Feed */}
      <div className="px-4 pt-3 space-y-3">
        <ErrorBoundary fallback={<ErrorFallback minimal />}>
          <NewsWidget maxArticles={2} showHeader={false} />
        </ErrorBoundary>

        {loading && posts.length === 0 ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-card rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground py-12 text-sm">
            Something went wrong. Pull down to retry.
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">
            No posts yet. Be the first to share!
          </div>
        ) : (
          posts.map((post) => (
            <ErrorBoundary key={post.id} fallback={<ErrorFallback minimal />}>
              <PostCard post={post} />
            </ErrorBoundary>
          ))
        )}
      </div>
    </div>
  );
};
