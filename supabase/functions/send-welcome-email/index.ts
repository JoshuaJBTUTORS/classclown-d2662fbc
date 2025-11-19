
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { userId, email, firstName, lastName, role, password = "classbeyond123!" }: WelcomeEmailRequest = await req.json();

    if (!userId || !email || !firstName || !lastName || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification record
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'welcome',
        email: email,
        subject: `Welcome to JB Tutors - Your ${role} account has been created`,
        status: 'pending'
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error creating notification record:', notificationError);
    }

    // Generate the HTML email content
    const loginUrl = `${Deno.env.get("SUPABASE_URL")?.replace('/supabase', '')}/auth` || "https://your-app.com/auth";
    
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        firstName,
        lastName,
        email,
        role,
        password,
        loginUrl,
      })
    );

    // Send the email with verified domain
    const { error: emailError } = await resend.emails.send({
      from: 'Class Beyond <enquiries@classbeyondacademy.io>',
      to: [email],
      subject: `Welcome to JB Tutors - Your ${role} account has been created`,
      html,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      
      // Update notification status to failed
      if (notification) {
        await supabase
          .from('notifications')
          .update({
            status: 'failed',
            error_message: emailError.message
          })
          .eq('id', notification.id);
      }

      return new Response(
        JSON.stringify({ error: "Failed to send welcome email", details: emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update notification status to sent
    if (notification) {
      await supabase
        .from('notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);
    }

    console.log(`Welcome email sent successfully to ${email} for ${role} role`);

    // Send WhatsApp welcome message if user has phone number
    // First, try to get phone number from parents or students table based on role
    let phoneNumber = null;
    
    if (role === 'parent') {
      const { data: parentData } = await supabase
        .from('parents')
        .select('phone, whatsapp_number')
        .eq('user_id', userId)
        .single();
      
      phoneNumber = parentData?.whatsapp_number || parentData?.phone;
    } else if (role === 'student') {
      const { data: studentData } = await supabase
        .from('students')
        .select('phone, whatsapp_number')
        .eq('email', email)
        .single();
      
      phoneNumber = studentData?.whatsapp_number || studentData?.phone;
    }

    if (phoneNumber) {
      const whatsappText = WhatsAppTemplates.welcomeMessage(firstName, lastName);
      const whatsappNumber = whatsappService.formatPhoneNumber(phoneNumber);
      
      const whatsappResponse = await whatsappService.sendMessage({
        phoneNumber: whatsappNumber,
        text: whatsappText
      });

      console.log(`WhatsApp welcome message to ${whatsappNumber}:`, whatsappResponse);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome email sent successfully",
        notification_id: notification?.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
