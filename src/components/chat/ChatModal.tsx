
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const [isOpening, setIsOpening] = useState(false);

  const CHAT_URL = 'https://mail.google.com/chat/u/0/#chat/space/AAAAbvw8Bfs';

  const detectPopupBlocker = (popup: Window | null): boolean => {
    if (!popup) return true;
    
    try {
      // Check if popup was closed immediately
      if (popup.closed) return true;
      
      // Check if we can access popup properties (some blockers make this fail)
      popup.focus();
      return false;
    } catch (error) {
      return true;
    }
  };

  const openChatPopup = async () => {
    setIsOpening(true);
    
    try {
      // Configure popup window
      const width = 1000;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const windowFeatures = `
        width=${width},
        height=${height},
        left=${left},
        top=${top},
        resizable=yes,
        scrollbars=yes,
        status=no,
        menubar=no,
        toolbar=no,
        location=no
      `.replace(/\s/g, '');

      // Attempt to open popup
      const popup = window.open(CHAT_URL, 'teamChat', windowFeatures);
      
      // Small delay to allow popup to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if popup was blocked
      const isBlocked = detectPopupBlocker(popup);
      
      if (isBlocked) {
        // Fallback to new tab
        window.open(CHAT_URL, '_blank', 'noopener,noreferrer');
        toast.info('Popup blocked. Opening chat in new tab...');
      } else {
        toast.success('Chat opened successfully');
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error opening chat:', error);
      // Final fallback - open in new tab
      window.open(CHAT_URL, '_blank', 'noopener,noreferrer');
      toast.error('Unable to open popup. Opening in new tab...');
      onClose();
    } finally {
      setIsOpening(false);
    }
  };

  const openInNewTab = () => {
    window.open(CHAT_URL, '_blank', 'noopener,noreferrer');
    toast.success('Chat opened in new tab');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Team Chat
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Connect with your team through Google Chat. Choose how you'd like to open the chat.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={openChatPopup}
              disabled={isOpening}
              className="w-full flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {isOpening ? 'Opening Chat...' : 'Open Chat Popup'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={openInNewTab}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              If popup is blocked by your browser, we'll automatically open the chat in a new tab.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
