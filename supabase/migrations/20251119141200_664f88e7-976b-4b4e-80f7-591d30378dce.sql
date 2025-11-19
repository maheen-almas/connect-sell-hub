-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'worker');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_roles.user_id = $1;
$$;

-- Create profiles table for additional user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create rooms table for admin-worker communication
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Create messages table for chat and file metadata
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'file')),
  content TEXT,
  file_name TEXT,
  file_path TEXT,
  file_mimetype TEXT,
  sales_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role during signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for rooms
CREATE POLICY "Users can view rooms they are part of"
  ON public.rooms FOR SELECT
  USING (auth.uid() = admin_id OR auth.uid() = worker_id);

CREATE POLICY "Admins can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (
    auth.uid() = admin_id AND 
    public.get_user_role(auth.uid()) = 'admin'
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their rooms"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = messages.room_id
      AND (rooms.admin_id = auth.uid() OR rooms.worker_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their rooms"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = messages.room_id
      AND (rooms.admin_id = auth.uid() OR rooms.worker_id = auth.uid())
    )
  );

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', false);

-- Storage RLS policies
CREATE POLICY "Users can upload files to rooms they are in"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view files in their rooms"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-files');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Insert role from metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, (new.raw_user_meta_data->>'role')::app_role);
  
  RETURN new;
END;
$$;

-- Trigger to create profile and role on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get aggregated sales data for admin
CREATE OR REPLACE FUNCTION public.get_worker_sales_stats()
RETURNS TABLE (
  worker_id UUID,
  worker_email TEXT,
  total_sales NUMERIC,
  file_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    COALESCE(SUM(m.sales_amount), 0) as total_sales,
    COUNT(m.id) FILTER (WHERE m.message_type = 'file') as file_count
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.messages m ON m.sender_id = p.id AND m.sales_amount IS NOT NULL
  WHERE ur.role = 'worker'
  GROUP BY p.id, p.email
  ORDER BY total_sales DESC;
END;
$$;