// Test script to invoke daily lesson processing
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjxbxkpegcnnfjbsxazo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDailyProcessing() {
  console.log('Invoking daily lesson processing...')
  
  const { data, error } = await supabase.functions.invoke('daily-lesson-processing', {
    body: { action: 'process_daily_lessons' }
  })
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success:', data)
  }
}

testDailyProcessing()