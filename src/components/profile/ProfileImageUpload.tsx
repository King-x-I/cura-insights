import React, { useState, useRef, useEffect } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, UserCircle } from "lucide-react";

interface ProfileImageUploadProps {
  currentImageUrl: string | null;
  userId: string | null;
  onImageUploaded: (url: string) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  userId,
  onImageUploaded,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setImagePreview(currentImageUrl);
  }, [currentImageUrl]);
  
  const { uploadFile, uploading, progress } = useFileUpload({
    bucket: "user-assets",
    folder: "profile_pics",
    fileTypes: [".jpg", ".jpeg", ".png", ".webp"],
    maxSizeMB: 10,
  });

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('Selected file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log('File size in MB:', fileSizeMB);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }
    
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      console.log('File too large:', file.size, 'bytes');
      toast.error(`Image size should be less than 10MB (current: ${fileSizeMB}MB)`);
      return;
    }
    
    try {
      console.log('Creating preview...');
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      console.log('Starting upload...');
      const fileUrl = await uploadFile(file);
      
      if (fileUrl) {
        console.log('Upload successful:', fileUrl);
        onImageUploaded(fileUrl);
        toast.success("Profile picture uploaded successfully");
      } else {
        console.log('Upload failed - no URL returned');
        setImagePreview(currentImageUrl);
        toast.error("Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload profile picture");
      setImagePreview(currentImageUrl);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
        {imagePreview ? (
          <img 
            src={imagePreview} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image load error:', e);
              setImagePreview(null);
              toast.error("Failed to load image");
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <UserCircle size={64} />
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm font-medium">{progress}%</div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center">
        <Button 
          type="button" 
          size="sm" 
          variant="outline"
          disabled={uploading}
          onClick={handleButtonClick}
          className="w-full"
        >
          <User className="mr-2 h-4 w-4" />
          {imagePreview ? "Change Photo" : "Upload Photo"}
        </Button>
        
        <input
          ref={fileInputRef}
          id="profile-picture"
          type="file"
          className="hidden"
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        {imagePreview && (
          <button
            type="button"
            className="text-xs text-red-500 mt-2 hover:underline"
            onClick={() => {
              setImagePreview(null);
              onImageUploaded("");
            }}
          >
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileImageUpload;
