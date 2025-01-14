import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import SupabaseProvider from '#providers/supabase_provider'
import User from '#models/user'

export default class SupabaseAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    const authHeader = request.header('Authorization')

    if (!authHeader) {
      return response.status(401).json({
        status: 'error',
        message: 'No authorization header',
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = SupabaseProvider.getInstance().getClient()

    try {
      const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token)

      if (error) {
        return response.status(401).json({
          status: 'error',
          message: 'Invalid token',
          error: error.message,
        })
      }

      if (!supabaseUser) {
        return response.status(401).json({
          status: 'error',
          message: 'No user found',
        })
      }

      ctx.user = User.fromSupabaseUser(supabaseUser)
      
      // Call next and capture the response
      const result = await next()

      return result
    } catch (error) {
      return response.status(401).json({
        status: 'error',
        message: 'Authentication failed',
        error: error.message,
      })
    }
  }
} 