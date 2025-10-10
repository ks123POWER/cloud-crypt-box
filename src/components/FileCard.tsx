import { FileText, Download, Shield, Trash2, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EncryptedFile } from '@/lib/crypto';
import { Badge } from '@/components/ui/badge';

interface FileCardProps {
  file: EncryptedFile;
  onDownload: (file: EncryptedFile) => void;
  onVerify: (file: EncryptedFile) => void;
  onDelete: (id: string) => void;
  onShare: (file: EncryptedFile) => void;
}

export const FileCard = ({ file, onDownload, onVerify, onDelete, onShare }: FileCardProps) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate mb-1">{file.fileName}</h3>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{formatFileSize(file.fileSize)}</span>
                <span>•</span>
                <span>{formatDate(new Date(file.createdAt))}</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Encrypted
          </Badge>
        </div>

        <div className="flex items-center gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(file)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVerify(file)}
          >
            <Shield className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onShare(file)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(file.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 p-2 bg-muted rounded text-xs font-mono break-all">
          <div className="text-muted-foreground">SHA-256:</div>
          <div>{file.fileHash.slice(0, 32)}...</div>
        </div>
      </CardContent>
    </Card>
  );
};
