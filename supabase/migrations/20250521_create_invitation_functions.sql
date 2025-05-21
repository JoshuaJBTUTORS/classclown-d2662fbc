
-- Create RPC function to fetch invitation details by token
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token_param TEXT)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  WITH invite_data AS (
    SELECT 
      i.*,
      os.organization_name,
      CASE
        WHEN i.role = 'tutor' THEN (
          SELECT json_build_object('first_name', t.first_name, 'last_name', t.last_name)
          FROM tutors t
          WHERE t.id::text = i.entity_id
        )
        WHEN i.role = 'student' THEN (
          SELECT json_build_object('first_name', s.first_name, 'last_name', s.last_name)
          FROM students s
          WHERE s.id::text = i.entity_id
        )
        ELSE NULL
      END AS entity_data
    FROM
      public.invitations i
    LEFT JOIN
      public.organization_settings os ON true
    WHERE
      i.token = token_param
      AND (i.expires_at > NOW() OR i.accepted_at IS NOT NULL)
  )
  SELECT 
    json_build_object(
      'id', id,
      'email', email,
      'role', role,
      'entity_id', entity_id,
      'expires_at', expires_at,
      'created_at', created_at,
      'accepted_at', accepted_at,
      'organization_name', organization_name,
      'first_name', COALESCE((entity_data->>'first_name')::text, ''),
      'last_name', COALESCE((entity_data->>'last_name')::text, '')
    ) INTO result
  FROM invite_data;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to mark invitation as accepted
CREATE OR REPLACE FUNCTION public.accept_invitation(token_param TEXT)
RETURNS boolean AS $$
DECLARE
  updated_rows int;
BEGIN
  UPDATE public.invitations
  SET accepted_at = NOW()
  WHERE token = token_param
  AND accepted_at IS NULL
  AND expires_at > NOW();

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
