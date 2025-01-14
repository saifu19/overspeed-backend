import type { User as SupabaseUser } from '@supabase/supabase-js'

export default class User {
  declare id: string  // Supabase UUID
  declare email: string
  declare created_at: string
  declare updated_at: string

  constructor(supabaseUser: SupabaseUser) {
    this.id = supabaseUser.id
    this.email = supabaseUser.email!
    this.created_at = supabaseUser.created_at
    this.updated_at = supabaseUser.updated_at ?? new Date().toISOString()
  }

  // Static method to create User instance from Supabase user
  static fromSupabaseUser(supabaseUser: SupabaseUser): User {
    return new User(supabaseUser)
  }
}