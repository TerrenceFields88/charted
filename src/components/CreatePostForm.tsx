import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUploader } from '@/components/PhotoUploader';
import { TradingViewMiniChart } from '@/components/TradingViewChart';
import { useToast } from '@/hooks/use-toast';
import { Send, TrendingUp, Camera } from 'lucide-react';

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

export const CreatePostForm = ({ onPostCreated }: CreatePostFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [predictionText, setPredictionText] = useState('');
  const [predictionConfidence, setPredictionConfidence] = useState(50);
  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartSymbol, setChartSymbol] = useState('NASDAQ:AAPL');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    try {
      setLoading(true);

      const postData = {
        user_id: user.id,
        content: content.trim(),
        image_url: photos.length > 0 ? photos[0] : null, // For now, use first photo
        prediction_text: predictionText || null,
        prediction_confidence: predictionText ? predictionConfidence : null,
      };

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) {
        throw error;
      }

      // Reset form
      setContent('');
      setPhotos([]);
      setPredictionText('');
      setPredictionConfidence(50);
      setShowChart(false);

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Share Your Trading Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Content */}
          <div className="space-y-2">
            <Textarea
              placeholder="What's your market view? Share your analysis, trades, or predictions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Photo Uploader */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">Add Photos</span>
            </div>
            <PhotoUploader
              onPhotosChange={setPhotos}
              maxFiles={4}
              existingPhotos={photos}
            />
          </div>

          {/* Prediction Section */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Market Prediction (Optional)</h4>
            
            <Textarea
              placeholder="Enter your market prediction or price target..."
              value={predictionText}
              onChange={(e) => setPredictionText(e.target.value)}
              rows={2}
            />
            
            {predictionText && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Confidence Level: {predictionConfidence}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={predictionConfidence}
                  onChange={(e) => setPredictionConfidence(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* TradingView Chart Integration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowChart(!showChart)}
              >
                {showChart ? 'Hide Chart' : 'Add Chart'}
              </Button>
              {showChart && (
                <input
                  type="text"
                  placeholder="Symbol (e.g., NASDAQ:AAPL)"
                  value={chartSymbol}
                  onChange={(e) => setChartSymbol(e.target.value)}
                  className="px-2 py-1 text-sm border rounded"
                />
              )}
            </div>
            
            {showChart && (
              <div className="border rounded-lg overflow-hidden">
                <TradingViewMiniChart
                  symbol={chartSymbol}
                  height={250}
                  theme="dark"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !content.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Posting...' : 'Share Post'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};