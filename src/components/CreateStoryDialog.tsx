import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Image, Type } from 'lucide-react';

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateStoryDialog = ({ open, onOpenChange }: CreateStoryDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [storyType, setStoryType] = useState<'text' | 'media'>('text');

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setStoryType('media');
    }
  };

  const handleCreateStory = async () => {
    if (!user) return;
    if (!content.trim() && !mediaFile) {
      toast({
        title: 'Error',
        description: 'Please add content or media to your story',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media if exists
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `stories/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath);

        mediaUrl = publicUrl;
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }

      // Create story record
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Stories expire after 24 hours

      // For now, we'll store stories in posts table with a special type
      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          image_url: mediaUrl,
          post_type: 'story',
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Story created successfully!',
      });

      // Reset form
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      setStoryType('text');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: 'Error',
        description: 'Failed to create story',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setStoryType('text');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Story Type Selection */}
          <div className="flex gap-2">
            <Button
              variant={storyType === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('text')}
              className="flex-1"
            >
              <Type className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              variant={storyType === 'media' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('media')}
              className="flex-1"
            >
              <Image className="w-4 h-4 mr-2" />
              Media
            </Button>
          </div>

          {/* Media Upload */}
          {storyType === 'media' && (
            <div className="space-y-2">
              <Label htmlFor="media">Upload Image or Video</Label>
              <Input
                id="media"
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
              />
              {mediaPreview && (
                <div className="relative">
                  {mediaFile?.type.startsWith('video/') ? (
                    <video
                      src={mediaPreview}
                      className="w-full h-40 object-cover rounded-lg"
                      controls
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Story preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearMedia}
                    className="absolute top-2 right-2"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {storyType === 'media' ? 'Caption (optional)' : 'Story Text'}
            </Label>
            <Textarea
              id="content"
              placeholder={storyType === 'media' ? 'Add a caption...' : 'What\'s on your mind?'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/500
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCreateStory}
              disabled={loading || (!content.trim() && !mediaFile)}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Share Story'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};