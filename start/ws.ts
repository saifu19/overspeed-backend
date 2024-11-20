import app from '@adonisjs/core/services/app'
import Ws from '#services/ws'
app.ready(() => {
    Ws.boot()
    const io = Ws.io
    io?.on('connection', (socket) => {
        console.log(socket.id)
    })
})