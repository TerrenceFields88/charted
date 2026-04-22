import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Video as VideoIcon, Play } from 'lucide-react';
import {
  validateImageFile,
  validateImageContent,
  generateSecureFilename,
  sanitizeErrorMessage,
} from '@/lib/validation';

export type UploadedMedia =
  | { type: 'image'; url: string }
  | { type: 'video'; url: string };

interface MediaUploaderProps {
  onMediaChange: (media: UploadedMedia[]) => void;
  maxFiles?: number;
  existingMedia?: UploadedMedia[];
  allowVideo?: boolean;
}

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

export const MediaUploader = ({
  onMediaChange,
  maxFiles = 4,
  existingMedia = [],
  allowVideo = true,
}: MediaUploaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState<UploadedMedia[]>(existingMedia);

  const uploadOne = async (file: File): Promise<UploadedMedia | null> => {
    if (!user) return null;
    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      if (!allowVideo) {
        toast({ title: 'Videos not allowed here', variant: 'destructive' });
        return null;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        toast({ title: 'Video too large', description: 'Max 50MB.', variant: 'destructive' });
        return null;
      }
    } else {
      const fileError = validateImageFile(file);
      if (fileError) {
        toast({ title: 'Invalid file', description: fileError, variant: 'destructive' });
        return null;
      }
      const contentError = await validateImageContent(file);
      if (contentError) {
        toast({ title: 'Invalid image', description: contentError, variant: 'destructive' });
        return null;
      }
    }

    try {
      const bucket = isVideo ? 'videos' : 'photos';
      const baseName = generateSecureFilename(file.name, user.id);
      // Ensure videos live in user.id/ folder for RLS
      const path = isVideo && !baseName.startsWith(`${user.id}/`)
        ? `${user.id}/${baseName.split('/').pop()}`
        : baseName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { type: isVideo ? 'video' : 'image', url: data.publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: sanitizeErrorMessage(error),
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxFiles - media.length;
    const filesToUpload = Array.from(files).slice(0, remaining);
    if (filesToUpload.length < files.length) {
      toast({
        title: 'File limit reached',
        description: `Only ${remaining} more file(s) can be added.`,
        variant: 'destructive',
      });
    }

    setUploading(true);
    try {
      const results = await Promise.all(filesToUpload.map(uploadOne));
      const ok = results.filter(Boolean) as UploadedMedia[];
      const next = [...media, ...ok];
      setMedia(next);
      onMediaChange(next);
      if (ok.length > 0) {
        toast({ title: 'Uploaded', description: `${ok.length} file(s) added.` });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAt = (i: number) => {
    const next = media.filter((_, idx) => idx !== i);
    setMedia(next);
    onMediaChange(next);
  };

  const accept = allowVideo ? 'image/*,video/*' : 'image/*';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || media.length >= maxFiles}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading…' : 'Add Media'}
        </Button>
        <span className="text-xs text-muted-foreground">
          {media.length}/{maxFiles} {allowVideo ? '· photos & videos' : '· photos'}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {media.map((item, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                {item.type === 'image' ? (
                  <img src={item.url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="relative w-full h-full">
                    <video src={item.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur rounded-full px-2 py-0.5 flex items-center gap-1">
                {item.type === 'image' ? (
                  <ImageIcon className="w-3 h-3" />
                ) : (
                  <VideoIcon className="w-3 h-3" />
                )}
                <span className="text-[10px]">{item.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
