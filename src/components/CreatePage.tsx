import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePostActions } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Image, 
  Video, 
  BarChart3, 
  FileText, 
  Camera, 
  TrendingUp,
  Hash,
  DollarSign
} from 'lucide-react';

export const CreatePage = () => {
  const [postContent, setPostContent] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [sentiment, setSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createPost } = usePostActions();
  const { user } = useAuth();
  const { toast } = useToast();

  const popularSymbols = ['GC', 'CL', 'SI', 'HG', 'ZC', 'ZS', 'ES', 'NQ'];
  const popularTags = ['analysis', 'breakout', 'support', 'resistance', 'scalping', 'swing'];

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getSentimentColor = () => {
    switch (sentiment) {
      case 'bullish': return 'bg-bullish text-primary-foreground';
      case 'bearish': return 'bg-bearish text-primary-foreground';
      default: return 'bg-neutral text-primary-foreground';
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await createPost(postContent);
      setPostContent('');
      setSelectedSymbol('');
      setSentiment('neutral');
      setTags([]);
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 px-4 py-3">
        <h1 className="text-xl font-bold">Create Post</h1>
      </div>

      <div className="px-4 py-4">
        <Tabs defaultValue="post" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="post" className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-1">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Chart</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="post">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share Your Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="What's happening in the markets? Share your insights, analysis, or trading ideas..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-32 resize-none"
                />

                {/* Symbol Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Trading Symbol (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {popularSymbols.map((symbol) => (
                      <Button
                        key={symbol}
                        variant={selectedSymbol === symbol ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSymbol(selectedSymbol === symbol ? '' : symbol)}
                      >
                        ${symbol}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sentiment */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Market Sentiment
                  </label>
                  <div className="flex gap-2">
                    {(['bullish', 'neutral', 'bearish'] as const).map((option) => (
                      <Button
                        key={option}
                        variant={sentiment === option ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSentiment(option)}
                        className={sentiment === option ? getSentimentColor() : ''}
                      >
                        <span className="capitalize">{option}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        #{tag} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag(newTag)}
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={() => addTag(newTag)}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {popularTags.map((tag) => (
                      <Button
                        key={tag}
                        variant="ghost"
                        size="sm"
                        onClick={() => addTag(tag)}
                        className="text-xs h-6"
                      >
                        #{tag}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  disabled={!postContent.trim() || isSubmitting}
                  onClick={handleCreatePost}
                >
                  {isSubmitting ? 'Creating...' : 'Share Post'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image">
            <Card>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Upload a chart screenshot or trading setup
                  </p>
                  <Button>Choose Image</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video">
            <Card>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Record or upload a trading video
                  </p>
                  <Button>Upload Video</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart">
            <Card>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Connect your charting platform or upload analysis
                  </p>
                  <div className="space-y-2">
                    <Button>Connect TradingView</Button>
                    <Button variant="outline">Upload Chart</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};