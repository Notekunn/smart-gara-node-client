require('dotenv').config()
import mqtt, { IClientOptions } from 'mqtt'
const { MQTT_HOST, MQTT_PORT, MQTT_USER, MQTT_PASS } = process.env

const brokerUrl = `mqtt://${MQTT_HOST}:${MQTT_PORT}`
const opts: IClientOptions = !!MQTT_USER
  ? {
      username: MQTT_USER,
      password: MQTT_PASS,
    }
  : {}

const client = mqtt.connect(brokerUrl, opts)

export default client
