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
        first_name: 'Sarah',
        last_name: 'Williams'
      },
      {
        id: '00000000-0000-0000-0000-000000000002', 
        email: 'demo.admin@jb-tutors.com',
        password: 'demo123!',
        role: 'admin',
        first_name: 'Michael',
        last_name: 'Johnson'
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'demo.tutor1@jb-tutors.com', 
        password: 'demo123!',
        role: 'tutor',
        first_name: 'Emma',
        last_name: 'Thompson'
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'demo.parent1@email.com',
        password: 'demo123!', 
        role: 'parent',
        first_name: 'David',
        last_name: 'Brown'
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        email: 'oliver.brown@student.com',
        password: 'demo123!', 
        role: 'student',
        first_name: 'Oliver',
        last_name: 'Brown'
      }
    ];

    console.log('Creating demo users...');

    // Store created user IDs
    const createdUserIds = new Map();

    for (const user of demoUsers) {
      try {
        // Check if user already exists by email first
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const userExists = existingUsers.users.find(u => u.email === user.email);
        
        let actualUserId = userExists?.id;

        if (userExists) {
          console.log(`Demo user ${user.email} already exists, using ID: ${actualUserId}`);
        } else {
          // Create auth user
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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

          actualUserId = authData.user.id;
          console.log(`✅ Created auth user: ${user.email} (${user.role}) - ID: ${actualUserId}`);
        }

        // Store the actual user ID
        createdUserIds.set(user.email, actualUserId);

        // Always try to insert into demo_users table (upsert)
        const { error: demoError } = await supabaseAdmin
          .from('demo_users')
          .upsert({
            id: actualUserId,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            demo_config_id: null
          }, {
            onConflict: 'email'
          });

        if (demoError) {
          console.error(`Failed to upsert demo user ${user.email}:`, demoError);
        } else {
          console.log(`✅ Upserted demo user record: ${user.email}`);
        }

        // Create user role entry
        if (actualUserId) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
              user_id: actualUserId,
              role: user.role,
              is_primary: true
            }, {
              onConflict: 'user_id'
            });

          if (roleError) {
            console.error(`Failed to create user role for ${user.email}:`, roleError);
          } else {
            console.log(`✅ Created user role: ${user.email} -> ${user.role}`);
          }
        }

      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }

    // Now populate demo data with actual user IDs
    await populateDemoData(supabaseAdmin, createdUserIds);

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

async function populateDemoData(supabase: any, userIds: Map<string, string>) {
  console.log('Starting demo data population...');

  try {
    const tutorUserId = userIds.get('demo.tutor1@jb-tutors.com');
    const parentUserId = userIds.get('demo.parent1@email.com');
    
    if (!tutorUserId || !parentUserId) {
      console.error('Missing required user IDs for demo data creation');
      return;
    }

    // Create demo tutors
    const { error: tutorError } = await supabase
      .from('tutors')
      .upsert([
        {
          id: tutorUserId,
          email: 'demo.tutor1@jb-tutors.com',
          first_name: 'Emma',
          last_name: 'Thompson',
          phone: '+44 7700 900001',
          specialities: ['Mathematics', 'Physics'],
          normal_hourly_rate: 45,
          absence_hourly_rate: 50,
          status: 'active',
          bio: 'Demo tutor for Mathematics and Physics',
          is_demo_data: true
        }
      ], { onConflict: 'id' });

    if (tutorError) console.error('Tutor creation error:', tutorError);
    else console.log('Demo tutors created');

    // Create demo parents
    const { error: parentError } = await supabase
      .from('parents')
      .upsert([
        {
          id: crypto.randomUUID(),
          user_id: parentUserId,
          email: 'demo.parent1@email.com',
          first_name: 'David',
          last_name: 'Brown',
          phone: '+44 7123 456789',
          is_demo_data: true
        }
      ], { onConflict: 'user_id' });

    if (parentError) console.error('Parent creation error:', parentError);
    else console.log('Demo parents created');

    // Get the created parent record to get the correct parent ID
    const { data: parentData, error: parentFetchError } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', parentUserId)
      .eq('is_demo_data', true)
      .single();

    if (parentFetchError) {
      console.error('Error fetching parent ID:', parentFetchError);
      return;
    }

    // Create demo students
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .upsert([
        {
          email: 'demo.student1@email.com',
          first_name: 'Oliver',
          last_name: 'Brown',
          parent_id: parentData.id,
          subjects: ['Mathematics', 'Physics'],
          year_group: 'Year 10',
          status: 'active',
          is_demo_data: true
        },
        {
          email: 'demo.student2@email.com',
          first_name: 'Emma',
          last_name: 'Brown',
          parent_id: parentData.id,
          subjects: ['English', 'History'],
          year_group: 'Year 8',
          status: 'active',
          is_demo_data: true
        }
      ], { onConflict: 'email' })
      .select();

    if (studentError) console.error('Student creation error:', studentError);
    else console.log('Demo students created');

    // Create demo lessons
    const currentDate = new Date();
    const startTime = new Date(currentDate);
    startTime.setHours(14, 0, 0, 0); // 2 PM today
    const endTime = new Date(startTime);
    endTime.setHours(15, 0, 0, 0); // 3 PM today

    const pastTime = new Date(currentDate);
    pastTime.setDate(pastTime.getDate() - 7);
    pastTime.setHours(14, 0, 0, 0);
    const pastEndTime = new Date(pastTime);
    pastEndTime.setHours(15, 0, 0, 0);

    const futureTime = new Date(currentDate);
    futureTime.setDate(futureTime.getDate() + 7);
    futureTime.setHours(14, 0, 0, 0);
    const futureEndTime = new Date(futureTime);
    futureEndTime.setHours(15, 0, 0, 0);

    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .upsert([
        {
          id: crypto.randomUUID(),
          title: 'Mathematics - Quadratic Equations',
          description: 'Demo lesson covering quadratic equations and factoring',
          tutor_id: tutorUserId,
          start_time: pastTime.toISOString(),
          end_time: pastEndTime.toISOString(),
          subject: 'Mathematics',
          status: 'completed',
          is_demo_data: true
        },
        {
          id: crypto.randomUUID(),
          title: 'Physics - Newton\'s Laws',
          description: 'Demo lesson on Newton\'s three laws of motion',
          tutor_id: tutorUserId,
          start_time: futureTime.toISOString(),
          end_time: futureEndTime.toISOString(),
          subject: 'Physics',
          status: 'scheduled',
          is_demo_data: true
        }
      ], { onConflict: 'id' })
      .select();

    if (lessonError) console.error('Lesson creation error:', lessonError);
    else console.log('Demo lessons created');

    // Link students to lessons
    if (lessonData && lessonData.length > 0 && studentData && studentData.length > 0) {
      const lessonStudentLinks = [];
      for (const lesson of lessonData) {
        for (const student of studentData) {
          lessonStudentLinks.push({
            lesson_id: lesson.id,
            student_id: student.id
          });
        }
      }

      const { error: linkError } = await supabase
        .from('lesson_students')
        .upsert(lessonStudentLinks, { onConflict: 'lesson_id,student_id' });

      if (linkError) console.error('Lesson-student link error:', linkError);
      else console.log('Demo lesson-student links created');

      // Create demo homework
      const homeworkData = lessonData.map(lesson => ({
        title: `${lesson.subject} Practice Assignment`,
        description: `Practice exercises for ${lesson.title}`,
        lesson_id: lesson.id,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_demo_data: true
      }));

      const { error: homeworkError } = await supabase
        .from('homework')
        .upsert(homeworkData, { onConflict: 'lesson_id,title' });

      if (homeworkError) console.error('Homework creation error:', homeworkError);
      else console.log('Demo homework created');
    }

    console.log('Demo data population completed successfully');

  } catch (error) {
    console.error('Error in demo data population:', error);
    throw error;
  }
}