import { createClient } from '@supabase/supabase-js'
import env from '#start/env'

class SupabaseProvider {
  private static instance: SupabaseProvider
  private supabaseClient

  private constructor() {
    this.supabaseClient = createClient(
      env.get('SUPABASE_URL')!,
      env.get('SUPABASE_ANON_KEY')!
    )
  }

  public static getInstance(): SupabaseProvider {
    if (!SupabaseProvider.instance) {
      SupabaseProvider.instance = new SupabaseProvider()
    }
    return SupabaseProvider.instance
  }

  public getClient() {
    return this.supabaseClient
  }
}

export default SupabaseProvider 