// Test script to run daily processing function
const supabaseUrl = 'https://sjxbxkpegcnnfjbsxazo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA';

async function testDailyProcessing() {
  try {
    console.log('Testing daily processing function...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/daily-lesson-processing`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'process_daily_lessons'
      })
    });

    const result = await response.json();
    console.log('Daily processing result:', result);
    
    return result;
  } catch (error) {
    console.error('Error running daily processing:', error);
    return null;
  }
}

// Run the test
testDailyProcessing();