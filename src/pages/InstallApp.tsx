import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Download, Check, Share, Home, Apple } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallApp = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background-cream flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
              <Check className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-2xl">App Installed! 🎉</CardTitle>
            <CardDescription>
              Class Beyond is now installed on your device and ready to use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/learning-hub')} className="w-full" size="lg">
              <Home className="w-5 h-5 mr-2" />
              Go to Learning Hub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-cream p-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-lg">
            <img src="/class-beyond-logo.png" alt="Class Beyond" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-4xl font-bold">Install Class Beyond</h1>
          <p className="text-lg text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Why Install?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold">Quick Access</h3>
                <p className="text-sm text-muted-foreground">Launch directly from your home screen like a native app</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold">Works Offline</h3>
                <p className="text-sm text-muted-foreground">Access your lessons even without internet connection</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold">Auto Updates</h3>
                <p className="text-sm text-muted-foreground">Always get the latest features automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        {isIOS ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="w-5 h-5" />
                Installation on iPhone/iPad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                    1
                  </div>
                  <p className="text-sm">Tap the <Share className="w-4 h-4 inline mx-1" /> <strong>Share</strong> button at the bottom of Safari</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                    2
                  </div>
                  <p className="text-sm">Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                    3
                  </div>
                  <p className="text-sm">Tap <strong>"Add"</strong> in the top right corner</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card>
            <CardHeader>
              <CardTitle>Install with One Click</CardTitle>
              <CardDescription>
                Click the button below to install Class Beyond on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInstallClick} className="w-full" size="lg">
                <Download className="w-5 h-5 mr-2" />
                Install App
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Installation on Android/Chrome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                    1
                  </div>
                  <p className="text-sm">Tap the menu button (⋮) in your browser</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                    2
                  </div>
                  <p className="text-sm">Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                    3
                  </div>
                  <p className="text-sm">Confirm by tapping <strong>"Add"</strong> or <strong>"Install"</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/learning-hub')}>
            Skip for Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstallApp;
