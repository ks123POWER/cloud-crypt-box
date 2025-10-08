import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { UploadZone } from '@/components/UploadZone';
import { encryptFile, EncryptedFile } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    setUploadComplete(false);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Encrypt the file
      const encryptedFile = await encryptFile(file);

      clearInterval(progressInterval);
      setProgress(100);

      // Save to localStorage
      const savedFiles = localStorage.getItem('encryptedFiles');
      const files: EncryptedFile[] = savedFiles ? JSON.parse(savedFiles) : [];
      files.push(encryptedFile);
      localStorage.setItem('encryptedFiles', JSON.stringify(files));

      setUploadComplete(true);

      toast({
        title: "File uploaded successfully",
        description: "Your file has been encrypted and stored securely.",
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not encrypt and upload the file.",
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
              Your files are encrypted client-side before upload using AES-256 GCM
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
                      {progress < 50 ? 'Encrypting file...' : 'Uploading...'}
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
                <h3 className="font-semibold mb-1">AES-256 Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  Military-grade encryption standard
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Client-Side</h3>
                <p className="text-sm text-muted-foreground">
                  Files encrypted on your device
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Hash Verification</h3>
                <p className="text-sm text-muted-foreground">
                  SHA-256 integrity checks
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
