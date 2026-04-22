
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePostActions } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaUploader, type UploadedMedia } from '@/components/MediaUploader';
import { TradingViewMiniChart } from '@/components/TradingViewChart';
import { useToast } from '@/hooks/use-toast';
import { Send, TrendingUp, Camera } from 'lucide-react';
import { validateContent, validatePredictionConfidence, sanitizeContent, sanitizeErrorMessage, VALIDATION_LIMITS, RateLimiter } from '@/lib/validation';

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

// Rate limiter for post creation (max 5 posts per minute)
const postRateLimiter = new RateLimiter(5, 60000);

export const CreatePostForm = ({ onPostCreated }: CreatePostFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createPost } = usePostActions();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [predictionText, setPredictionText] = useState('');
  const [predictionConfidence, setPredictionConfidence] = useState(50);
  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartSymbol, setChartSymbol] = useState('NASDAQ:AAPL');
  const [contentError, setContentError] = useState<string | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  // Validation handlers
  const handleContentChange = (value: string) => {
    setContent(value);
    const error = validateContent(value, VALIDATION_LIMITS.POST_CONTENT);
    setContentError(error);
  };

  const handlePredictionChange = (value: string) => {
    setPredictionText(value);
    if (value.trim()) {
      const error = validateContent(value, VALIDATION_LIMITS.PREDICTION_TEXT);
      setPredictionError(error);
    } else {
      setPredictionError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to create a post",
        variant: "destructive",
      });
      return;
    }

    // Rate limiting check
    if (!postRateLimiter.isAllowed(user.id)) {
      const remainingTime = Math.ceil(postRateLimiter.getRemainingTime(user.id) / 1000);
      toast({
        title: "Rate limit exceeded",
        description: `Too many posts. Please wait ${remainingTime} seconds.`,
        variant: "destructive",
      });
      return;
    }

    // Validate content
    const contentValidationError = validateContent(content, VALIDATION_LIMITS.POST_CONTENT);
    if (contentValidationError) {
      setContentError(contentValidationError);
      toast({
        title: "Validation Error",
        description: contentValidationError,
        variant: "destructive",
      });
      return;
    }

    // Validate prediction text if provided
    if (predictionText.trim()) {
      const predictionValidationError = validateContent(predictionText, VALIDATION_LIMITS.PREDICTION_TEXT);
      if (predictionValidationError) {
        setPredictionError(predictionValidationError);
        toast({
          title: "Validation Error",
          description: predictionValidationError,
          variant: "destructive",
        });
        return;
      }
    }

    // Validate confidence
    const confidenceError = validatePredictionConfidence(predictionText ? predictionConfidence : null);
    if (confidenceError) {
      toast({
        title: "Validation Error",
        description: confidenceError,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const firstImage = media.find((m) => m.type === 'image')?.url;
      const firstVideo = media.find((m) => m.type === 'video')?.url;

      await createPost(
        sanitizeContent(content.trim()),
        predictionText.trim() ? sanitizeContent(predictionText.trim()) : undefined,
        predictionText ? predictionConfidence : undefined,
        undefined, // community_id
        firstImage,
        showChart ? chartSymbol : undefined,
        firstVideo,
      );

      // Reset form
      setContent('');
      setMedia([]);
      setPredictionText('');
      setPredictionConfidence(50);
      setShowChart(false);
      setContentError(null);
      setPredictionError(null);

      toast({
        title: "Success",
        description: "Post created successfully!",
      });

      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: sanitizeErrorMessage(error),
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
              onChange={(e) => handleContentChange(e.target.value)}
              rows={4}
              required
              maxLength={VALIDATION_LIMITS.POST_CONTENT.max}
              className={contentError ? 'border-destructive' : ''}
            />
            {contentError && (
              <p className="text-sm text-destructive mt-1">{contentError}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/{VALIDATION_LIMITS.POST_CONTENT.max} characters
            </p>
          </div>

          {/* Media Uploader */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">Add Photos & Videos</span>
            </div>
            <MediaUploader
              onMediaChange={setMedia}
              maxFiles={4}
              existingMedia={media}
              allowVideo
            />
          </div>

          {/* Prediction Section */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Market Prediction (Optional)</h4>
            
            <Textarea
              placeholder="Enter your market prediction or price target..."
              value={predictionText}
              onChange={(e) => handlePredictionChange(e.target.value)}
              rows={2}
              maxLength={VALIDATION_LIMITS.PREDICTION_TEXT.max}
              className={predictionError ? 'border-destructive' : ''}
            />
            {predictionError && (
              <p className="text-sm text-destructive mt-1">{predictionError}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {predictionText.length}/{VALIDATION_LIMITS.PREDICTION_TEXT.max} characters
            </p>
            
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
            disabled={loading || !content.trim() || !!contentError || !!predictionError}
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Posting...' : 'Share Post'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
