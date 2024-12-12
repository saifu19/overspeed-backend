import User from '#models/user';
import { registerValidator } from '#validators/auth';
import type { HttpContext } from '@adonisjs/core/http'

export default class RegisterController {

	async handle({ request, response }: HttpContext) {

		try {
			const data = await request.validateUsing(registerValidator)
			const user = await User.create(data)

			// Generate API token for the new user
			const token = await User.accessTokens.create(user, ['*'], { expiresIn: "1 hour" })
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
			return response.status(422).json({
				status: 'error',
				message: 'Registration failed',
				errors: error.messages || error.message
			})
		}
	}

	async show({ view }: HttpContext) {

		return view.render('pages/auth/register');


	}

	async store({ request, response, auth }: HttpContext) {


		try {

			const data = await request.validateUsing(registerValidator);

			const user = await User.create(data)

			await auth.use('web').login(user)

			return response.redirect().toPath('/')
		} catch (error) {
			console.error("Validation failed", error);
			return response.redirect().back();
		}




	}

}