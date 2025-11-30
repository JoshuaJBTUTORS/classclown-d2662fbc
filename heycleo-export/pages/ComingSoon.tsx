import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ComingSoon: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background-cream))' }}>
      <div className="max-w-2xl w-full px-4 sm:px-8 text-center">
        {/* Cleo Avatar */}
        <div className="cleo-avatar-circle mx-auto mb-6" style={{ fontSize: '64px' }}>
          {user?.user_metadata?.avatar || '🦊'}
        </div>

        {/* Heading */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--cleo-primary))' }} />
          <h1 className="text-4xl font-bold" style={{ color: 'hsl(var(--cleo-text-dark))' }}>
            Coming Soon
          </h1>
          <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--cleo-primary))' }} />
        </div>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Hi {user?.user_metadata?.first_name || 'there'}! 👋
          <br />
          <br />
          The Learning Hub is currently being prepared for you. 
          We're working hard to bring you an amazing learning experience with Cleo! 
          <br />
          <br />
          You'll be notified when it's ready. In the meantime, 
          feel free to explore your courses and start learning.
        </p>

        {/* CTA Button */}
        <Button
          onClick={() => navigate('/heycleo/my-courses')}
          className="px-8 py-6 text-lg font-bold flex items-center gap-2 mx-auto"
          style={{
            background: 'linear-gradient(135deg, #1fb86b, #35d086)',
            color: '#fff',
            borderRadius: '999px',
            boxShadow: '0 12px 26px rgba(22, 160, 90, 0.35)'
          }}
        >
          <BookOpen className="w-5 h-5" />
          Go to My Courses
        </Button>

        {/* Footer note */}
        <p className="mt-12 text-sm text-gray-500">
          <strong>Cleo says:</strong> Great things take time, and you're worth the wait! 💚
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
