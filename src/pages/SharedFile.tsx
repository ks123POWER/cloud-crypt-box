import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Download, FileText, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { decryptFile } from '@/lib/crypto';

const SharedFile = () => {
  const { token } = useParams<{ token: string }>();
  const [masterPassword, setMasterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      loadFileInfo();
    }
  }, [token]);

  const loadFileInfo = async () => {
    try {
      const { data: linkData, error: linkError } = await supabase
        .from('shareable_links')
        .select(`
          *,
          files (*)
        `)
        .eq('link_token', token)
        .single();

      if (linkError) {
        toast({
          title: "Invalid link",
          description: "This share link does not exist or has been deleted.",
          variant: "destructive",
        });
        return;
      }

      // Check if link is expired
      if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
        setLinkExpired(true);
        toast({
          title: "Link expired",
          description: "This share link has expired.",
          variant: "destructive",
        });
        return;
      }

      setFileInfo(linkData.files);
    } catch (error) {
      console.error('Error loading file info:', error);
      toast({
        title: "Error",
        description: "Failed to load file information.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!fileInfo || !masterPassword) {
      toast({
        title: "Master password required",
        description: "Please enter the master password to decrypt the file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Download encrypted file from storage
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('encrypted-files')
        .download(fileInfo.storage_path);

      if (downloadError) throw downloadError;

      // Decrypt the file
      const encryptedBuffer = await fileData.arrayBuffer();
      const decryptedBlob = await decryptFile(
        encryptedBuffer,
        fileInfo.encryption_key,
        masterPassword,
        fileInfo.file_name,
        fileInfo.file_type || 'application/octet-stream'
      );

      // Trigger download
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "File downloaded",
        description: "Your file has been decrypted and downloaded.",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Could not decrypt the file. Check your master password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Shared Encrypted File</CardTitle>
          <CardDescription>
            {linkExpired 
              ? "This share link has expired" 
              : "Enter the master password to decrypt and download"}
          </CardDescription>
        </CardHeader>
        
        {!linkExpired && fileInfo && (
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{fileInfo.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(fileInfo.file_size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Encrypted with AES-256-GCM</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="master-password">Master Password</Label>
              <Input
                id="master-password"
                type="password"
                placeholder="Enter the master password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              />
              <p className="text-xs text-muted-foreground">
                The file owner should have provided you with this password
              </p>
            </div>

            <Button 
              onClick={handleDownload}
              disabled={!masterPassword || isLoading}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? 'Decrypting...' : 'Decrypt & Download'}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default SharedFile;
