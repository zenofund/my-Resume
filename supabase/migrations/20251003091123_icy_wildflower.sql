/*
  # Complete easyIA Database Schema Migration
  
  This migration transforms the existing resume analysis app into a comprehensive
  legal assistant SaaS platform with role-based access, subscription tiers,
  document management, chat sessions, and payment integration.
  
  ## Changes Made:
  1. Modified existing users table to add role-based access
  2. Created subscription plans and management system
  3. Added document management with RAG pipeline support
  4. Implemented chat sessions and messaging system
  5. Added legal citations and payment tracking
  6. Enabled comprehensive RLS policies
  7. Created utility functions for tier-based access
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Modify existing 'users' table
--------------------------------------------------------------------------------

-- Add 'role' column to the 'users' table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'free' NOT NULL;

-- Add additional columns for legal assistant features
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS practice_areas TEXT[] DEFAULT '{}';

-- Update existing users to have a 'free' role
UPDATE public.users
SET role = 'free'
WHERE role IS NULL OR role = '';

-- Drop the 'is_premium' column as 'role' will handle premium status
ALTER TABLE public.users
DROP COLUMN IF EXISTS is_premium;

-- Create a function to handle new user creation in public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, 'free', now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a trigger to call the function on new auth.users inserts
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for 'users' table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Policy: Users can view their own profile
CREATE POLICY "Users can read own data"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own data"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (for manual inserts)
CREATE POLICY "Users can insert own data"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Admins can manage all user data
CREATE POLICY "Admins can manage all user data"
ON public.users FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 2. Create New Database Tables
--------------------------------------------------------------------------------

-- Table: subscription_plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    tier_level INTEGER NOT NULL UNIQUE, -- 0: Free, 1: Pro, 2: Enterprise
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'inactive', 'cancelled', 'expired'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    paystack_reference TEXT UNIQUE,
    paystack_customer_code TEXT,
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: document_categories
CREATE TABLE IF NOT EXISTS public.document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, -- e.g., Lucide icon name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    original_filename TEXT,
    file_type TEXT NOT NULL, -- 'pdf', 'docx', 'txt'
    file_size BIGINT,
    storage_path TEXT, -- Path in Supabase Storage
    status TEXT NOT NULL DEFAULT 'uploaded', -- 'uploaded', 'processing', 'processed', 'failed'
    processing_error TEXT,
    total_chunks INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    category_id UUID REFERENCES public.document_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: document_chunks
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI ada-002 embedding dimension
    chunk_number INTEGER NOT NULL,
    chunk_size INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: chat_sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    description TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL, -- 'user', 'ai', 'system'
    content TEXT NOT NULL,
    is_citation BOOLEAN DEFAULT FALSE,
    citation_metadata JSONB DEFAULT '{}'::jsonb, -- Store details for clickable citations
    tokens_used INTEGER,
    model_used TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: citations
CREATE TABLE IF NOT EXISTS public.citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_chunk_id UUID REFERENCES public.document_chunks(id) ON DELETE SET NULL,
    case_name TEXT,
    citation_text TEXT NOT NULL, -- e.g., "SC. 123/2020", "LFN 2004 Cap. C23"
    court TEXT, -- e.g., "Supreme Court", "Court of Appeal"
    year INTEGER,
    url TEXT, -- Link to external legal database
    case_type TEXT, -- 'supreme_court', 'court_of_appeal', 'high_court', 'magistrate', 'statute', 'regulation'
    jurisdiction TEXT DEFAULT 'Nigeria',
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional details like facts, issues, holding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled', 'refunded'
    reference TEXT NOT NULL UNIQUE, -- Paystack transaction reference
    gateway TEXT NOT NULL DEFAULT 'paystack',
    gateway_response JSONB DEFAULT '{}'::jsonb,
    transaction_type TEXT NOT NULL DEFAULT 'one_time', -- 'subscription', 'one_time', 'refund'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create indexes for performance
--------------------------------------------------------------------------------

-- Indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON public.document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_citations_case_name ON public.citations(case_name);
CREATE INDEX IF NOT EXISTS idx_citations_year ON public.citations(year);

-- 4. Implement Row Level Security (RLS) Policies
--------------------------------------------------------------------------------

-- RLS for subscription_plans (publicly readable)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to subscription plans" ON public.subscription_plans;
CREATE POLICY "Allow public read access to subscription plans"
ON public.subscription_plans FOR SELECT
USING (TRUE);

-- RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
ON public.subscriptions FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS for document_categories (publicly readable, admin manage)
ALTER TABLE public.document_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to document categories" ON public.document_categories;
DROP POLICY IF EXISTS "Admins can manage document categories" ON public.document_categories;

CREATE POLICY "Allow public read access to document categories"
ON public.document_categories FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage document categories"
ON public.document_categories FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;

CREATE POLICY "Users can view their own documents"
ON public.documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all documents"
ON public.documents FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS for document_chunks
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view chunks of their own documents" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can insert chunks for their own documents" ON public.document_chunks;
DROP POLICY IF EXISTS "Admins can manage all document chunks" ON public.document_chunks;

CREATE POLICY "Users can view chunks of their own documents"
ON public.document_chunks FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.documents WHERE id = document_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert chunks for their own documents"
ON public.document_chunks FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.documents WHERE id = document_id AND user_id = auth.uid()));

CREATE POLICY "Admins can manage all document chunks"
ON public.document_chunks FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can insert their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Admins can manage all chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can view their own chat sessions"
ON public.chat_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
ON public.chat_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
ON public.chat_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
ON public.chat_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all chat sessions"
ON public.chat_sessions FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages in their own sessions" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their own sessions" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;

CREATE POLICY "Users can view messages in their own sessions"
ON public.messages FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.chat_sessions WHERE id = session_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert messages in their own sessions"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.chat_sessions WHERE id = session_id AND user_id = auth.uid()));

CREATE POLICY "Admins can manage all messages"
ON public.messages FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS for citations (publicly readable, admin manage)
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to citations" ON public.citations;
DROP POLICY IF EXISTS "Admins can manage citations" ON public.citations;

CREATE POLICY "Allow public read access to citations"
ON public.citations FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage citations"
ON public.citations FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- RLS for payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can insert their own payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can manage all payment transactions" ON public.payment_transactions;

CREATE POLICY "Users can view their own payment transactions"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment transactions"
ON public.payment_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payment transactions"
ON public.payment_transactions FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 5. Create Utility Functions
--------------------------------------------------------------------------------

-- Function to get user's current tier
CREATE OR REPLACE FUNCTION public.get_user_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_tier TEXT;
  active_subscription RECORD;
BEGIN
  -- First check if user has an active subscription
  SELECT sp.name INTO user_tier
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON s.plan_id = sp.id
  WHERE s.user_id = user_uuid 
    AND s.status = 'active'
    AND (s.end_date IS NULL OR s.end_date > now())
  ORDER BY sp.tier_level DESC
  LIMIT 1;

  -- If no active subscription, check user role
  IF user_tier IS NULL THEN
    SELECT role INTO user_tier FROM public.users WHERE id = user_uuid;
  END IF;

  -- Default to 'free' if nothing found
  RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to a specific feature based on tier
CREATE OR REPLACE FUNCTION public.user_has_feature_access(user_uuid UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier_level INTEGER;
  required_tier_level INTEGER;
BEGIN
  -- Get user's current tier level
  SELECT sp.tier_level INTO user_tier_level
  FROM public.users u
  LEFT JOIN public.subscriptions s ON u.id = s.user_id AND s.status = 'active' AND (s.end_date IS NULL OR s.end_date > now())
  LEFT JOIN public.subscription_plans sp ON s.plan_id = sp.id
  WHERE u.id = user_uuid
  ORDER BY sp.tier_level DESC NULLS LAST
  LIMIT 1;

  -- If no active subscription, check if user is admin
  IF user_tier_level IS NULL THEN
    SELECT CASE 
      WHEN role = 'admin' THEN 999
      WHEN role = 'enterprise' THEN 2
      WHEN role = 'pro' THEN 1
      ELSE 0
    END INTO user_tier_level
    FROM public.users WHERE id = user_uuid;
  END IF;

  -- Default to free tier if nothing found
  IF user_tier_level IS NULL THEN
    user_tier_level := 0;
  END IF;

  -- Determine required tier level for the feature
  CASE feature_name
    WHEN 'internet_search' THEN required_tier_level := 1; -- Pro tier
    WHEN 'citation_generator' THEN required_tier_level := 1; -- Pro tier
    WHEN 'case_summarizer' THEN required_tier_level := 1; -- Pro tier
    WHEN 'case_brief_generator' THEN required_tier_level := 1; -- Pro tier
    WHEN 'compare_cases' THEN required_tier_level := 1; -- Pro tier
    WHEN 'statute_navigator' THEN required_tier_level := 1; -- Pro tier
    WHEN 'export_collaboration' THEN required_tier_level := 1; -- Pro tier
    WHEN 'precedent_finder' THEN required_tier_level := 2; -- Enterprise tier
    WHEN 'statute_evolution' THEN required_tier_level := 2; -- Enterprise tier
    WHEN 'team_collaboration' THEN required_tier_level := 2; -- Enterprise tier
    WHEN 'ai_drafting' THEN required_tier_level := 2; -- Enterprise tier
    WHEN 'offline_mode' THEN required_tier_level := 2; -- Enterprise tier
    WHEN 'voice_to_law' THEN required_tier_level := 2; -- Enterprise tier
    WHEN 'firm_analytics' THEN required_tier_level := 2; -- Enterprise tier
    WHEN 'white_label' THEN required_tier_level := 2; -- Enterprise tier
    ELSE required_tier_level := 0; -- Free tier for basic features
  END CASE;

  RETURN user_tier_level >= required_tier_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to setup admin user
CREATE OR REPLACE FUNCTION public.setup_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find user by email
  SELECT au.id INTO user_id 
  FROM auth.users au 
  WHERE au.email = user_email;
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update user role to admin
  UPDATE public.users 
  SET role = 'admin', updated_at = now()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired subscriptions
CREATE OR REPLACE FUNCTION public.cleanup_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.subscriptions 
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' 
    AND end_date IS NOT NULL 
    AND end_date < now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create triggers for automatic updates
--------------------------------------------------------------------------------

-- Trigger to update chat session message count and last_message_at
CREATE OR REPLACE FUNCTION public.update_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chat_sessions 
    SET message_count = message_count + 1,
        last_message_at = NEW.created_at,
        updated_at = now()
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.chat_sessions 
    SET message_count = GREATEST(0, message_count - 1),
        updated_at = now()
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_chat_session_stats ON public.messages;
CREATE TRIGGER trigger_update_chat_session_stats
  AFTER INSERT OR DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_chat_session_stats();

-- Trigger to update document chunk count
CREATE OR REPLACE FUNCTION public.update_document_chunk_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.documents 
    SET total_chunks = total_chunks + 1,
        updated_at = now()
    WHERE id = NEW.document_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.documents 
    SET total_chunks = GREATEST(0, total_chunks - 1),
        updated_at = now()
    WHERE id = OLD.document_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_document_chunk_count ON public.document_chunks;
CREATE TRIGGER trigger_update_document_chunk_count
  AFTER INSERT OR DELETE ON public.document_chunks
  FOR EACH ROW EXECUTE FUNCTION public.update_document_chunk_count();

-- 7. Insert seed data
--------------------------------------------------------------------------------

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, price, currency, description, features, tier_level, is_active) VALUES
('Free', 0.00, 'NGN', 'Basic legal research with limited features', 
 '["Basic chat functionality", "Upload up to 5 documents", "50 AI queries per month", "Basic support"]'::jsonb, 
 0, TRUE),
('Pro', 29999.00, 'NGN', 'Advanced legal research with premium features', 
 '["Unlimited document uploads", "Unlimited AI queries", "Internet search integration", "Citation generator", "Case summarizer", "Case brief generator", "Compare cases", "Statute navigator", "Export & collaboration", "Priority support"]'::jsonb, 
 1, TRUE),
('Enterprise', 99999.00, 'NGN', 'Complete legal research suite for teams', 
 '["All Pro features", "Precedent finder & timeline", "Statute evolution tracker", "Team collaboration", "AI drafting assistant", "Offline mode (PWA)", "Voice-to-law", "Firm analytics dashboard", "White-label option", "Dedicated support"]'::jsonb, 
 2, TRUE)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = now();

-- Insert document categories
INSERT INTO public.document_categories (name, description, icon) VALUES
('Constitutional Law', 'Constitutional matters and fundamental rights', 'Scale'),
('Criminal Law', 'Criminal cases and procedures', 'Shield'),
('Civil Law', 'Civil litigation and procedures', 'FileText'),
('Commercial Law', 'Business and commercial matters', 'Briefcase'),
('Family Law', 'Marriage, divorce, and family matters', 'Users'),
('Property Law', 'Real estate and property matters', 'Home'),
('Labor Law', 'Employment and labor relations', 'UserCheck'),
('Tax Law', 'Taxation and revenue matters', 'Calculator'),
('Administrative Law', 'Government and administrative matters', 'Building'),
('International Law', 'International treaties and agreements', 'Globe'),
('Statutes', 'Acts of Parliament and regulations', 'Book'),
('Case Law', 'Judicial decisions and precedents', 'Gavel')
ON CONFLICT (name) DO NOTHING;

-- Insert sample Nigerian legal citations
INSERT INTO public.citations (case_name, citation_text, court, year, case_type, jurisdiction, metadata) VALUES
('Marwa v. Nyako', '(2012) LPELR-9221(SC)', 'Supreme Court', 2012, 'supreme_court', 'Nigeria', 
 '{"facts": "Electoral dispute", "issues": ["Electoral law", "Jurisdiction"], "holding": "Supreme Court has final jurisdiction in electoral matters"}'::jsonb),
('Attorney General of Lagos State v. Attorney General of the Federation', '(2004) LPELR-533(SC)', 'Supreme Court', 2004, 'supreme_court', 'Nigeria',
 '{"facts": "Resource control dispute", "issues": ["Federalism", "Resource allocation"], "holding": "States have rights to natural resources within their territory"}'::jsonb),
('Constitution of the Federal Republic of Nigeria', 'LFN 2004 Cap. C23', 'National Assembly', 1999, 'statute', 'Nigeria',
 '{"type": "Constitution", "sections": ["Fundamental rights", "Federal structure", "Separation of powers"]}'::jsonb),
('Criminal Code Act', 'LFN 2004 Cap. C38', 'National Assembly', 1990, 'statute', 'Nigeria',
 '{"type": "Criminal Law", "sections": ["Offences against persons", "Offences against property", "General principles"]}'::jsonb)
ON CONFLICT (citation_text) DO NOTHING;

-- Create a default free subscription for existing users
INSERT INTO public.subscriptions (user_id, plan_id, status, start_date, auto_renew)
SELECT 
  u.id,
  sp.id,
  'active',
  now(),
  FALSE
FROM public.users u
CROSS JOIN public.subscription_plans sp
WHERE sp.name = 'Free'
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s 
    WHERE s.user_id = u.id
  );

-- Final message
DO $$
BEGIN
  RAISE NOTICE 'easyIA database schema migration completed successfully!';
  RAISE NOTICE 'Created tables: subscription_plans, subscriptions, document_categories, documents, document_chunks, chat_sessions, messages, citations, payment_transactions';
  RAISE NOTICE 'Enabled RLS policies for all tables';
  RAISE NOTICE 'Created utility functions: get_user_tier, user_has_feature_access, setup_admin_user, cleanup_expired_subscriptions';
  RAISE NOTICE 'Inserted seed data for subscription plans, document categories, and sample citations';
END $$;