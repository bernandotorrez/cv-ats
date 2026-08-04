import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nfdrkuvyowaydjkhfvrr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZHJrdXZ5b3dheWRqa2hmdnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzgyMjcsImV4cCI6MjA5MzcxNDIyN30.vKz8HZbvZ5TRMwBIEbIjPyXtCUqEhrScVEwXaLzI1mA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  // We need to simulate the edge function call, or just fetch tryout_questions directly.
  // Wait, tryout_questions is readable by authenticated users only.
  // Since we are anon, we might get an empty array.
  const { data, error } = await supabase
    .from('tryout_questions')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Error fetching questions:", error);
  } else {
    console.log("Data fetched:", JSON.stringify(data, null, 2));
  }
}

run();
