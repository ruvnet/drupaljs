import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your_public_anon_key';

export const supabase = createClient(supabaseUrl, supabaseKey);
