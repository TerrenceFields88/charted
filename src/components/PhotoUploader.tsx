import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image } from 'lucide-react';
import { validateImageFile, validateImageContent, generateSecureFilename, sanitizeErrorMessage } from '@/lib/validation';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { SafeZoneOverlay } from '@/components/SafeZoneOverlay';

interface PhotoUploaderProps {
  onPhotosChange: (urls: string[]) => void;
  maxFiles?: number;
  existingPhotos?: string[];
}

export const PhotoUploader = ({ 
  onPhotosChange, 
  maxFiles = 5, 
  existingPhotos = [] 
}: PhotoUploaderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>(existingPhotos);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;

    // Validate file
    const fileError = validateImageFile(file);
    if (fileError) {
      toast({
        title: "Invalid file",
        description: fileError,
        variant: "destructive",
      });
      return null;
    }

    // Validate image content
    const contentError = await validateImageContent(file);
    if (contentError) {
      toast({
        title: "Invalid image",
        description: contentError,
        variant: "destructive",
      });
      return null;
    }

    try {
      // Generate secure filename
      const secureFileName = generateSecureFilename(file.name, user.id);

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(secureFileName, file, {
          cacheControl: '3600',
          upsert: false // Prevent overwriting for security
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('photos')
        .getPublicUrl(secureFileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: sanitizeErrorMessage(error),
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - photos.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length < files.length) {
      toast({
        title: "File limit reached",
        description: `Only ${remainingSlots} more photos can be added.`,
        variant: "destructive",
      });
    }

    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(file => uploadPhoto(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      const successfulUploads = uploadedUrls.filter(url => url !== null) as string[];
      const newPhotos = [...photos, ...successfulUploads];
      
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);

      if (successfulUploads.length > 0) {
        toast({
          title: "Success",
          description: `${successfulUploads.length} photo(s) uploaded successfully!`,
        });
      }

      if (successfulUploads.length < filesToUpload.length) {
        toast({
          title: "Partial upload",
          description: "Some photos failed to upload. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (indexToRemove: number) => {
    const newPhotos = photos.filter((_, index) => index !== indexToRemove);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {photos.length < maxFiles && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Add Photos'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {photos.length}/{maxFiles} photos
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={photo}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No photos added yet</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Photos'}
          </Button>
        </div>
      )}
    </div>
  );
};