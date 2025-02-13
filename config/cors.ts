import { defineConfig } from '@adonisjs/cors'

export default defineConfig({
    enabled: false,
    origin: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
    headers: true,
    exposeHeaders: [],
    credentials: true,
    maxAge: 90,
})