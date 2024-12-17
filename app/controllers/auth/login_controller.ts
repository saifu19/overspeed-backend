import User from '#models/user'
import { loginValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'

export default class LoginController {

	async handle({ request, response }: HttpContext) {
		try {
			const { email, password } = await request.validateUsing(loginValidator)
			const user = await User.verifyCredentials(email, password)
			const token = await User.accessTokens.create(user, ['*'], { expiresIn: "30 days" })

			return response.json({
				status: 'success',
				data: {
					user: {
						id: user.id,
						email: user.email,
					},
					token: token
				}
			})
		} catch (error) {
			return response.status(401).json({
				status: 'error',
				message: 'Invalid credentials'
			})
		}
	}
  
}