/*
  # Seed Initial Data for easyIA Legal Assistant

  1. Subscription Plans
    - Free tier with basic features
    - Pro tier with advanced features
    - Enterprise tier with all features

  2. Sample Legal Citations
    - Nigerian Supreme Court cases
    - Court of Appeal cases
    - Common statutes and regulations

  3. Admin User Setup
    - Create initial admin user (will be updated with actual admin email)
*/

-- Insert subscription plans
INSERT INTO subscription_plans (name, price, currency, description, features, tier_level, is_active) VALUES
(
  'Free',
  0.00,
  'NGN',
  'Basic legal research with limited features',
  '[
    "Basic chat interface",
    "Upload up to 5 documents",
    "50 AI queries per month",
    "Basic legal citations",
    "Community support"
  ]'::jsonb,
  0,
  true
),
(
  'Pro',
  29999.00,
  'NGN',
  'Advanced legal research with premium features',
  '[
    "Unlimited document uploads",
    "Unlimited AI queries",
    "Real internet search integration",
    "Legal citation generator",
    "Case summarizer and headnote generator",
    "Search by principle/ratio decidendi",
    "Case brief generator",
    "Compare cases side-by-side",
    "Statute navigator",
    "Export to PDF/DOCX",
    "Priority support"
  ]'::jsonb,
  1,
  true
),
(
  'Enterprise',
  99999.00,
  'NGN',
  'Complete legal research suite for teams and firms',
  '[
    "All Pro features",
    "Precedent finder and timeline",
    "Statute evolution tracker",
    "Team collaboration with role-based permissions",
    "Shared research folders",
    "AI drafting assistant",
    "Offline mode (PWA)",
    "Voice-to-law (English + Pidgin)",
    "Firm analytics dashboard",
    "Usage reports and research trends",
    "White-label option",
    "Custom hosting",
    "Dedicated support",
    "API access"
  ]'::jsonb,
  2,
  true
);

-- Insert sample Nigerian legal citations
INSERT INTO citations (case_name, citation_text, court, year, case_type, jurisdiction, metadata) VALUES
(
  'Marwa v. Nyako',
  '(2012) LPELR-9221(SC)',
  'Supreme Court of Nigeria',
  2012,
  'supreme_court',
  'Nigeria',
  '{
    "summary": "Constitutional law case on executive powers",
    "key_principles": ["Executive immunity", "Constitutional interpretation"],
    "judges": ["Katsina-Alu CJN", "Oguntade JSC", "Fabiyi JSC"]
  }'::jsonb
),
(
  'Attorney General of Lagos State v. Attorney General of the Federation',
  '(2004) LPELR-1084(SC)',
  'Supreme Court of Nigeria',
  2004,
  'supreme_court',
  'Nigeria',
  '{
    "summary": "Resource control and derivation principle case",
    "key_principles": ["Federalism", "Resource control", "Constitutional law"],
    "judges": ["Uwaifo JSC", "Aderemi JSC", "Oguntade JSC"]
  }'::jsonb
),
(
  'Okogie v. Attorney General of Lagos State',
  '(1981) 2 NCLR 337',
  'Supreme Court of Nigeria',
  1981,
  'supreme_court',
  'Nigeria',
  '{
    "summary": "Religious freedom and state education policy",
    "key_principles": ["Religious freedom", "Education policy", "Constitutional rights"],
    "judges": ["Fatai-Williams CJN", "Aniagolu JSC", "Obaseki JSC"]
  }'::jsonb
),
(
  'Nigerian Constitution',
  'Constitution of the Federal Republic of Nigeria 1999',
  'National Assembly',
  1999,
  'statute',
  'Nigeria',
  '{
    "type": "Constitution",
    "chapters": 8,
    "sections": 320,
    "key_areas": ["Fundamental rights", "Federal structure", "Executive powers", "Legislative powers", "Judicial powers"]
  }'::jsonb
),
(
  'Companies and Allied Matters Act',
  'CAMA 2020',
  'National Assembly',
  2020,
  'statute',
  'Nigeria',
  '{
    "type": "Corporate Law",
    "parts": 8,
    "sections": 870,
    "key_areas": ["Company incorporation", "Corporate governance", "Insolvency", "Business names"]
  }'::jsonb
),
(
  'Evidence Act',
  'Evidence Act 2011',
  'National Assembly',
  2011,
  'statute',
  'Nigeria',
  '{
    "type": "Procedural Law",
    "parts": 3,
    "sections": 258,
    "key_areas": ["Admissibility of evidence", "Burden of proof", "Documentary evidence", "Oral evidence"]
  }'::jsonb
);

-- Create a function to setup admin user (to be called after user registration)
CREATE OR REPLACE FUNCTION setup_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Update user role to admin based on email
  UPDATE users 
  SET 
    role = 'admin',
    name = 'System Administrator',
    updated_at = now()
  WHERE email = admin_email;
  
  -- If user doesn't exist, this will do nothing
  -- Admin should register first, then run this function
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create a function to assign free subscription to new users
CREATE OR REPLACE FUNCTION assign_free_subscription()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Get the free plan ID
  SELECT id INTO free_plan_id 
  FROM subscription_plans 
  WHERE name = 'Free' AND is_active = true 
  LIMIT 1;
  
  -- Create a free subscription for the new user
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO subscriptions (user_id, plan_id, status, start_date)
    VALUES (NEW.id, free_plan_id, 'active', now());
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger to automatically assign free subscription to new users
CREATE TRIGGER assign_free_subscription_trigger
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION assign_free_subscription();

-- Create a function to clean up expired subscriptions
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS VOID AS $$
BEGIN
  -- Update expired subscriptions
  UPDATE subscriptions 
  SET 
    status = 'expired',
    updated_at = now()
  WHERE 
    status = 'active' 
    AND end_date < now();
    
  -- Update user roles for expired enterprise/pro subscriptions
  UPDATE users 
  SET 
    role = 'free',
    updated_at = now()
  WHERE id IN (
    SELECT DISTINCT s.user_id 
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.status = 'expired' 
    AND sp.name IN ('Pro', 'Enterprise')
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s2 
      WHERE s2.user_id = s.user_id 
      AND s2.status = 'active' 
      AND s2.end_date > now()
    )
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create sample document categories for better organization
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert sample document categories
INSERT INTO document_categories (name, description, icon) VALUES
('Constitutional Law', 'Constitutional cases and interpretations', 'scale'),
('Corporate Law', 'Company law, business regulations, and commercial disputes', 'briefcase'),
('Criminal Law', 'Criminal cases, procedures, and penal code', 'shield'),
('Civil Procedure', 'Court procedures, evidence, and civil litigation', 'file-text'),
('Family Law', 'Marriage, divorce, custody, and family matters', 'users'),
('Property Law', 'Real estate, land law, and property disputes', 'home'),
('Contract Law', 'Contractual agreements and commercial law', 'handshake'),
('Tort Law', 'Personal injury, negligence, and civil wrongs', 'alert-triangle'),
('Administrative Law', 'Government actions and administrative procedures', 'building'),
('International Law', 'Treaties, international agreements, and cross-border issues', 'globe');

-- Add category reference to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES document_categories(id);

-- Create index for document categories
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);

-- Enable RLS on document_categories
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

-- RLS policy for document categories (everyone can read)
CREATE POLICY "Everyone can read document categories"
  ON document_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage document categories"
  ON document_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );