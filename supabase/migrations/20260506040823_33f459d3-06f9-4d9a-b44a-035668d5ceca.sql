CREATE TABLE public.hub_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_path TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.hub_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view hub links" ON public.hub_links FOR SELECT USING (true);
CREATE POLICY "Public can create hub links" ON public.hub_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update hub links" ON public.hub_links FOR UPDATE USING (true);
CREATE POLICY "Public can delete hub links" ON public.hub_links FOR DELETE USING (true);
CREATE INDEX idx_hub_links_parent ON public.hub_links(parent_path);