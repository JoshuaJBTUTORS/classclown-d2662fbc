import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileSettings from '@/components/learningHub/ProfileSettings';
import SubscriptionSettings from '@/components/learningHub/SubscriptionSettings';

const LearningHubSettings = () => {
  return (
    <div className="cleo-screen-wrapper">
      <section className="cleo-screen-courses">
        {/* Header with fox emoji */}
        <div className="strategist-header">
          <div className="fox-avatar">🦊</div>
          <div className="strategist-info">
            <h2>Settings</h2>
            <p className="small-label">
              Cleo says: "Keep your strategy sharp—update your info here."
            </p>
          </div>
        </div>

        {/* Tabs for settings categories */}
        <Tabs defaultValue="profile" className="cleo-tabs">
          <TabsList className="cleo-tabs-list">
            <TabsTrigger value="profile" className="cleo-tabs-trigger">
              👤 Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="cleo-tabs-trigger">
              💳 Subscription
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="cleo-tabs-content">
            <div className="course-pill" style={{ marginTop: '16px', background: 'white' }}>
              <div className="course-pill-title">
                👤 Profile Information
              </div>
              <div className="course-pill-meta" style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '12px' }}>
                Update your personal information and learning preferences
              </div>
              <ProfileSettings />
            </div>
          </TabsContent>
          
          <TabsContent value="subscription" className="cleo-tabs-content">
            <div className="course-pill" style={{ marginTop: '16px' }}>
              <div className="course-pill-title">
                💳 Subscription Management
              </div>
              <div className="course-pill-meta" style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '12px' }}>
                Manage your subscription plan and billing details
              </div>
              <SubscriptionSettings />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer tip */}
        <p className="footer-note">
          💚 Tip from Cleo: Regular updates keep your learning journey on track.
        </p>
      </section>
    </div>
  );
};

export default LearningHubSettings;
