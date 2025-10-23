import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Client {
  id: string;
  name: string;
  industry: string;
  created_at: string;
  created_by: string;
}

export interface Recommendation {
  id: string;
  client_id: string;
  title: string;
  category: string;
  description: string;
  context: string;
  priority: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}
