import { demoAccountService } from '@/services/demoAccountService';

export const populateDemoDataNow = async () => {
  try {
    console.log('🚀 Starting demo data population...');
    await demoAccountService.populateDemoData();
    console.log('✅ Demo data populated successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to populate demo data:', error);
    return false;
  }
};

// Call function immediately to populate data
populateDemoDataNow().then((success) => {
  if (success) {
    console.log('Demo system is ready! Visit /demo to access demo mode.');
  }
});