// Supabase configuration
const SUPABASE_URL = 'https://bnlnhxrtiyfdsihtanoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubG5oeHJ0aXlmZHNpaHRhbm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5ODUzMjksImV4cCI6MjA2ODU2MTMyOX0.RzSHQFkpCDgvwgaZhJsxP2Q5ipyITT5p3-XVotQo47Q';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase; 