import React, { createContext, useContext, useState, useEffect } from 'react';
import { demoAccountService } from '@/services/demoAccountService';

interface DemoContextType {
  isDemoMode: boolean;
  demoSessionId: string | null;
  setDemoMode: (isDemo: boolean, sessionId?: string) => void;
  exitDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemoMode = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoProvider');
  }
  return context;
};

interface DemoProviderProps {
  children: React.ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoSessionId, setDemoSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're in demo mode on mount
    const checkDemoMode = async () => {
      const sessionId = localStorage.getItem('demo_session_id');
      const userEmail = localStorage.getItem('demo_user_email');
      
      if (sessionId && userEmail) {
        const isDemo = await demoAccountService.isDemoUser(userEmail);
        if (isDemo) {
          setIsDemoMode(true);
          setDemoSessionId(sessionId);
        }
      }
    };

    checkDemoMode();
  }, []);

  const setDemoMode = (isDemo: boolean, sessionId?: string) => {
    setIsDemoMode(isDemo);
    if (isDemo && sessionId) {
      setDemoSessionId(sessionId);
      localStorage.setItem('demo_session_id', sessionId);
    } else {
      setDemoSessionId(null);
      localStorage.removeItem('demo_session_id');
      localStorage.removeItem('demo_user_email');
    }
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoSessionId(null);
    localStorage.removeItem('demo_session_id');
    localStorage.removeItem('demo_user_email');
    
    // Redirect to main login
    window.location.href = '/auth';
  };

  return (
    <DemoContext.Provider value={{ 
      isDemoMode, 
      demoSessionId, 
      setDemoMode, 
      exitDemoMode 
    }}>
      {children}
    </DemoContext.Provider>
  );
};