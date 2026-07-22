'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yruoooslxppvsoqdbgxc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlydW9vb3NseHBwdnNvcWRiZ3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDc1MjUsImV4cCI6MjEwMDMyMzUyNX0.7dpsnkoKTQVELf7Gf2qPS1zmvb0l57jmM7h3VdhqfvA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
