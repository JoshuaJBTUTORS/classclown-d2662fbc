import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminAccount {
  email: string;
  firstName: string;
  lastName: string;
  availability: {
    days: number[]; // 0=Sunday, 1=Monday, etc.
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Define the admin accounts to create
    const adminAccounts: AdminAccount[] = [
      {
        email: 'Joshua@classbeyondacademy.io',
        firstName: 'Joshua',
        lastName: 'Ekundayo',
        availability: {
          monday: '09:00-20:00',
          tuesday: '09:00-20:00',
          wednesday: '09:00-20:00',
          thursday: '09:00-20:00',
          friday: '09:00-20:00',
          saturday: '09:00-20:00',
          sunday: '09:00-20:00'
        }
      },
      {
        email: 'Britney@classbeyondacademy.io',
        firstName: 'Britney',
        lastName: 'Lawrence',
        availability: {
          monday: '09:00-20:00',
          tuesday: '09:00-20:00',
          wednesday: '09:00-20:00',
          thursday: '09:00-20:00',
          friday: '09:00-20:00',
          saturday: '09:00-20:00',
          sunday: '09:00-20:00'
        }
      },
      {
        email: 'Musa@classbeyondacademy.io',
        firstName: 'Musa',
        lastName: 'Thulubona',
        availability: {
          days: [1, 2, 3, 4, 5], // Monday to Friday
          startTime: '12:00',
          endTime: '20:00'
        }
      }
    ];

    const results = [];

    for (const admin of adminAccounts) {
      console.log(`Creating admin account for ${admin.email}`);
      
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(admin.email);
        
        let userId: string;
        
        if (existingUser.user) {
          console.log(`User ${admin.email} already exists, using existing account`);
          userId = existingUser.user.id;
        } else {
          // Create the auth user with a temporary password
          const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: admin.email,
            password: 'TempPassword123!', // They'll need to reset this
            email_confirm: true,
            user_metadata: {
              first_name: admin.firstName,
              last_name: admin.lastName
            }
          });

          if (authError) {
            console.error(`Error creating auth user for ${admin.email}:`, authError);
            results.push({
              email: admin.email,
              success: false,
              error: `Failed to create auth user: ${authError.message}`
            });
            continue;
          }

          userId = newUser.user!.id;
          console.log(`Created auth user for ${admin.email} with ID: ${userId}`);
        }

        // Update or insert profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            first_name: admin.firstName,
            last_name: admin.lastName
          });

        if (profileError) {
          console.error(`Error creating profile for ${admin.email}:`, profileError);
          results.push({
            email: admin.email,
            success: false,
            error: `Failed to create profile: ${profileError.message}`
          });
          continue;
        }

        // Assign admin role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'admin',
            is_primary: true
          });

        if (roleError) {
          console.error(`Error assigning admin role for ${admin.email}:`, roleError);
          results.push({
            email: admin.email,
            success: false,
            error: `Failed to assign admin role: ${roleError.message}`
          });
          continue;
        }

        // Delete existing availability for this admin (in case we're updating)
        await supabaseAdmin
          .from('admin_availability')
          .delete()
          .eq('admin_id', userId);

        // Add availability slots
        const availabilitySlots = admin.availability.days.map(day => ({
          admin_id: userId,
          day_of_week: day,
          start_time: admin.availability.startTime,
          end_time: admin.availability.endTime
        }));

        const { error: availabilityError } = await supabaseAdmin
          .from('admin_availability')
          .insert(availabilitySlots);

        if (availabilityError) {
          console.error(`Error adding availability for ${admin.email}:`, availabilityError);
          results.push({
            email: admin.email,
            success: false,
            error: `Failed to add availability: ${availabilityError.message}`
          });
          continue;
        }

        console.log(`Successfully created admin account for ${admin.email}`);
        results.push({
          email: admin.email,
          success: true,
          userId: userId,
          message: 'Admin account created successfully with availability schedule'
        });

      } catch (error) {
        console.error(`Unexpected error for ${admin.email}:`, error);
        results.push({
          email: admin.email,
          success: false,
          error: `Unexpected error: ${error.message}`
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Admin account creation completed',
      results: results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in create-admin-accounts function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);