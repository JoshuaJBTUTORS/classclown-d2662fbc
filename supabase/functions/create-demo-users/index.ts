import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoUser {
  id: string;
  email: string;
  password: string;
  role: string;
  first_name: string;
  last_name: string;
  metadata?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const demoUsers: DemoUser[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo.owner@jb-tutors.com',
        password: 'demo123!',
        role: 'owner',
        first_name: 'Demo',
        last_name: 'Owner'
      },
      {
        id: '00000000-0000-0000-0000-000000000002', 
        email: 'demo.admin@jb-tutors.com',
        password: 'demo123!',
        role: 'admin',
        first_name: 'Demo',
        last_name: 'Admin'
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'demo.tutor1@jb-tutors.com', 
        password: 'demo123!',
        role: 'tutor',
        first_name: 'Demo',
        last_name: 'Tutor'
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'demo.parent1@email.com',
        password: 'demo123!', 
        role: 'parent',
        first_name: 'Demo',
        last_name: 'Parent'
      }
    ];

    console.log('Creating demo users...');

    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
        
        if (existingUser.user) {
          console.log(`Demo user ${user.email} already exists, skipping...`);
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          id: user.id,
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          }
        });

        if (authError) {
          console.error(`Failed to create auth user ${user.email}:`, authError);
          continue;
        }

        console.log(`Created auth user: ${user.email}`);

        // Insert into demo_users table
        const { error: demoError } = await supabaseAdmin
          .from('demo_users')
          .insert({
            id: user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            demo_config_id: null
          });

        if (demoError) {
          console.error(`Failed to insert demo user ${user.email}:`, demoError);
        } else {
          console.log(`Inserted demo user record: ${user.email}`);
        }

      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }

    // Now populate demo data
    await populateDemoData(supabaseAdmin);

    return new Response(
      JSON.stringify({ success: true, message: 'Demo users and data created successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in create-demo-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function populateDemoData(supabase: any) {
  console.log('Starting demo data population...');

  try {
    // Create demo tutors
    const { error: tutorError } = await supabase
      .from('tutors')
      .insert([
        {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'demo.tutor1@jb-tutors.com',
          first_name: 'Demo',
          last_name: 'Tutor',
          subjects: ['Mathematics', 'Physics'],
          hourly_rate: 25.00,
          bio: 'Demo tutor for Mathematics and Physics',
          is_demo_data: true
        }
      ]);

    if (tutorError) console.error('Tutor creation error:', tutorError);
    else console.log('Demo tutors created');

    // Create demo parents
    const { error: parentError } = await supabase
      .from('parents')
      .insert([
        {
          id: '00000000-0000-0000-0000-000000000001',
          user_id: '00000000-0000-0000-0000-000000000004',
          email: 'demo.parent1@email.com',
          first_name: 'Demo',
          last_name: 'Parent',
          phone: '+44 7123 456789',
          is_demo_data: true
        }
      ]);

    if (parentError) console.error('Parent creation error:', parentError);
    else console.log('Demo parents created');

    // Create demo students
    const { error: studentError } = await supabase
      .from('students')
      .insert([
        {
          id: 1,
          email: 'demo.student1@email.com',
          first_name: 'Demo',
          last_name: 'Student',
          parent_id: '00000000-0000-0000-0000-000000000001',
          subjects: ['Mathematics'],
          year_group: 'Year 10',
          is_demo_data: true
        }
      ]);

    if (studentError) console.error('Student creation error:', studentError);
    else console.log('Demo students created');

    // Create demo lessons
    const startTime = new Date();
    startTime.setHours(14, 0, 0, 0); // 2 PM today
    const endTime = new Date(startTime);
    endTime.setHours(15, 0, 0, 0); // 3 PM today

    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .insert([
        {
          id: '00000000-0000-0000-0000-000000000001',
          title: 'Demo Mathematics Lesson',
          description: 'Demo lesson for algebra basics',
          tutor_id: '00000000-0000-0000-0000-000000000001',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          subject: 'Mathematics',
          status: 'completed',
          is_demo_data: true
        }
      ])
      .select();

    if (lessonError) console.error('Lesson creation error:', lessonError);
    else console.log('Demo lessons created');

    // Link student to lesson
    if (lessonData && lessonData.length > 0) {
      const { error: linkError } = await supabase
        .from('lesson_students')
        .insert([
          {
            lesson_id: lessonData[0].id,
            student_id: 1
          }
        ]);

      if (linkError) console.error('Lesson-student link error:', linkError);
      else console.log('Demo lesson-student links created');
    }

    // Create demo homework
    if (lessonData && lessonData.length > 0) {
      const { error: homeworkError } = await supabase
        .from('homework')
        .insert([
          {
            title: 'Demo Algebra Practice',
            description: 'Complete the quadratic equations worksheet',
            lesson_id: lessonData[0].id,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_demo_data: true
          }
        ]);

      if (homeworkError) console.error('Homework creation error:', homeworkError);
      else console.log('Demo homework created');
    }

    console.log('Demo data population completed successfully');

  } catch (error) {
    console.error('Error in demo data population:', error);
    throw error;
  }
}