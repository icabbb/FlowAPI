-- Migration to update the accept_flow_invitation RPC function
-- Fixes "missing FROM-clause entry for table profile_record" error.

CREATE OR REPLACE FUNCTION accept_flow_invitation(
  invite_token_param UUID, -- This is flow_collaborations.id
  flow_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_clerk_user_id TEXT;
  profile_record RECORD;
  collaboration_record RECORD;
  flow_detail_record RECORD;
  fetched_profile_email TEXT; -- Variable to hold the fetched email
BEGIN
  SELECT auth.uid() INTO current_clerk_user_id;

  IF current_clerk_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated.');
  END IF;

  -- Get the profile for the current Clerk user to fetch their primary email
  SELECT email INTO fetched_profile_email FROM public.profiles WHERE id = current_clerk_user_id;
  IF fetched_profile_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile email not found. Ensure profile is synced.');
  END IF;

  -- Find the invitation using invite_token (fc.id) and flow_id.
  SELECT * INTO collaboration_record
  FROM public.flow_collaborations fc
  WHERE fc.id = invite_token_param
    AND fc.flow_id = flow_id_param
    AND (
      fc.collaborator_user_id IS NULL OR 
      fc.collaborator_user_id = ('pending_' || fetched_profile_email) OR 
      (fc.collaborator_user_id IS NULL AND fc.collaborator_email = fetched_profile_email)
    );

  IF collaboration_record.id IS NULL THEN
    -- Broader search if the specific conditions above didn't match
    SELECT * INTO collaboration_record
    FROM public.flow_collaborations fc
    WHERE fc.id = invite_token_param AND fc.flow_id = flow_id_param;

    IF collaboration_record.id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invitation not found, invalid token/flow ID, or already claimed.');
    END IF;

    IF collaboration_record.collaborator_user_id IS NOT NULL AND 
       collaboration_record.collaborator_user_id <> current_clerk_user_id AND 
       NOT (collaboration_record.collaborator_user_id LIKE 'pending_%') THEN
       RETURN jsonb_build_object('success', false, 'error', 'Invitation is associated with a different user.');
    END IF;
  END IF;

  -- Update the flow_collaborations table
  UPDATE public.flow_collaborations
  SET
    collaborator_user_id = current_clerk_user_id, 
    collaborator_email = fetched_profile_email,   -- Use the fetched email
    status = 'accepted',                         
    permission_level = COALESCE(collaboration_record.permission_level, 'view'), 
    updated_at = now()
  WHERE id = collaboration_record.id
  RETURNING * INTO collaboration_record;

  IF collaboration_record.id IS NULL OR collaboration_record.collaborator_user_id <> current_clerk_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update invitation record.');
  END IF;

  SELECT name INTO flow_detail_record FROM public.flows WHERE id = flow_id_param;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invitation accepted successfully.',
    'collaboration_id', collaboration_record.id,
    'flow_id', collaboration_record.flow_id,
    'flow_name', flow_detail_record.name,
    'permission_level', collaboration_record.permission_level,
    'status', collaboration_record.status
  );

EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error', 'Database error: ' || SQLERRM);
END;
$$;

COMMENT ON FUNCTION accept_flow_invitation(UUID, UUID) IS 
'Accepts a flow invitation, linking it to the current user and setting status to accepted. Uses collaborator_user_id and collaborator_email columns. Fixes FROM-clause error.'; 