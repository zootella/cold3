
import { createClient } from '@supabase/supabase-js'
import {
getAccess
} from '@/library/grand.js'

export default defineEventHandler(async (event) => {
	let access = await getAccess()

  const supabase = createClient(access.get('ACCESS_SUPABASE_URL'), access.get('ACCESS_SUPABASE_KEY_SECRET'))
  const { data, error } = await supabase.from("countries").select('*')
  if (error) throw error
  return data;
});









