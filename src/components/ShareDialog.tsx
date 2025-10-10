import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Link as LinkIcon, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
}

export const ShareDialog = ({ open, onOpenChange, fileId, fileName }: ShareDialogProps) => {
  const [expiryDays, setExpiryDays] = useState<string>('7');
  const [shareLink, setShareLink] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      // Generate a random token
      const token = crypto.getRandomValues(new Uint8Array(32));
      const linkToken = Array.from(token, byte => byte.toString(16).padStart(2, '0')).join('');
      
      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));
      
      // Create shareable link record
      const { error } = await supabase
        .from('shareable_links')
        .insert({
          file_id: fileId,
          link_token: linkToken,
          expires_at: expiresAt.toISOString()
        });
      
      if (error) throw error;
      
      // Generate the full link
      const fullLink = `${window.location.origin}/shared/${linkToken}`;
      setShareLink(fullLink);
      
      toast({
        title: "Share link created",
        description: "Anyone with this link can download the file.",
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Failed to create share link",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Copied to clipboard",
      description: "Share link has been copied.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Share File
          </DialogTitle>
          <DialogDescription>
            Create a secure shareable link for "{fileName}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!shareLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="expiry">Link Expiry</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger id="expiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={generateShareLink} 
                disabled={isGenerating}
                className="w-full"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Share Link'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="link">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="link"
                    value={shareLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Expires in {expiryDays} {expiryDays === '1' ? 'day' : 'days'}</span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                ⚠️ Recipients will need the master password to decrypt and download the file.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
