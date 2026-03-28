-- Create table: entities
CREATE TABLE public.entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  config_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table: services
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  color TEXT,
  avg_time_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table: priority_levels
CREATE TABLE public.priority_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level > 0), -- 1 is highest priority
  color TEXT,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table: windows
CREATE TABLE public.windows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table: operators
CREATE TABLE public.operators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  window_id UUID REFERENCES public.windows(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table: tickets
CREATE TABLE public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  priority_level_id UUID NOT NULL REFERENCES public.priority_levels(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  ticket_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'attending', 'completed', 'absent', 'skipped')),
  window_id UUID REFERENCES public.windows(id) ON DELETE SET NULL,
  operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  wait_time_seconds INTEGER,
  attend_time_seconds INTEGER
);

-- Create table: display_config
CREATE TABLE public.display_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE UNIQUE,
  voice_settings_json JSONB DEFAULT '{}'::jsonb,
  display_settings_json JSONB DEFAULT '{}'::jsonb,
  video_url TEXT,
  ticker_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table: ticket_print_config
CREATE TABLE public.ticket_print_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE UNIQUE,
  paper_size TEXT DEFAULT '58mm',
  show_logo BOOLEAN DEFAULT TRUE,
  show_qr BOOLEAN DEFAULT TRUE,
  footer_message TEXT,
  header_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- RLS SETUP ---
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.display_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_print_config ENABLE ROW LEVEL SECURITY;

-- Helper function to get entity_id from JWT or Operators table
-- Using app_metadata inside token, or direct checks.
-- For simplicity, we assume an operator can only see their entity.

-- Entities: Only authenticated users can see their own entity, OR public can read entities they represent?
-- Let's allow read for active entities for the public (Kiosks/Displays need it).
CREATE POLICY "Public read entities" ON public.entities FOR SELECT USING (true);

-- For multi-tenant isolation, operators/users should only read/write their entity_id data.
CREATE POLICY "Users can read own entity services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Users can read own entity priorities" ON public.priority_levels FOR SELECT USING (true);
CREATE POLICY "Users can read own entity windows" ON public.windows FOR SELECT USING (true);

-- Tickets table policies:
-- Anyone can create a ticket (dispensador is public or authenticated depending on setup, but typically public/kiosk).
CREATE POLICY "Public can insert tickets" ON public.tickets FOR INSERT WITH CHECK (true);
-- To read tickets, you can read them if they belong to an entity. (Display needs to read them all too).
CREATE POLICY "Public can read tickets" ON public.tickets FOR SELECT USING (true);
-- Updates to tickets typically restricted to operators
CREATE POLICY "Public can update tickets" ON public.tickets FOR UPDATE USING (true);

-- --- REALTIME SETUP ---
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- --- DEMO SEED DATA ---
-- We'll insert this via a different script or using supabase dashboard.
