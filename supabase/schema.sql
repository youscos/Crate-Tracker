-- ================================================================
-- CrateTracker - Schéma Supabase complet
-- À exécuter dans l'éditeur SQL Supabase
-- ================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TYPES ENUM
-- ================================================================

CREATE TYPE user_role AS ENUM ('admin', 'logistics', 'viewer');
CREATE TYPE crate_status AS ENUM ('stored', 'in_use', 'maintenance', 'missing');
CREATE TYPE panel_type AS ENUM ('standard', 'reinforced', 'insulated', 'acoustic', 'fire_resistant', 'waterproof');

-- ================================================================
-- TABLE: PROFILES
-- ================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'viewer',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- TABLE: CRATES
-- ================================================================

CREATE TABLE IF NOT EXISTS public.crates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code         TEXT NOT NULL UNIQUE,
  crate_number    TEXT NOT NULL UNIQUE,
  description     TEXT,
  panel_type      panel_type NOT NULL DEFAULT 'standard',
  site_zone       TEXT NOT NULL DEFAULT 'Zone A',
  floor           SMALLINT NOT NULL DEFAULT 1 CHECK (floor BETWEEN 1 AND 44),
  location        TEXT NOT NULL,
  status          crate_status NOT NULL DEFAULT 'stored',
  last_user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_user_name  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crates_qr_code    ON public.crates(qr_code);
CREATE INDEX idx_crates_status     ON public.crates(status);
CREATE INDEX idx_crates_floor      ON public.crates(floor);
CREATE INDEX idx_crates_site_zone  ON public.crates(site_zone);
CREATE INDEX idx_crates_updated_at ON public.crates(updated_at DESC);

-- Full-text search
ALTER TABLE public.crates ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('french',
      coalesce(qr_code, '') || ' ' ||
      coalesce(crate_number, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(site_zone, '') || ' ' ||
      coalesce(location, '') || ' ' ||
      coalesce(last_user_name, '')
    )
  ) STORED;

CREATE INDEX idx_crates_search ON public.crates USING GIN(search_vector);

CREATE TRIGGER set_crates_updated_at
  BEFORE UPDATE ON public.crates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- TABLE: MOVEMENTS
-- ================================================================

CREATE TABLE IF NOT EXISTS public.movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crate_id      UUID NOT NULL REFERENCES public.crates(id) ON DELETE CASCADE,
  old_floor     SMALLINT CHECK (old_floor BETWEEN 1 AND 44),
  new_floor     SMALLINT NOT NULL CHECK (new_floor BETWEEN 1 AND 44),
  old_location  TEXT,
  new_location  TEXT NOT NULL,
  old_status    crate_status,
  new_status    crate_status NOT NULL,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET DEFAULT,
  user_name     TEXT NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movements_crate_id   ON public.movements(crate_id);
CREATE INDEX idx_movements_user_id    ON public.movements(user_id);
CREATE INDEX idx_movements_created_at ON public.movements(created_at DESC);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() = 'admin');

-- CRATES policies
CREATE POLICY "Authenticated users can read crates"
  ON public.crates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Logistics and admin can insert crates"
  ON public.crates FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'logistics'));

CREATE POLICY "Logistics and admin can update crates"
  ON public.crates FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'logistics'));

CREATE POLICY "Only admin can delete crates"
  ON public.crates FOR DELETE
  USING (public.get_user_role() = 'admin');

-- MOVEMENTS policies
CREATE POLICY "Authenticated users can read movements"
  ON public.movements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Logistics and admin can insert movements"
  ON public.movements FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'logistics'));

-- ================================================================
-- SAMPLE DATA (optionnel, pour tester)
-- ================================================================

-- Insérer un admin (remplacez l'UUID par l'ID de votre utilisateur après inscription)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@votreboite.com';

-- ================================================================
-- REALTIME
-- ================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.crates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.movements;
