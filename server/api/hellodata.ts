
import { createClient } from '@supabase/supabase-js'
import {
Access
} from '@/library/grand.js'

export default defineEventHandler(async (event) => {

  const supabase = createClient(Access('ACCESS_SUPABASE_URL'), Access('ACCESS_SUPABASE_KEY_SECRET'))
  const { data, error } = await supabase.from("countries").select('*')
  if (error) throw error
  return data;
});









