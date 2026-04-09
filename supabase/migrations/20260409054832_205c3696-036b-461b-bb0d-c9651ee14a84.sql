
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Users/profiles table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('consumer', 'provider', 'admin')),
  user_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Service types
CREATE TABLE IF NOT EXISTS public.service_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  base_price DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service types are viewable by everyone" ON public.service_types FOR SELECT USING (true);

-- Consumer details
CREATE TABLE IF NOT EXISTS public.consumer_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  profile_picture TEXT,
  preferred_language TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.consumer_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own consumer details" ON public.consumer_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own consumer details" ON public.consumer_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consumer details" ON public.consumer_details FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Provider details
CREATE TABLE IF NOT EXISTS public.provider_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT,
  service_type TEXT NOT NULL DEFAULT 'driver',
  experience_years INTEGER,
  skills TEXT,
  govt_id_url TEXT,
  license_url TEXT,
  profile_picture TEXT,
  languages TEXT,
  id_type TEXT NOT NULL DEFAULT 'default',
  id_number TEXT NOT NULL DEFAULT 'default',
  driving_license_number TEXT,
  vehicle_type TEXT,
  license_expiry_date TEXT,
  working_hours_from TEXT,
  working_hours_to TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending',
  is_online BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.provider_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own provider details" ON public.provider_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own provider details" ON public.provider_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own provider details" ON public.provider_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all providers" ON public.provider_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
);
CREATE POLICY "Admins can update all providers" ON public.provider_details FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consumer_id UUID REFERENCES public.users(id),
  provider_id UUID,
  service_type TEXT NOT NULL,
  booking_status TEXT NOT NULL DEFAULT 'finding_provider',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_intent_id TEXT,
  location_pickup TEXT,
  location_drop TEXT,
  price_estimate REAL,
  date_time TIMESTAMPTZ NOT NULL,
  service_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings as consumer" ON public.bookings FOR SELECT USING (auth.uid() = consumer_id);
CREATE POLICY "Providers can view assigned bookings" ON public.bookings FOR SELECT USING (auth.uid()::text = provider_id::text);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = consumer_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = consumer_id OR auth.uid()::text = provider_id::text);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  message TEXT NOT NULL,
  type TEXT,
  booking_id TEXT,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Service requests
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.users(id),
  service_type TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB,
  provider_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own requests" ON public.requests FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Providers can view pending requests" ON public.requests FOR SELECT USING (status = 'pending');
CREATE POLICY "Users can create requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update own requests" ON public.requests FOR UPDATE USING (auth.uid() = customer_id OR auth.uid()::text = provider_id::text);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id),
  user_id UUID REFERENCES public.users(id),
  amount REAL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert payments" ON public.payments FOR INSERT WITH CHECK (true);

-- Location tracking
CREATE TABLE IF NOT EXISTS public.location_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, booking_id)
);
ALTER TABLE public.location_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own location" ON public.location_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own location" ON public.location_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own location" ON public.location_tracking FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consumer_details_updated_at BEFORE UPDATE ON public.consumer_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_details_updated_at BEFORE UPDATE ON public.provider_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consumer_user_id ON public.consumer_details(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_user_id ON public.provider_details(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_status ON public.provider_details(status);
CREATE INDEX IF NOT EXISTS idx_bookings_consumer ON public.bookings(consumer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_location_user_booking ON public.location_tracking(user_id, booking_id);

-- Seed service types
INSERT INTO public.service_types (name, description, base_price, hourly_rate) VALUES
  ('driver', 'Professional driving service', 500.00, 200.00),
  ('chef', 'Personal chef service', 1000.00, 500.00),
  ('nanny', 'Childcare and nanny service', 800.00, 300.00),
  ('house_helper', 'House cleaning and maintenance', 600.00, 250.00),
  ('caretaker', 'Elder care and assistance', 900.00, 350.00),
  ('parcel_delivery', 'Parcel pickup and delivery', 200.00, 150.00)
ON CONFLICT (name) DO NOTHING;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'consumer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
