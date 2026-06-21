-- Posts
CREATE TABLE public.experience_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  would_recommend BOOLEAN,
  savings_amount NUMERIC(10,2),
  location_text TEXT,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.experience_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visible posts viewable by authenticated"
  ON public.experience_posts FOR SELECT TO authenticated
  USING (visible = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create their own posts"
  ON public.experience_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own posts"
  ON public.experience_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own posts"
  ON public.experience_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all posts"
  ON public.experience_posts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_experience_posts_updated_at
  BEFORE UPDATE ON public.experience_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_experience_posts_user ON public.experience_posts(user_id);
CREATE INDEX idx_experience_posts_created ON public.experience_posts(created_at DESC);
CREATE INDEX idx_experience_posts_brand ON public.experience_posts(brand_id);
CREATE INDEX idx_experience_posts_category ON public.experience_posts(category_id);

-- Images
CREATE TABLE public.experience_post_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.experience_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  position SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.experience_post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Images viewable by authenticated"
  ON public.experience_post_images FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users add images to their own posts"
  ON public.experience_post_images FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.experience_posts p WHERE p.id = post_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users delete their own images"
  ON public.experience_post_images FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all images"
  ON public.experience_post_images FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_experience_post_images_post ON public.experience_post_images(post_id);

-- Likes
CREATE TABLE public.experience_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.experience_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.experience_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by authenticated"
  ON public.experience_post_likes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users like as themselves"
  ON public.experience_post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users unlike themselves"
  ON public.experience_post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_experience_post_likes_post ON public.experience_post_likes(post_id);

-- Comments
CREATE TABLE public.experience_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.experience_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.experience_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments viewable by authenticated"
  ON public.experience_post_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users create their own comments"
  ON public.experience_post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own comments"
  ON public.experience_post_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own comments"
  ON public.experience_post_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all comments"
  ON public.experience_post_comments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_experience_post_comments_updated_at
  BEFORE UPDATE ON public.experience_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_experience_post_comments_post ON public.experience_post_comments(post_id);

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('experience-images', 'experience-images', true);

CREATE POLICY "Experience images publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'experience-images');

CREATE POLICY "Users upload to their own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'experience-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update their own files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'experience-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete their own files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'experience-images' AND auth.uid()::text = (storage.foldername(name))[1]);