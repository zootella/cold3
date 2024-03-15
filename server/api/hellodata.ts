import { createClient } from '@supabase/supabase-js';

export default defineEventHandler(async (event) => {

  const supabase = createClient(process.env.ACCESS_SUPABASE_URL, process.env.ACCESS_SUPABASE_KEY);
  const { data, error } = await supabase.from("countries").select('*');
  if (error) throw error;
  return data;
});









