import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileUploadOptions {
  bucket: string;
  folder?: string;
  fileTypes?: string[];
  maxSizeMB?: number;
}

interface FileUploadReturn {
  uploadFile: (file: File) => Promise<string | null>;
  deleteFile: (filePath: string) => Promise<boolean>;
  uploading: boolean;
  progress: number;
}

// Helper function to compress image
const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Simplified resizing
        const maxDimension = 800; // Back to 800px
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with quality 0.7
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.7
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export const useFileUpload = (options: FileUploadOptions): FileUploadReturn => {
  const { bucket, folder = "", fileTypes, maxSizeMB = 5 } = options; // Back to 5MB
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = (file: File): boolean => {
    // Check file size (convert MB to bytes)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return false;
    }

    // Check file type if specified
    if (fileTypes && fileTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !fileTypes.includes(`.${fileExtension}`)) {
        toast.error(`Invalid file type. Allowed types: ${fileTypes.join(", ")}`);
        return false;
      }
    }

    return true;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!validateFile(file)) {
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Compress image if it's an image file
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        console.log('Compressing image...');
        fileToUpload = await compressImage(file);
        console.log('Original size:', file.size, 'Compressed size:', fileToUpload.size);
      }

      // Get file extension
      const fileExtension = fileToUpload.name.split('.').pop()?.toLowerCase();
      
      // Generate storage path based on provided options and file details
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const filePath = folder 
        ? `${folder}/${randomId}_${timestamp}.${fileExtension}` 
        : `${randomId}_${timestamp}.${fileExtension}`;
      
      console.log('Uploading file:', {
        bucket,
        filePath,
        fileSize: fileToUpload.size,
        fileType: fileToUpload.type,
        fileName: fileToUpload.name
      });

      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, {
          cacheControl: "3600",
          upsert: true,
          contentType: fileToUpload.type
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get the public URL for the file
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      console.log('Public URL:', urlData.publicUrl);
      
      // Update progress after upload completes
      setProgress(100);
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      // Extract path from URL if needed
      let path = filePath;
      if (filePath.includes(bucket)) {
        path = filePath.split(`${bucket}/`)[1];
      }
      
      const { error } = await supabase.storage.from(bucket).remove([path]);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
      return false;
    }
  };

  return { uploadFile, deleteFile, uploading, progress };
};
