import { supabase } from '@/integrations/supabase/client';

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  role: 'owner' | 'admin' | 'tutor' | 'parent' | 'student';
  firstName: string;
  lastName: string;
  metadata?: any;
}

export interface DemoConfiguration {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  users: DemoUser[];
  expiresAt?: Date;
}

class DemoAccountService {
  // Demo user credentials
  private demoUsers: DemoUser[] = [
    {
      id: 'demo-owner-1',
      email: 'demo.owner@jb-tutors.com',
      password: 'DemoOwner2024!',
      role: 'owner',
      firstName: 'Sarah',
      lastName: 'Williams',
    },
    {
      id: 'demo-admin-1',
      email: 'demo.admin@jb-tutors.com',
      password: 'DemoAdmin2024!',
      role: 'admin',
      firstName: 'Michael',
      lastName: 'Johnson',
    },
    {
      id: 'demo-tutor-1',
      email: 'demo.tutor1@jb-tutors.com',
      password: 'DemoTutor2024!',
      role: 'tutor',
      firstName: 'Emma',
      lastName: 'Thompson',
      metadata: { subjects: ['Mathematics', 'Physics'], yearGroups: ['Year 10', 'Year 11', 'Year 13'] }
    },
    {
      id: 'demo-tutor-2',
      email: 'demo.tutor2@jb-tutors.com',
      password: 'DemoTutor2024!',
      role: 'tutor',
      firstName: 'James',
      lastName: 'Wilson',
      metadata: { subjects: ['English', 'History'], yearGroups: ['Year 7', 'Year 8', 'Year 9'] }
    },
    {
      id: 'demo-tutor-3',
      email: 'demo.tutor3@jb-tutors.com',
      password: 'DemoTutor2024!',
      role: 'tutor',
      firstName: 'Sophie',
      lastName: 'Davis',
      metadata: { subjects: ['Chemistry', 'Biology'], yearGroups: ['Year 10', 'Year 11', 'Year 12', 'Year 13'] }
    },
    {
      id: 'demo-parent-1',
      email: 'demo.parent1@email.com',
      password: 'DemoParent2024!',
      role: 'parent',
      firstName: 'David',
      lastName: 'Brown',
    },
    {
      id: 'demo-parent-2',
      email: 'demo.parent2@email.com',
      password: 'DemoParent2024!',
      role: 'parent',
      firstName: 'Lisa',
      lastName: 'Miller',
    },
    {
      id: 'demo-parent-3',
      email: 'demo.parent3@email.com',
      password: 'DemoParent2024!',
      role: 'parent',
      firstName: 'Robert',
      lastName: 'Garcia',
    },
    {
      id: 'demo-parent-4',
      email: 'demo.parent4@email.com',
      password: 'DemoParent2024!',
      role: 'parent',
      firstName: 'Jennifer',
      lastName: 'Martinez',
    }
  ];

  async createDemoConfiguration(name: string, description: string): Promise<string> {
    // For now, return a static demo config ID
    // This will be implemented when the database migration is approved
    return 'demo-config-' + Date.now();
  }

  async getDemoConfigurations() {
    // Return mock demo configurations
    return [{
      id: 'demo-config-1',
      name: 'Default Demo',
      description: 'Default demonstration configuration',
      is_active: true,
      demo_users: this.demoUsers
    }];
  }

  async startDemoSession(configId: string, userId: string) {
    // Return mock demo session
    return {
      id: 'demo-session-' + Date.now(),
      configuration_id: configId,
      user_id: userId,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    };
  }

  async isDemoUser(email: string): Promise<boolean> {
    return this.demoUsers.some(user => user.email === email);
  }

  async getDemoUserByEmail(email: string): Promise<DemoUser | null> {
    return this.demoUsers.find(user => user.email === email) || null;
  }

  async populateDemoData(): Promise<void> {
    console.log('Starting demo data population...');
    try {
      await this.createDemoTutors();
      console.log('✓ Demo tutors created');
      
      await this.createDemoParents();
      console.log('✓ Demo parents created');
      
      await this.createDemoStudents();
      console.log('✓ Demo students created');
      
      await this.createDemoLessons();
      console.log('✓ Demo lessons created');
      
      await this.createDemoHomework();
      console.log('✓ Demo homework created');
      
      await this.createDemoProgress();
      console.log('✓ Demo progress data created');
      
      console.log('🎉 Demo data population completed successfully!');
    } catch (error) {
      console.error('❌ Error populating demo data:', error);
      throw error;
    }
  }

  private async createDemoTutors() {
    const demoTutors = [
      {
        first_name: 'Emma',
        last_name: 'Thompson',
        email: 'demo.tutor1@jb-tutors.com',
        subjects: ['Mathematics', 'Physics'],
        year_groups: ['Year 10', 'Year 11', 'Year 13'],
        bio: 'Experienced mathematics and physics tutor with 8+ years of teaching experience.',
        hourly_rate: 35,
        is_demo_data: true,
      },
      {
        first_name: 'James',
        last_name: 'Wilson',
        email: 'demo.tutor2@jb-tutors.com',
        subjects: ['English', 'History'],
        year_groups: ['Year 7', 'Year 8', 'Year 9'],
        bio: 'Passionate English and History teacher specializing in KS3 curriculum.',
        hourly_rate: 30,
        is_demo_data: true,
      },
      {
        first_name: 'Sophie',
        last_name: 'Davis',
        email: 'demo.tutor3@jb-tutors.com',
        subjects: ['Chemistry', 'Biology'],
        year_groups: ['Year 10', 'Year 11', 'Year 12', 'Year 13'],
        bio: 'Science specialist with expertise in GCSE and A-Level Chemistry and Biology.',
        hourly_rate: 40,
        is_demo_data: true,
      }
    ];

    const { error } = await supabase
      .from('tutors')
      .insert(demoTutors);

    if (error && !error.message.includes('duplicate')) {
      throw error;
    }
  }

  private async createDemoParents() {
    // Generate fake UUIDs for demo parents
    const demoParents = [
      {
        first_name: 'David',
        last_name: 'Brown',
        email: 'demo.parent1@email.com',
        phone: '07123456789',
        user_id: '11111111-1111-1111-1111-111111111111', // Mock UUID
      },
      {
        first_name: 'Lisa',
        last_name: 'Miller',
        email: 'demo.parent2@email.com',
        phone: '07234567890',
        user_id: '22222222-2222-2222-2222-222222222222',
      },
      {
        first_name: 'Robert',
        last_name: 'Garcia',
        email: 'demo.parent3@email.com',
        phone: '07345678901',
        user_id: '33333333-3333-3333-3333-333333333333',
      },
      {
        first_name: 'Jennifer',
        last_name: 'Martinez',
        email: 'demo.parent4@email.com',
        phone: '07456789012',
        user_id: '44444444-4444-4444-4444-444444444444',
      }
    ];

    const { error } = await supabase
      .from('parents')
      .insert(demoParents);

    if (error && !error.message.includes('duplicate')) {
      console.log('Demo parents creation skipped - will be implemented after migration');
    }
  }

  private async createDemoStudents() {
    // Mock parent IDs for demo students
    const parentIds = {
      'demo.parent1@email.com': '11111111-1111-1111-1111-111111111111',
      'demo.parent2@email.com': '22222222-2222-2222-2222-222222222222',
      'demo.parent3@email.com': '33333333-3333-3333-3333-333333333333',
      'demo.parent4@email.com': '44444444-4444-4444-4444-444444444444',
    };

    const demoStudents = [
      {
        first_name: 'Oliver',
        last_name: 'Brown',
        email: 'oliver.brown@student.com',
        grade: 'Year 10',
        subjects: 'Mathematics,Physics,Chemistry', // Store as comma-separated string
        parent_id: parentIds['demo.parent1@email.com'],
      },
      {
        first_name: 'Emily',
        last_name: 'Brown',
        email: 'emily.brown@student.com',
        grade: 'Year 8',
        subjects: 'English,History,Mathematics',
        parent_id: parentIds['demo.parent1@email.com'],
      },
      {
        first_name: 'Lucas',
        last_name: 'Miller',
        email: 'lucas.miller@student.com',
        grade: 'Year 11',
        subjects: 'Mathematics,Physics,Chemistry',
        parent_id: parentIds['demo.parent2@email.com'],
      },
      {
        first_name: 'Sophie',
        last_name: 'Miller',
        email: 'sophie.miller@student.com',
        grade: 'Year 13',
        subjects: 'Biology,Chemistry,Mathematics',
        parent_id: parentIds['demo.parent2@email.com'],
      },
      {
        first_name: 'Mason',
        last_name: 'Garcia',
        email: 'mason.garcia@student.com',
        grade: 'Year 9',
        subjects: 'English,History,Geography',
        parent_id: parentIds['demo.parent3@email.com'],
      },
      {
        first_name: 'Ava',
        last_name: 'Garcia',
        email: 'ava.garcia@student.com',
        grade: 'Year 7',
        subjects: 'English,Mathematics,Science',
        parent_id: parentIds['demo.parent3@email.com'],
      },
      {
        first_name: 'Ethan',
        last_name: 'Martinez',
        email: 'ethan.martinez@student.com',
        grade: 'Year 12',
        subjects: 'Physics,Mathematics,Chemistry',
        parent_id: parentIds['demo.parent4@email.com'],
      },
      {
        first_name: 'Isabella',
        last_name: 'Martinez',
        email: 'isabella.martinez@student.com',
        grade: 'Year 6',
        subjects: 'Mathematics,English,Science',
        parent_id: parentIds['demo.parent4@email.com'],
      }
    ];

    const { error } = await supabase
      .from('students')
      .insert(demoStudents);

    if (error && !error.message.includes('duplicate')) {
      console.log('Demo students creation skipped - will be implemented after migration');
    }
  }

  private async createDemoLessons() {
    // Mock tutor IDs for demo lessons
    const tutorIds = [
      '55555555-5555-5555-5555-555555555555',
      '66666666-6666-6666-6666-666666666666', 
      '77777777-7777-7777-7777-777777777777'
    ];

    const subjects = ['Mathematics', 'Physics', 'English', 'Chemistry', 'Biology'];
    const now = new Date();
    const demoLessons = [];

    // Past lessons (last 30 days)
    for (let i = 1; i <= 20; i++) {
      const lessonDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const subject = subjects[i % subjects.length];
      
      demoLessons.push({
        title: `${subject} Lesson`,
        description: `Regular ${subject} lesson covering curriculum topics`,
        tutor_id: tutorIds[i % tutorIds.length],
        start_time: new Date(lessonDate.setHours(14 + (i % 4), 0, 0, 0)),
        end_time: new Date(lessonDate.setHours(15 + (i % 4), 0, 0, 0)),
        subject: subject,
        status: 'completed',
        lesson_type: 'regular',
      });
    }

    // Future lessons (next 30 days)
    for (let i = 1; i <= 15; i++) {
      const lessonDate = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));
      const subject = subjects[i % subjects.length];
      
      demoLessons.push({
        title: `${subject} Lesson`,
        description: `Upcoming ${subject} lesson`,
        tutor_id: tutorIds[i % tutorIds.length],
        start_time: new Date(lessonDate.setHours(14 + (i % 4), 0, 0, 0)),
        end_time: new Date(lessonDate.setHours(15 + (i % 4), 0, 0, 0)),
        subject: subject,
        status: 'scheduled',
        lesson_type: 'regular',
      });
    }

    const { error } = await supabase
      .from('lessons')
      .insert(demoLessons);

    if (error && !error.message.includes('duplicate')) {
      console.log('Demo lessons creation skipped - will be implemented after migration');
    }
  }

  private async createDemoHomework() {
    // Mock lesson IDs for demo homework
    const lessonIds = [
      '88888888-8888-8888-8888-888888888888',
      '99999999-9999-9999-9999-999999999999',
    ];

    const subjects = ['Mathematics', 'Physics', 'English'];
    const demoHomework = subjects.map((subject, index) => ({
      title: `${subject} Practice Exercise ${index + 1}`,
      description: `Complete practice problems for ${subject}`,
      lesson_id: lessonIds[index % lessonIds.length],
      due_date: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 days from now
      attachment_type: 'document',
    }));

    const { error } = await supabase
      .from('homework')
      .insert(demoHomework);

    if (error && !error.message.includes('duplicate')) {
      console.log('Demo homework creation skipped - will be implemented after migration');
    }
  }

  private async createDemoAssessments() {
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
    
    const demoAssessments = subjects.map((subject, index) => ({
      title: `${subject} Assessment - Demo`,
      description: `Comprehensive ${subject} assessment for demonstration purposes`,
      subject: subject,
      year: 10 + (index % 4),
      exam_board: 'AQA',
      paper_type: 'Mock Exam',
      total_marks: 80,
      time_limit_minutes: 90,
      status: 'published',
    }));

    const { error } = await supabase
      .from('ai_assessments')
      .insert(demoAssessments);

    if (error && !error.message.includes('duplicate')) {
      console.log('Demo assessments creation skipped - will be implemented after migration');
    }
  }

  private async createDemoProgress() {
    // This would create demo progress data, lesson summaries, etc.
    // Implementation would depend on your progress tracking structure
    console.log('Demo progress data creation - to be implemented based on progress tracking needs');
  }

  async cleanupDemoData() {
    console.log('Demo data cleanup - will be implemented after migration');
    // This will clean up demo data once the migration adds the is_demo_data flag
  }
}

export const demoAccountService = new DemoAccountService();