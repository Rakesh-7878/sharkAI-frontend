import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://actkprrehrtuirwdegfv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdGtwcnJlaHRydWlyd2RlZ2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzI0MDYsImV4cCI6MjA4MzU0ODQwNn0.T7QdgyVKrg9BTqhX9JnLUZFqkFKH7ZCv0wweL3RTqgI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client initialized:', supabase);
