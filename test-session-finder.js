// Test script to run the new find-lesson-sessions function
const supabaseUrl = 'https://sjxbxkpegcnnfjbsxazo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA';

async function testSessionFinder() {
  try {
    console.log('Testing session finder function...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/find-lesson-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'find_session_ids',
        processing_date: '2025-07-31'
      })
    });

    const result = await response.json();
    console.log('Session finder result:', result);
    
    return result;
  } catch (error) {
    console.error('Error running session finder:', error);
    return null;
  }
}

// Test with specific lesson ID
async function testWithLessonId() {
  try {
    console.log('Testing with specific lesson ID...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/find-lesson-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'find_session_ids',
        lesson_ids: ['a0b01918-3122-40d3-99d8-9f74e41885e6']
      })
    });

    const result = await response.json();
    console.log('Specific lesson result:', result);
    
    return result;
  } catch (error) {
    console.error('Error testing specific lesson:', error);
    return null;
  }
}

// Run tests
console.log('=== Testing by date ===');
testSessionFinder().then(() => {
  console.log('=== Testing by lesson ID ===');
  return testWithLessonId();
});