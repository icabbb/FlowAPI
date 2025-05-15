-- Migration: Add/Update get_user_collaborations_with_details RPC function
-- Description: Fetches all flows where the current user is a collaborator (accepted)
-- or has a pending invitation. Also fetches details about the flow and its owner.

CREATE OR REPLACE FUNCTION get_user_collaborations_with_details()
RETURNS TABLE (
  collaboration_id UUID,         -- ID from flow_collaborators
  flow_id UUID,
  flow_name TEXT,
  flow_description TEXT,
  flow_owner_user_id TEXT,       -- User ID of the flow's original owner
  flow_owner_display_name TEXT,
  flow_owner_avatar_url TEXT,
  invitee_email TEXT,            -- Email of the invited person (could be current user)
  collaborator_user_id TEXT,     -- User ID of the collaborator (could be current user, if accepted)
  collaborator_display_name TEXT,-- Display name of the collaborator (if applicable)
  collaborator_avatar_url TEXT,  -- Avatar URL of the collaborator (if applicable)
  permission_level TEXT,
  status TEXT,                   -- 'pending', 'accepted'
  invited_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  flow_updated_at TIMESTAMPTZ    -- When the flow itself was last updated
)
LANGUAGE plpgsql
SECURITY DEFINER -- Important for accessing profiles and flows
SET search_path = public
AS $$
DECLARE
  current_user_profile_id TEXT;
  current_user_email TEXT;
BEGIN
  current_user_profile_id := get_current_profile_id(); -- Assumes this helper function exists

  -- Get the current user's email from their profile
  SELECT email INTO current_user_email FROM profiles WHERE id = current_user_profile_id;

  IF current_user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    fc.id AS collaboration_id,
    f.id AS flow_id,
    f.name AS flow_name,
    f.description AS flow_description,
    f.user_id AS flow_owner_user_id,
    flow_owner_profile.display_name AS flow_owner_display_name,
    flow_owner_profile.avatar_url AS flow_owner_avatar_url,
    fc.email AS invitee_email,
    CASE
      WHEN fc.user_id LIKE 'pending_%' THEN NULL -- If pending, collaborator_user_id is not a real profile ID yet
      ELSE fc.user_id
    END AS collaborator_user_id,
    collaborator_profile.display_name AS collaborator_display_name,
    collaborator_profile.avatar_url AS collaborator_avatar_url,
    fc.permission_level,
    CASE
      WHEN fc.user_id LIKE 'pending_%' AND fc.email = current_user_email THEN 'pending' -- Invitation sent to current user
      WHEN fc.user_id = current_user_profile_id THEN 'accepted' -- Current user is an accepted collaborator
      ELSE 'related' -- Current user is the owner viewing their own flow's collaborators, or other cases
    END AS status,
    fc.invited_at,
    fc.last_active,
    f.updated_at AS flow_updated_at
  FROM
    public.flow_collaborators fc
  JOIN
    public.flows f ON fc.flow_id = f.id
  LEFT JOIN
    public.profiles flow_owner_profile ON f.user_id = flow_owner_profile.id
  LEFT JOIN
    public.profiles collaborator_profile ON fc.user_id = collaborator_profile.id AND fc.user_id NOT LIKE 'pending_%' -- Join only if not a pending placeholder
  WHERE
    fc.email = current_user_email OR fc.user_id = current_user_profile_id OR f.user_id = current_user_profile_id;
    -- Includes:
    -- 1. Invitations sent to the current user's email.
    -- 2. Collaborations accepted by the current user.
    -- 3. Flows owned by the current user (to see who they've invited/who has accepted).

  -- Note: The 'status' field might need refinement based on exact requirements
  -- for "Pending" vs "Accepted" tabs.
  -- If 'pending' means "invitations I received that are pending", then the filter for status becomes more specific.
  -- If 'accepted' means "invitations I accepted", that's also specific.
  -- The current WHERE clause is broad to fetch all related records.
  -- The UI will then filter by the 'status' column.
END;
$$;

COMMENT ON FUNCTION get_user_collaborations_with_details() IS
'Fetches flows shared with the current user (pending or accepted) and flows they own,
including details about the flow, its owner, and collaborator/invitee status.';

-- Example of how to call (for testing in Supabase SQL editor):
-- SELECT * FROM get_user_collaborations_with_details(); 