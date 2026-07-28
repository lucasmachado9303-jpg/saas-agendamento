// Supabase configuration
// Replace the values below with your project credentials from:
// https://supabase.com/dashboard → Project Settings → API

const SUPABASE_URL = "https://byrcbihwqgostesuoztd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmNiaWh3cWdvc3Rlc3VvenRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNjQ4NDYsImV4cCI6MjEwMDg0MDg0Nn0.yHUKgBSpLTrCKwnv75F1hHMeUJN9HzvXHvIRHZsKDxM";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
