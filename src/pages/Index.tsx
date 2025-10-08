import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Lock, FileCheck, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">SecureVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button onClick={() => navigate('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Your Files, Encrypted.
              <br />
              <span className="text-primary">Always Secure.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Store and manage your sensitive files with military-grade AES-256 encryption.
              Your data is encrypted client-side before it ever leaves your device.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/register')}>
                Start Encrypting Files
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Built for Security</h2>
            <p className="text-muted-foreground">
              Modern cryptographic techniques to keep your files safe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full inline-block mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">AES-256 Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  Military-grade encryption standard used by governments worldwide
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full inline-block mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Client-Side Security</h3>
                <p className="text-sm text-muted-foreground">
                  Files are encrypted on your device before upload
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full inline-block mb-4">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Integrity Verification</h3>
                <p className="text-sm text-muted-foreground">
                  SHA-256 hashing ensures files haven't been tampered with
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full inline-block mb-4">
                  <Key className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Secure Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Share encrypted files with RSA key exchange (coming soon)
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to secure your files?
              </h2>
              <p className="text-lg mb-6 opacity-90">
                Join thousands of users protecting their data with SecureVault
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate('/register')}>
                Create Free Account
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2024 SecureVault. Built with modern cryptographic standards.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
