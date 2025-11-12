

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { 
        auth: {
          autoRefreshToken: false,
          persistSession: false
        } 
      }
    );
    
    // Verify user is authenticated and is an admin/owner
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is an admin or owner
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = userRoles?.some(r => r.role === 'admin' || r.role === 'owner');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // First check if the lesson_students table has an organization_id column
    const checkColumnSQL = `
    SELECT EXISTS (
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'lesson_students' AND column_name = 'organization_id'
    );
    `;
    
    const { data: columnCheck, error: columnCheckError } = await supabase.rpc('pg_query', { query_text: checkColumnSQL });
    
    if (columnCheckError) {
      throw new Error(`Error checking for column existence: ${columnCheckError.message}`);
    }
    
    // If the column doesn't exist, add it
    if (!columnCheck[0].exists) {
      console.log("Adding organization_id column to lesson_students");
      const addColumnSQL = `
      ALTER TABLE public.lesson_students
      ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
      `;
      
      const { error: addColumnError } = await supabase.rpc('pg_query', { query_text: addColumnSQL });
      
      if (addColumnError) {
        throw new Error(`Error adding column: ${addColumnError.message}`);
      }
    }
    
    // SQL for adding/updating organization constraints and migrating existing data
    const sql = `
    -- Enable Row Level Security for lessons table (if not already enabled)
    ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
    
    -- Create organization-based RLS policy for lessons
    DROP POLICY IF EXISTS "Users can only view lessons from their organization" ON public.lessons;
    CREATE POLICY "Users can only view lessons from their organization" 
    ON public.lessons
    FOR SELECT 
    USING (organization_id = public.get_current_user_organization() OR organization_id IS NULL);
    
    DROP POLICY IF EXISTS "Users can only insert lessons into their organization" ON public.lessons;
    CREATE POLICY "Users can only insert lessons into their organization" 
    ON public.lessons
    FOR INSERT 
    WITH CHECK (organization_id = public.get_current_user_organization());
    
    DROP POLICY IF EXISTS "Users can only update lessons from their organization" ON public.lessons;
    CREATE POLICY "Users can only update lessons from their organization" 
    ON public.lessons
    FOR UPDATE 
    USING (organization_id = public.get_current_user_organization() OR organization_id IS NULL);
    
    DROP POLICY IF EXISTS "Users can only delete lessons from their organization" ON public.lessons;
    CREATE POLICY "Users can only delete lessons from their organization" 
    ON public.lessons
    FOR DELETE 
    USING (organization_id = public.get_current_user_organization() OR organization_id IS NULL);
    
    -- Migrate existing lessons data to assign organization_id
    -- This will set organization_id based on the tutor's organization
    UPDATE public.lessons
    SET organization_id = tutors.organization_id
    FROM public.tutors
    WHERE lessons.tutor_id = tutors.id
    AND lessons.organization_id IS NULL;
    
    -- Update lesson_students data to match the lesson's organization
    UPDATE public.lesson_students
    SET organization_id = lessons.organization_id
    FROM public.lessons
    WHERE lesson_students.lesson_id = lessons.id
    AND lesson_students.organization_id IS NULL;
    
    -- Enable Row Level Security for lesson_students table
    ALTER TABLE public.lesson_students ENABLE ROW LEVEL SECURITY;
    
    -- Create organization-based RLS policy for lesson_students
    DROP POLICY IF EXISTS "Users can only view lesson_students from their organization" ON public.lesson_students;
    CREATE POLICY "Users can only view lesson_students from their organization" 
    ON public.lesson_students
    FOR SELECT 
    USING (organization_id = public.get_current_user_organization() OR organization_id IS NULL);
    
    DROP POLICY IF EXISTS "Users can only insert lesson_students into their organization" ON public.lesson_students;
    CREATE POLICY "Users can only insert lesson_students into their organization" 
    ON public.lesson_students
    FOR INSERT 
    WITH CHECK (organization_id = public.get_current_user_organization());
    
    DROP POLICY IF EXISTS "Users can only update lesson_students from their organization" ON public.lesson_students;
    CREATE POLICY "Users can only update lesson_students from their organization" 
    ON public.lesson_students
    FOR UPDATE 
    USING (organization_id = public.get_current_user_organization() OR organization_id IS NULL);
    
    DROP POLICY IF EXISTS "Users can only delete lesson_students from their organization" ON public.lesson_students;
    CREATE POLICY "Users can only delete lesson_students from their organization" 
    ON public.lesson_students
    FOR DELETE 
    USING (organization_id = public.get_current_user_organization() OR organization_id IS NULL);
    `;

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('pg_query', { query_text: sql });
    
    if (migrationError) {
      throw migrationError;
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Migration completed successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in run-migrations function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
