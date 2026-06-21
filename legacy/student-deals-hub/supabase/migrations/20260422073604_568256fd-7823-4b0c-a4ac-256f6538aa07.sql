-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'student');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- =========================================
-- UTILITY: updated_at trigger function
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- USER ROLES (separate table, never on profile!)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- UNIVERSITIES
-- =========================================
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_code TEXT NOT NULL UNIQUE,
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Universities are viewable by everyone"
  ON public.universities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage universities"
  ON public.universities FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- STUDENT PROFILES
-- =========================================
CREATE TABLE public.student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  student_email TEXT,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own student profile"
  ON public.student_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all student profiles"
  ON public.student_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own student profile"
  ON public.student_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student profile"
  ON public.student_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any student profile"
  ON public.student_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- VERIFICATION REQUESTS
-- =========================================
CREATE TABLE public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own verification requests"
  ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- CATEGORIES
-- =========================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories viewable by everyone"
  ON public.categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- BRANDS
-- =========================================
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands viewable by everyone"
  ON public.brands FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage brands"
  ON public.brands FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- OFFERS
-- =========================================
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  discount_label TEXT,
  discount_percent INT,
  discount_code TEXT,
  redirect_url TEXT,
  image_url TEXT,
  terms TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_offers_brand ON public.offers(brand_id);
CREATE INDEX idx_offers_category ON public.offers(category_id);
CREATE INDEX idx_offers_active ON public.offers(active);

CREATE POLICY "Active offers viewable by authenticated users"
  ON public.offers FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage offers"
  ON public.offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- SAVED OFFERS
-- =========================================
CREATE TABLE public.saved_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_id)
);
ALTER TABLE public.saved_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own saved offers"
  ON public.saved_offers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users save their own offers"
  ON public.saved_offers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users unsave their own offers"
  ON public.saved_offers FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- =========================================
-- CLAIMED OFFERS
-- =========================================
CREATE TABLE public.claimed_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  code_revealed TEXT,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, offer_id)
);
ALTER TABLE public.claimed_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own claimed offers"
  ON public.claimed_offers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all claimed offers"
  ON public.claimed_offers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users claim offers"
  ON public.claimed_offers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =========================================
-- SIGNUP TRIGGER: profile + role + first admin
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;

  IF NEW.email = 't8230093@aueb.gr' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- VERIFICATION HELPER
-- =========================================
CREATE OR REPLACE FUNCTION public.submit_student_verification(
  _university_id UUID,
  _student_email TEXT
)
RETURNS verification_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _domain TEXT;
  _allowed TEXT[];
  _status verification_status := 'pending';
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _domain := lower(split_part(_student_email, '@', 2));
  SELECT allowed_domains INTO _allowed FROM public.universities WHERE id = _university_id;

  IF _allowed IS NOT NULL AND _domain = ANY (SELECT lower(unnest(_allowed))) THEN
    _status := 'approved';
  END IF;

  INSERT INTO public.verification_requests (user_id, university_id, student_email, status, reviewed_at)
  VALUES (_uid, _university_id, _student_email, _status,
          CASE WHEN _status = 'approved' THEN now() ELSE NULL END);

  INSERT INTO public.student_profiles (user_id, university_id, student_email, verification_status, verified_at)
  VALUES (_uid, _university_id, _student_email, _status,
          CASE WHEN _status = 'approved' THEN now() ELSE NULL END)
  ON CONFLICT (user_id) DO UPDATE
    SET university_id = EXCLUDED.university_id,
        student_email = EXCLUDED.student_email,
        verification_status = EXCLUDED.verification_status,
        verified_at = EXCLUDED.verified_at,
        updated_at = now();

  RETURN _status;
END;
$$;

-- =========================================
-- SEED: Universities
-- =========================================
INSERT INTO public.universities (name, short_code, allowed_domains) VALUES
  ('Harokopio University', 'hua', ARRAY['hua.gr']),
  ('University of Ioannina', 'uoi', ARRAY['uoi.gr']),
  ('University of West Attica', 'uniwa', ARRAY['uniwa.gr']),
  ('University of Piraeus', 'unipi', ARRAY['unipi.gr']),
  ('University of Crete', 'uoc', ARRAY['uoc.gr']),
  ('Technical University of Crete', 'tuc', ARRAY['tuc.gr']),
  ('University of Western Macedonia', 'uowm', ARRAY['uowm.gr']),
  ('Hellenic Mediterranean University', 'hmu', ARRAY['hmu.gr']),
  ('Ionian University', 'ionio', ARRAY['ionio.gr']),
  ('ASPETE', 'aspete', ARRAY['aspete.gr']),
  ('Aristotle University of Thessaloniki', 'auth', ARRAY['auth.gr']),
  ('Democritus University of Thrace', 'duth', ARRAY['duth.gr']),
  ('University of Macedonia', 'uom', ARRAY['uom.gr', 'uom.edu.gr']),
  ('Athens University of Economics and Business', 'aueb', ARRAY['aueb.gr']),
  ('University of Thessaly', 'uth', ARRAY['uth.gr']),
  ('University of the Aegean', 'aegean', ARRAY['aegean.gr']),
  ('University of Patras', 'upatras', ARRAY['upatras.gr', 'upnet.gr']),
  ('National Technical University of Athens', 'ntua', ARRAY['ntua.gr', 'mail.ntua.gr']),
  ('International Hellenic University', 'ihu', ARRAY['ihu.gr', 'ihu.edu.gr']),
  ('Agricultural University of Athens', 'aua', ARRAY['aua.gr']),
  ('University of Peloponnese', 'uop', ARRAY['uop.gr', 'go.uop.gr']),
  ('Athens School of Fine Arts', 'asfa', ARRAY['asfa.gr']),
  ('National and Kapodistrian University of Athens', 'uoa', ARRAY['uoa.gr', 'di.uoa.gr']),
  ('Panteion University', 'panteion', ARRAY['panteion.gr']);

-- =========================================
-- SEED: Categories
-- =========================================
INSERT INTO public.categories (name, slug, icon) VALUES
  ('Coffee', 'coffee', '☕'),
  ('Food', 'food', '🍔'),
  ('Fashion', 'fashion', '👗'),
  ('Technology', 'technology', '💻'),
  ('Travel', 'travel', '✈️');

-- =========================================
-- SEED: Brands
-- =========================================
INSERT INTO public.brands (name, slug, description) VALUES
  ('Apple', 'apple', 'Education pricing on Mac and iPad for students.'),
  ('Starbucks', 'starbucks', 'Handcrafted beverages for late-night study sessions.'),
  ('H&M', 'hm', 'Sustainable fashion essentials.'),
  ('Sony', 'sony', 'Industry-leading audio and electronics.'),
  ('Uber Eats', 'uber-eats', 'Food delivery for students.');

-- =========================================
-- SEED: Offers (mirrors current mock data)
-- =========================================
INSERT INTO public.offers (brand_id, category_id, title, description, discount_label, discount_percent, terms, featured, expires_at)
SELECT b.id, c.id, o.title, o.description, o.discount_label, o.discount_percent, o.terms, o.featured, o.expires_at
FROM (VALUES
  ('Apple',     'Technology', 'Education Pricing + Gift Card', 'Save on Mac or iPad for university. Get AirPods on us when you buy an eligible Mac or iPad.', 'Education Pricing + Gift Card', 10, 'Valid for currently enrolled students with a valid Greek university (.gr) email. One purchase per student per academic year.', true,  '2026-09-30'::timestamptz),
  ('Starbucks', 'Coffee',     '20% Off Storewide',             'Fuel your late-night study sessions with your favorite handcrafted beverage.', '20% Off Storewide', 20, 'Valid at participating locations. Must present valid student ID. Cannot be combined with other offers.', false, '2026-06-30'::timestamptz),
  ('H&M',       'Fashion',    'Buy One Get One Free',          'Upgrade your wardrobe with sustainable essentials. BOGO on all basics.', 'Buy One Get One Free', 50, 'Applies to items marked ''Basics''. Online and in-store with student verification.', false, '2026-05-31'::timestamptz),
  ('Sony',      'Technology', '15% Student Discount',          'Industry-leading noise cancellation for focused library time.', '15% Student Discount', 15, 'Valid on selected Sony audio products. Must verify student status through UNiDAYS.', false, '2026-08-31'::timestamptz),
  ('Uber Eats', 'Food',       '€0 Delivery Fee',               'Stay in and study. Unlimited €0 delivery fee on orders over €15.', '€0 Delivery Fee', 100, 'Valid for verified students. Minimum order €15. Subject to availability in your area.', false, '2026-07-31'::timestamptz)
) AS o(brand_name, category_name, title, description, discount_label, discount_percent, terms, featured, expires_at)
JOIN public.brands b ON b.name = o.brand_name
JOIN public.categories c ON c.name = o.category_name;