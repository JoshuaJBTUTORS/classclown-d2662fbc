import { demoAccountService } from '@/services/demoAccountService';

export const populateDemoDataNow = async () => {
  try {
    console.log('🚀 Starting demo data population...');
    
    // Note: Auth user creation requires server-side admin API
    // For now, just populate the demo tables
    await demoAccountService.populateDemoData();
    console.log('✅ Demo data populated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to populate demo data:', error);
    return false;
  }
};

// Note: Demo users will need to be created manually or via edge function
console.log('📋 Demo User Credentials:');
console.log('Owner: demo.owner@jb-tutors.com / demo123!');
console.log('Admin: demo.admin@jb-tutors.com / demo123!');
console.log('Tutor 1: demo.tutor1@jb-tutors.com / demo123!');
console.log('Parent 1: demo.parent1@email.com / demo123!');
console.log('Visit /demo to try demo mode after creating these users');

// Demo data population is now manual only
// Use /demo page or call populateDemoDataNow() manually when needed