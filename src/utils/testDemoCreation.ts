import { supabase } from '@/integrations/supabase/client';

export const testDemoCreation = async () => {
  try {
    console.log('🚀 Calling create-demo-users edge function...');
    
    const { data, error } = await supabase.functions.invoke('create-demo-users', {
      body: { action: 'create_demo_data' }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      throw error;
    }

    console.log('✅ Edge function response:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to call edge function:', error);
    throw error;
  }
};

// Auto-call on import for testing
testDemoCreation().then(result => {
  console.log('Demo creation test result:', result);
}).catch(error => {
  console.error('Demo creation test failed:', error);
});