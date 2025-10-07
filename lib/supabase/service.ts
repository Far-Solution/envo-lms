// lib/supabase/service.ts
import { createClient } from "@supabase/supabase-js"

// Service role client — DO NOT expose this to the browser
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
