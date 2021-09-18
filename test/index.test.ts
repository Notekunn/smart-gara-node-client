import client from '../config/client'
const delay = (ms: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}
client.once('connect', function () {
  //   client.subscribe('mqtt/#')
  console.log('Alo')
  main()
})

async function main() {
  client.publish(
    'mqtt/scan',
    JSON.stringify({
      action: 'read',
      payload: '73-106-91-178',
    })
  )
  await delay(1000)
  client.publish(
    'mqtt/ir',
    JSON.stringify({
      action: 'change',
      payload: {
        id: 1,
        serving: true,
      },
    })
  )
  await delay(1000)
  client.publish(
    'mqtt/ir',
    JSON.stringify({
      action: 'change',
      payload: {
        id: 1,
        serving: false,
      },
    })
  )
  await delay(1000)
  client.publish(
    'mqtt/scan',
    JSON.stringify({
      action: 'read',
      payload: '73-106-91-178',
    })
  )
  await delay(1000)
  client.publish(
    'mqtt/scan',
    JSON.stringify({
      action: 'read',
      payload: '73-106-91-178',
    })
  )
  await delay(1000)
}
