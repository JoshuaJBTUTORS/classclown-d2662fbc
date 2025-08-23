import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HubSpotIntegrationRequest {
  email: string;
  parentName: string;
  childName: string;
}

interface HubSpotContact {
  id: string;
}

interface HubSpotSearchResponse {
  results: HubSpotContact[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const hubspotApiKey = Deno.env.get('HUBSPOT_API_KEY');
  if (!hubspotApiKey) {
    console.error('HUBSPOT_API_KEY not found');
    return new Response(JSON.stringify({ error: 'HubSpot API key not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, parentName, childName }: HubSpotIntegrationRequest = await req.json();
    console.log(`Starting HubSpot integration for email: ${email}`);

    // Search for contact by email
    const searchResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }
            ]
          }
        ],
        properties: ['email', 'firstname', 'lastname'],
        limit: 1
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('HubSpot search failed:', searchResponse.status, errorText);
      throw new Error(`HubSpot search failed: ${searchResponse.status}`);
    }

    const searchData: HubSpotSearchResponse = await searchResponse.json();
    console.log('HubSpot search results:', searchData);

    if (searchData.results.length === 0) {
      console.log('No contact found in HubSpot for email:', email);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Contact not found in HubSpot' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contactId = searchData.results[0].id;
    console.log('Found HubSpot contact ID:', contactId);

    // Create note for the contact
    const noteBody = `Trial lesson booked Directly - Parent: ${parentName}, Child: ${childName}`;
    const createNoteResponse = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          hs_timestamp: new Date().toISOString(),
          hs_note_body: noteBody
        },
        associations: [
          {
            to: {
              id: contactId
            },
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED',
                associationTypeId: 202 // Note to Contact association
              }
            ]
          }
        ]
      }),
    });

    if (!createNoteResponse.ok) {
      const errorText = await createNoteResponse.text();
      console.error('HubSpot note creation failed:', createNoteResponse.status, errorText);
      throw new Error(`HubSpot note creation failed: ${createNoteResponse.status}`);
    }

    const noteData = await createNoteResponse.json();
    console.log('HubSpot note created successfully:', noteData.id);

    return new Response(JSON.stringify({ 
      success: true, 
      contactId,
      noteId: noteData.id,
      message: 'HubSpot integration completed successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in HubSpot integration:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);