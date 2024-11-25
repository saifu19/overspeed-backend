import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class LogoutController {

	async handle({ request, response, params, auth }: HttpContext) {
		try {
			const tokenString = request.header('Authorization')?.split(' ')[1]
			if (!tokenString) {
				return response.status(401).json({
					status: 'error',
					message: 'Unauthorized'
				})
			}

			const user = await User.findBy('id', params.id)
			if (!user) {
				return response.status(401).json({
					status: 'error',
					message: 'Unauthorized'
				})
			}

			const token = auth.user!.currentAccessToken

			if (token) {
				await User.accessTokens.delete(user, token.identifier)
			}

			return response.json({
				status: 'success',
				message: 'Logged out successfully'
			})
		} catch (error) {
			return response.status(500).json({
				status: 'error',
				message: 'Logout failed'
			})
		}
	}

	// async handle({ response, auth }: HttpContext) {

	// 	await auth.use('web').logout()

	// 	return response.redirect().toPath('/')

	// }

}