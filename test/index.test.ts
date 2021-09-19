import client from '../config/client'
import { ROOT_CHANNEL } from '../config/'
const delay = (ms: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}
client.once('connect', function () {
  //   client.subscribe(`${ROOT_CHANNEL}/#`)
  console.log('Alo')
  main()
})

async function main() {
  client.publish(
    `${ROOT_CHANNEL}/scan`,
    JSON.stringify({
      action: 'read',
      payload: '73-106-91-178',
    })
  )
  await delay(1000)
  client.publish(
    `${ROOT_CHANNEL}/ir`,
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
    `${ROOT_CHANNEL}/ir`,
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
    `${ROOT_CHANNEL}/scan`,
    JSON.stringify({
      action: 'read',
      payload: '73-106-91-178',
    })
  )
  await delay(1000)
  client.publish(
    `${ROOT_CHANNEL}/scan`,
    JSON.stringify({
      action: 'read',
      payload: '73-106-91-178',
    })
  )
  await delay(1000)
}
