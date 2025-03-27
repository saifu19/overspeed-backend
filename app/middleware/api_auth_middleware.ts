import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import axios from 'axios'
import env from '#start/env'

interface ApiUser {
  id: string
  name: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

export default class ApiAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    const authHeader = request.header('Authorization')

    if (!authHeader) {
      return response.status(401).json({
        status: 'error',
        message: 'No authorization header'
      })
    }

    try {
      const result = await axios({
        method: 'GET',
        url: `https://${env.get('DOMAIN_NAME')}/api/stateful/user`,
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader
        }
      })

      // If we get here, the token is valid
      const apiUser = result.data as ApiUser

      // Attach the user to the context
      ctx.user = apiUser
      
      // Call next and capture the response
      const nextResponse = await next()

      return nextResponse
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle specific API error responses
        if (error.response?.status === 401) {
          return response.status(401).json({
            status: 'error',
            message: 'Invalid or expired token'
          })
        }

        // Handle other API errors
        return response.status(error.response?.status || 500).json({
          status: 'error',
          message: error.response?.data?.message || 'Authentication failed',
          error: error.message
        })
      }

      // Handle non-Axios errors
      return response.status(500).json({
        status: 'error',
        message: 'Authentication failed',
        error: error.message
      })
    }
  }
} 