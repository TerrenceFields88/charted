import { useState } from 'react';
import { CommunityCard } from './CommunityCard';
import { CommunityPost } from '@/types/social';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreatePostForm } from './CreatePostForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Plus } from 'lucide-react';

export const CommunityPage = () => {
  const { posts, loading, error, refetch } = useCommunityPosts();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const categories = [
    { id: 'all', label: 'All', count: posts.length },
    { id: 'discussion', label: 'Discussion', count: posts.filter(p => p.category === 'discussion').length },
    { id: 'analysis', label: 'Analysis', count: posts.filter(p => p.category === 'analysis').length },
    { id: 'question', label: 'Questions', count: posts.filter(p => p.category === 'question').length },
    { id: 'strategy', label: 'Strategy', count: posts.filter(p => p.category === 'strategy').length },
    { id: 'news', label: 'News', count: posts.filter(p => p.category === 'news').length },
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || post.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Community</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8">
                <Plus className="w-4 h-4 mr-1" />
                Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Community Post</DialogTitle>
              </DialogHeader>
              <CreatePostForm 
                onPostCreated={() => {
                  setIsCreateDialogOpen(false);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeFilter === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(category.id)}
              className="whitespace-nowrap"
            >
              {category.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        <Tabs defaultValue="hot" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hot">🔥 Hot</TabsTrigger>
            <TabsTrigger value="new">🆕 New</TabsTrigger>
            <TabsTrigger value="top">⭐ Top</TabsTrigger>
          </TabsList>

          <TabsContent value="hot">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading posts...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Error loading posts: {error}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No posts found matching your criteria
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <CommunityCard key={post.id} post={post} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="new">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading posts...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Error loading posts: {error}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No posts found matching your criteria
                </div>
              ) : (
                [...filteredPosts]
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((post) => (
                    <CommunityCard key={post.id} post={post} />
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="top">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading posts...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  Error loading posts: {error}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No posts found matching your criteria
                </div>
              ) : (
                [...filteredPosts]
                  .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
                  .map((post) => (
                    <CommunityCard key={post.id} post={post} />
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};