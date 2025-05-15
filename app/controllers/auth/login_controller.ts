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
				url: `https://${env.get('DOMAIN_NAME')}/oauth/token`,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
				},
				data: {
					grant_type: 'password',
					client_id: env.get('PROJECTWE_CLIENT_ID'),
					client_secret: env.get('PROJECTWE_CLIENT_SECRET'),
					username: email,
					password: password,
					scope: '*'
				}
			}

			console.log(config)


			try {
				const result = await axios(config)
				console.log(result.data)
				console.log(result.status)

				if (result.status !== 200) {
					console.log(result.data)
					return response.status(result.status).json({
						status: 'error',
						message: result.data.message
					})
				}

				const user = await axios.get(`https://${env.get('DOMAIN_NAME')}/api/stateful/user`, {
					headers: {
						'Authorization': `Bearer ${result.data.access_token}`
					}
				})

				console.log(user.status)

				if (user.status !== 200) {
					console.log(user.data)
					return response.status(user.status).json({
						status: 'error',
						message: user.data.message
					})
				}

				return response.json({
					status: 'success',
					data: {
						user: {
							id: user.data.id,
							email: user.data.email,
						},
						token: result.data.access_token
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
		} catch (error: any) {
			console.error('Validation error:', error)
			return response.status(401).json({
				status: 'error',
				message: 'Invalid credentials'
			})
		}
	}
  
}