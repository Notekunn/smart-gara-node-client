require('dotenv').config()
import mqtt, { IClientOptions } from 'mqtt'
import { CLIENT_NAME } from './'
const { MQTT_HOST, MQTT_PORT, MQTT_USER, MQTT_PASS } = process.env

const brokerUrl = `mqtt://${MQTT_HOST}:${MQTT_PORT}`
const opts: IClientOptions = !!MQTT_USER
  ? {
      username: MQTT_USER,
      password: MQTT_PASS,
      clientId: CLIENT_NAME,
    }
  : {
      clientId: CLIENT_NAME,
    }

const client = mqtt.connect(brokerUrl, opts)

export default client
