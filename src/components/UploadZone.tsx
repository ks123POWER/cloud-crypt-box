import { useCallback, useState } from 'react';
import { Upload, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export const UploadZone = ({ onFileSelect, isUploading }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-xl p-12 transition-all",
        isDragging ? "border-primary bg-primary/5" : "border-border",
        isUploading && "opacity-50 pointer-events-none"
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileInput}
        disabled={isUploading}
      />
      
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center cursor-pointer"
      >
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <Upload className="h-12 w-12 text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {isUploading ? 'Encrypting and uploading...' : 'Drop your file here'}
        </h3>
        
        <p className="text-muted-foreground text-center mb-4">
          or click to browse from your device
        </p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>Your files are encrypted before upload using AES-256</span>
        </div>
      </label>
    </div>
  );
};
