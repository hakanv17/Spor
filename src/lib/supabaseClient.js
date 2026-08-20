import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://osdvsicunxciacooxzjq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MRMMcmt6y0XHhzwj-U9kCQ_VDjduAno';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
