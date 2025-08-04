import { demoAccountService } from '@/services/demoAccountService';

export const initializeDemoData = async () => {
  console.log('🔧 Initializing demo data...');
  
  try {
    await demoAccountService.populateDemoData();
    console.log('✅ Demo data initialization completed!');
    return true;
  } catch (error) {
    console.error('❌ Demo data initialization failed:', error);
    return false;
  }
};

// Auto-initialize demo data when the module loads (for testing)
if (typeof window !== 'undefined') {
  console.log('📋 Demo initialization ready. Call initializeDemoData() to populate demo accounts.');
}