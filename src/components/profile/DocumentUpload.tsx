
import React, { useRef } from "react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileUp, X, FileCheck, Loader2 } from "lucide-react";

interface DocumentUploadProps {
  documentUrl: string | null;
  documentType: string;
  userId: string | null;
  onDocumentUploaded: (url: string) => void;
  allowedFileTypes?: string[];
  folder?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documentUrl,
  documentType,
  userId,
  onDocumentUploaded,
  allowedFileTypes = [".pdf", ".jpg", ".jpeg", ".png"],
  folder = "documents",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, deleteFile, uploading, progress } = useFileUpload({
    bucket: "user-assets",
    folder: folder,
    fileTypes: allowedFileTypes,
    maxSizeMB: 5,
  });

  const handleButtonClick = () => {
    // Programmatically click the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      // Upload file to Supabase
      const fileUrl = await uploadFile(file);
      
      if (fileUrl) {
        onDocumentUploaded(fileUrl);
        toast.success(`${documentType} uploaded successfully`);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload ${documentType}`);
    }
  };

  const handleDelete = async () => {
    if (!documentUrl) return;
    
    try {
      const deleted = await deleteFile(documentUrl);
      if (deleted) {
        onDocumentUploaded("");
        toast.success(`${documentType} removed successfully`);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(`Failed to delete ${documentType}`);
    }
  };

  const getDocumentName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/');
      return pathSegments[pathSegments.length - 1] || documentType;
    } catch (e) {
      return documentType;
    }
  };

  return (
    <div className="space-y-2">
      {documentUrl ? (
        <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-md">
          <div className="flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium truncate max-w-[180px]">
              {getDocumentName(documentUrl)}
            </span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={handleDelete}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            disabled={uploading}
            className="w-full justify-start"
            onClick={handleButtonClick}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading {progress}%
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Upload {documentType}
              </>
            )}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={allowedFileTypes.join(", ")}
            onChange={handleFileChange}
            disabled={uploading}
          />
          
          <p className="text-xs text-gray-500 mt-1">
            Accepted formats: {allowedFileTypes.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
