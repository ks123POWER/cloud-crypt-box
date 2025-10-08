import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { FileCard } from '@/components/FileCard';
import { EncryptedFile, decryptFile, verifyFileIntegrity } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { Files, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [files, setFiles] = useState<EncryptedFile[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load files from localStorage
    const savedFiles = localStorage.getItem('encryptedFiles');
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }
  }, []);

  const handleDownload = (file: EncryptedFile) => {
    try {
      const decryptedBlob = decryptFile(file);
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
      toast({
        title: "Download failed",
        description: "Could not decrypt the file.",
        variant: "destructive",
      });
    }
  };

  const handleVerify = (file: EncryptedFile) => {
    const isValid = verifyFileIntegrity(file);
    
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
  };

  const handleDelete = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    localStorage.setItem('encryptedFiles', JSON.stringify(updatedFiles));
    
    toast({
      title: "File deleted",
      description: "The file has been removed from your vault.",
    });
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
            All files are encrypted with AES-256 and verified with SHA-256 hashing
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
                onDownload={handleDownload}
                onVerify={handleVerify}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
