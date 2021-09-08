import client from './config/client'
import express from 'express'
import { scanHandler, carHandler } from './events'
import { debug } from './utils'
import cardRouter from './routes/card'

client.on('connect', function () {
  client.subscribe('mqtt/#')
})

client.on('message', function (topic, message) {
  const context = message.toString()
  const msg: IMessage = JSON.parse(context)
  try {
    switch (topic) {
      case 'mqtt/scan':
        scanHandler(client, msg)
        break
      case 'mqtt/car':
        carHandler(client, msg)
        break
      default:
        debug.info(topic, msg.action, msg.payload)
    }
  } catch (error) {
    console.log(error)
  }
})

const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello world')
})
app.use('/cards', cardRouter)

app.listen(8080, () => {
  console.log('Listening in 8080')
})
