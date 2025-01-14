import type { HttpContext } from '@adonisjs/core/http'
import SupabaseProvider from '#providers/supabase_provider'
import env from '#start/env'
import User from '#models/user'

export default class SupabaseAuthController {
    private supabase = SupabaseProvider.getInstance().getClient()

    async sendMagicLink({ request, response }: HttpContext) {
        const { email } = request.body()

        try {
            const { data, error } = await this.supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: env.get('SUPABASE_REDIRECT_URL'),
                },
            })

            if (error) {
                return response.status(400).json({
                    status: 'error',
                    message: error.message,
                })
            }

            return response.json({
                status: 'success',
                message: 'Magic link sent successfully',
                data,
            })
        } catch (error) {
            return response.status(500).json({
                status: 'error',
                message: 'Failed to send magic link',
                error: error.message,
            })
        }
    }

    async verifySession({ request, response }: HttpContext) {
        const { access_token, refresh_token } = request.body()

        try {
            const { data: { user: supabaseUser }, error } = await this.supabase.auth.getUser(access_token)

            if (error || !supabaseUser) {
                return response.status(401).json({
                    status: 'error',
                    message: 'Invalid session',
                })
            }

            const user = User.fromSupabaseUser(supabaseUser)

            return response.json({
                status: 'success',
                user,
                tokens: { access_token, refresh_token }
            })
        } catch (error) {
            return response.status(500).json({
                status: 'error',
                message: 'Failed to verify session',
                error: error.message,
            })
        }
    }
} 