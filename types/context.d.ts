import type { HttpContext } from '@adonisjs/core/http'
import type User from '#models/user'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: User
  }
} 