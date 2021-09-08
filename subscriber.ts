import client from './config/client'

client.on('connect', function () {
  client.subscribe('mqtt/#')
})

client.on('message', function (topic, message) {
  const context = message.toString()
  console.log(context)
})
