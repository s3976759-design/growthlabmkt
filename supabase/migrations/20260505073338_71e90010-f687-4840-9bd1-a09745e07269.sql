-- Shared workflow invites table
CREATE TABLE public.shared_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view','comment','edit')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_invites ENABLE ROW LEVEL SECURITY;

-- Single-user personal app: allow public access (no auth implemented yet)
CREATE POLICY "Public can view invites" ON public.shared_invites FOR SELECT USING (true);
CREATE POLICY "Public can create invites" ON public.shared_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update invites" ON public.shared_invites FOR UPDATE USING (true);
CREATE POLICY "Public can delete invites" ON public.shared_invites FOR DELETE USING (true);
