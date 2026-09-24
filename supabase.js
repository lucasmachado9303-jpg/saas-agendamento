// Cliente Supabase do navegador.
// A chave ANON e publica por natureza: a protecao dos dados vem das regras RLS do banco.
// Nunca coloque a SERVICE_ROLE_KEY aqui (ela fica so nas variaveis da Vercel, usadas em api/).

const SUPABASE_URL = "https://byrcbihwqgostesuoztd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cmNiaWh3cWdvc3Rlc3VvenRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNjQ4NDYsImV4cCI6MjEwMDg0MDg0Nn0.yHUKgBSpLTrCKwnv75F1hHMeUJN9HzvXHvIRHZsKDxM";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
