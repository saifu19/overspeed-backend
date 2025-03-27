import env from '#start/env'
import { loginValidator } from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'

export default class LoginController {

	async handle({ request, response }: HttpContext) {
		try {
			const { email, password } = await request.validateUsing(loginValidator)

			let config = {
				method: 'POST',
				url: `https://${env.get('DOMAIN_NAME')}/api/login/user`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				data: {
					email: email,
					password: password
				}
			}


			try {
				const result = await axios(config)

				return response.json({
					status: 'success',
					data: {
						user: {
							id: result.data.user.id,
							email: result.data.user.email,
						},
						token: result.data.token
					}
				})
			} catch (axiosError) {
				const status = axiosError.response?.status || 500
				const message = axiosError.response?.data?.message || 'Invalid credentials'
				
				return response.status(status).json({
					status: 'error',
					message: message
				})
			}
		} catch (error) {
			console.error('Validation error:', error)
			return response.status(401).json({
				status: 'error',
				message: 'Invalid credentials'
			})
		}
	}
  
}