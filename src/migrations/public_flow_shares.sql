-- Create the public_flow_shares table
CREATE TABLE IF NOT EXISTS public_flow_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TIMESTAMPTZ
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_public_flow_shares_flow_id ON public_flow_shares(flow_id);
CREATE INDEX IF NOT EXISTS idx_public_flow_shares_is_active ON public_flow_shares(is_active);

-- Add share_id column to flows table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'flows' 
    AND column_name = 'share_id'
  ) THEN
    ALTER TABLE public.flows ADD COLUMN share_id UUID REFERENCES public.public_flow_shares(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public_flow_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the public_flow_shares table
-- 1. Allow users to view their own shares
CREATE POLICY "Users can view their own shares"
  ON public_flow_shares
  FOR SELECT
  USING (
    flow_id IN (SELECT id FROM public.flows WHERE user_id = auth.jwt() ->> 'sub')
  );

-- 2. Allow users to insert shares for their own flows
CREATE POLICY "Users can create shares for their own flows"
  ON public_flow_shares
  FOR INSERT
  WITH CHECK (
    flow_id IN (SELECT id FROM public.flows WHERE user_id = auth.jwt() ->> 'sub')
  );

-- 3. Allow users to update their own shares
CREATE POLICY "Users can update their own shares"
  ON public_flow_shares
  FOR UPDATE
  USING (
    flow_id IN (SELECT id FROM public.flows WHERE user_id = auth.jwt() ->> 'sub')
  );

-- 4. Allow users to delete their own shares
CREATE POLICY "Users can delete their own shares"
  ON public_flow_shares
  FOR DELETE
  USING (
    flow_id IN (SELECT id FROM public.flows WHERE user_id = auth.jwt() ->> 'sub')
  );

-- 5. Allow public access to active shares for read operations
CREATE POLICY "Public can view active shares"
  ON public_flow_shares
  FOR SELECT
  USING (
    is_active = true
  );

-- Create a function to update last_accessed and access_count
CREATE OR REPLACE FUNCTION update_share_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_accessed IS NULL OR OLD.last_accessed IS NULL OR NEW.last_accessed <> OLD.last_accessed THEN
    NEW.access_count := OLD.access_count + 1;
    NEW.last_accessed := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update last_accessed and access_count
DROP TRIGGER IF EXISTS update_share_access_trigger ON public_flow_shares;
CREATE TRIGGER update_share_access_trigger
  BEFORE UPDATE ON public_flow_shares
  FOR EACH ROW
  WHEN (OLD.last_accessed IS NULL OR NEW.last_accessed <> OLD.last_accessed)
  EXECUTE FUNCTION update_share_access();

-- Create a function to automatically deactivate expired shares
CREATE OR REPLACE FUNCTION deactivate_expired_shares()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() THEN
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically deactivate expired shares
DROP TRIGGER IF EXISTS deactivate_expired_shares_trigger ON public_flow_shares;
CREATE TRIGGER deactivate_expired_shares_trigger
  BEFORE UPDATE ON public_flow_shares
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_expired_shares(); 