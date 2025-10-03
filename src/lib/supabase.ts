import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types for easyIA Legal Assistant
export interface User {
  id: string;
  email: string;
  role: 'free' | 'pro' | 'enterprise' | 'admin';
  name?: string;
  address?: string;
  profile_picture_url?: string;
  preferences?: Record<string, any>;
  last_active?: string;
  practice_areas?: string[];
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  features: string[];
  tier_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'pending';
  start_date?: string;
  end_date?: string;
  paystack_reference?: string;
  paystack_customer_code?: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface Document {
  id: string;
  user_id: string;
  name: string;
  original_filename: string;
  file_type: 'pdf' | 'docx' | 'txt';
  file_size?: number;
  storage_path?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  processing_error?: string;
  total_chunks: number;
  metadata: Record<string, any>;
  category_id?: string;
  created_at: string;
  updated_at: string;
  category?: DocumentCategory;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding?: number[];
  chunk_number: number;
  chunk_size?: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  is_archived: boolean;
  message_count: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  is_citation: boolean;
  citation_metadata: Record<string, any>;
  tokens_used?: number;
  model_used?: string;
  processing_time_ms?: number;
  created_at: string;
}

export interface Citation {
  id: string;
  document_chunk_id?: string;
  case_name?: string;
  citation_text: string;
  court?: string;
  year?: number;
  url?: string;
  case_type?: 'supreme_court' | 'court_of_appeal' | 'high_court' | 'magistrate' | 'statute' | 'regulation';
  jurisdiction: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
  reference: string;
  gateway: string;
  gateway_response: Record<string, any>;
  transaction_type: 'subscription' | 'one_time' | 'refund';
  created_at: string;
  updated_at: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}

// Service functions for database operations
export class DatabaseService {
  // User operations
  static async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Subscription operations
  static async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('tier_level');
    
    if (error) throw error;
    return data || [];
  }

  // Document operations
  static async getUserDocuments(userId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        category:document_categories(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getDocumentCategories(): Promise<DocumentCategory[]> {
    const { data, error } = await supabase
      .from('document_categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // Chat operations
  static async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createChatSession(userId: string, title: string): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: title || 'New Chat'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getSessionMessages(sessionId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');
    
    if (error) throw error;
    return data || [];
  }

  // Citation operations
  static async searchCitations(query: string, limit: number = 10): Promise<Citation[]> {
    const { data, error } = await supabase
      .from('citations')
      .select('*')
      .or(`case_name.ilike.%${query}%,citation_text.ilike.%${query}%`)
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  // Admin operations
  static async getAllUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  }

  static async getAllSubscriptions(limit: number = 50, offset: number = 0): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*),
        user:users(email, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  }

  // Utility functions
  static async checkUserFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('user_has_feature_access', {
        user_uuid: userId,
        feature_name: feature
      });
    
    if (error) throw error;
    return data || false;
  }

  static async getUserTier(userId: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('get_user_tier', {
        user_uuid: userId
      });
    
    if (error) throw error;
    return data || 'free';
  }
}