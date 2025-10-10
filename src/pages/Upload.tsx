import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { UploadZone } from '@/components/UploadZone';
import { encryptFile } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, masterPassword } = useAuth();

  const handleFileSelect = async (file: File) => {
    if (!user || !masterPassword) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setUploadComplete(false);

    try {
      // Start progress simulation
      setProgress(10);

      // Encrypt the file
      const { encryptedData, iv, hash } = await encryptFile(file, masterPassword);
      setProgress(40);

      // Generate storage path
      const timestamp = Date.now();
      const storagePath = `${user.id}/${timestamp}-${file.name}`;

      // Upload encrypted file to Supabase storage
      const { error: uploadError } = await supabase
        .storage
        .from('encrypted-files')
        .upload(storagePath, new Blob([encryptedData]), {
          contentType: 'application/octet-stream',
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      setProgress(70);

      // Save file metadata to database
      const ivBase64 = btoa(String.fromCharCode(...iv));
      
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
          encryption_key: ivBase64,
          file_hash: hash,
          is_encrypted: true
        });

      if (dbError) throw dbError;

      setProgress(100);
      setUploadComplete(true);

      toast({
        title: "File uploaded successfully",
        description: "Your file has been encrypted and stored securely.",
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not encrypt and upload the file.",
        variant: "destructive",
      });
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Upload & Encrypt</h1>
            <p className="text-muted-foreground">
              Your files are encrypted with AES-256-GCM using your unique master password
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-8">
              {!uploadComplete ? (
                <UploadZone onFileSelect={handleFileSelect} isUploading={isUploading} />
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-success/10 rounded-full">
                      <CheckCircle2 className="h-16 w-16 text-success" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your file has been encrypted and stored securely
                  </p>
                  <Button onClick={() => navigate('/dashboard')}>
                    View in Dashboard
                  </Button>
                </div>
              )}

              {isUploading && !uploadComplete && (
                <div className="mt-6 space-y-3">
                  <Progress value={progress} />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {progress < 40 ? 'Encrypting file...' : progress < 70 ? 'Uploading...' : 'Finalizing...'}
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">AES-256-GCM</h3>
                <p className="text-sm text-muted-foreground">
                  Military-grade encryption
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Master Password</h3>
                <p className="text-sm text-muted-foreground">
                  Unique encryption seed per user
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">SHA-256 Hash</h3>
                <p className="text-sm text-muted-foreground">
                  Integrity verification
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;
