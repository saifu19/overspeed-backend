import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import env from '#start/env'

export default class MagicLinkController {
    async generate({ request, response }: HttpContext) {
        const { email, secretKey } = request.body()

        if (secretKey !== env.get('MAGIC_LINK_SECRET')) {
            return response.status(401).json({
                status: 'error',
                message: 'Unauthorized'
            })
        }

        const user = await User.findBy('email', email)
        if (!user) {
            return response.status(404).json({
                status: 'error',
                message: 'User not found'
            })
        }

        const token = await User.accessTokens.create(user, ['*'], {
            name: 'magic_link',
            expiresIn: '30 days'
        })

        return response.json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                },
                token: JSON.parse(JSON.stringify(token)).token
            }
        })
    }
}