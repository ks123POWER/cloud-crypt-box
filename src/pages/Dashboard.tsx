import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { FileCard } from '@/components/FileCard';
import { ShareDialog } from '@/components/ShareDialog';
import { EncryptedFile, decryptFile, verifyFileIntegrity } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { Files, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Dashboard = () => {
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<EncryptedFile | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<'download' | 'verify'>('download');
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, masterPassword } = useAuth();

  useEffect(() => {
    loadFiles();
  }, [user]);

  const loadFiles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map database schema to EncryptedFile interface
      const mappedFiles: EncryptedFile[] = (data || []).map(file => ({
        id: file.id,
        fileName: file.file_name,
        fileSize: file.file_size,
        fileType: file.file_type || 'application/octet-stream',
        storagePath: file.storage_path,
        fileHash: file.file_hash,
        encryptionKey: file.encryption_key,
        createdAt: file.created_at,
        userId: file.user_id
      }));
      
      setFiles(mappedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Failed to load files",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    }
  };

  const promptForPassword = (file: EncryptedFile, action: 'download' | 'verify') => {
    setSelectedFile(file);
    setPasswordAction(action);
    setPasswordDialogOpen(true);
    setMasterPasswordInput(masterPassword || '');
  };

  const handlePasswordSubmit = async () => {
    if (!selectedFile || !masterPasswordInput) return;
    
    if (passwordAction === 'download') {
      await handleDownloadWithPassword(selectedFile, masterPasswordInput);
    } else {
      await handleVerifyWithPassword(selectedFile, masterPasswordInput);
    }
    
    setPasswordDialogOpen(false);
    setMasterPasswordInput('');
    setSelectedFile(null);
  };

  const handleDownloadWithPassword = async (file: EncryptedFile, password: string) => {
    setIsLoading(true);
    try {
      // Download encrypted file from storage
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('encrypted-files')
        .download(file.storagePath);
      
      if (downloadError) throw downloadError;
      
      // Decrypt the file
      const encryptedBuffer = await fileData.arrayBuffer();
      const decryptedBlob = await decryptFile(
        encryptedBuffer,
        file.encryptionKey,
        password,
        file.fileName,
        file.fileType || 'application/octet-stream'
      );
      
      // Trigger download
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
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

  const handleVerifyWithPassword = async (file: EncryptedFile, password: string) => {
    setIsLoading(true);
    try {
      // Download encrypted file from storage
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('encrypted-files')
        .download(file.storagePath);
      
      if (downloadError) throw downloadError;
      
      const encryptedBuffer = await fileData.arrayBuffer();
      const isValid = await verifyFileIntegrity(encryptedBuffer, file.fileHash);
      
      if (isValid) {
        toast({
          title: "✓ Integrity verified",
          description: "File has not been tampered with.",
        });
      } else {
        toast({
          title: "⚠ Verification failed",
          description: "File integrity check failed. File may be corrupted.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Verify error:', error);
      toast({
        title: "Verification failed",
        description: "Could not verify file integrity.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const fileToDelete = files.find(f => f.id === id);
      if (!fileToDelete) return;
      
      // Delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('encrypted-files')
        .remove([fileToDelete.storagePath]);
      
      if (storageError) throw storageError;
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);
      
      if (dbError) throw dbError;
      
      setFiles(files.filter(f => f.id !== id));
      
      toast({
        title: "File deleted",
        description: "The file has been removed from your vault.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the file.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (file: EncryptedFile) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Your Secure Vault
            </h1>
            <Button onClick={() => navigate('/upload')}>
              Upload File
            </Button>
          </div>
          <p className="text-muted-foreground">
            All files are encrypted with AES-256-GCM using your unique master password
          </p>
        </div>

        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 bg-muted/30 rounded-full mb-4">
              <Files className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No files yet</h2>
            <p className="text-muted-foreground mb-6">
              Upload your first encrypted file to get started
            </p>
            <Button onClick={() => navigate('/upload')}>
              Upload your first file
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDownload={(file) => promptForPassword(file, 'download')}
                onVerify={(file) => promptForPassword(file, 'verify')}
                onDelete={handleDelete}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </main>

      {selectedFile && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          fileId={selectedFile.id}
          fileName={selectedFile.fileName}
        />
      )}

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Master Password</DialogTitle>
            <DialogDescription>
              Your master password is required to {passwordAction === 'download' ? 'decrypt and download' : 'verify'} this file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="master-password">Master Password</Label>
              <Input
                id="master-password"
                type="password"
                value={masterPasswordInput}
                onChange={(e) => setMasterPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter your master password"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordSubmit}
                disabled={!masterPasswordInput || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Processing...' : 'Continue'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
