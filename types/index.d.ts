declare interface IMessage {
  readonly action: string
  readonly payload: Object
}
declare interface IRChangePayload {
  id: number
  serving: boolean
}

interface IDataSendLCDPayload {
  lcd: 'IN' | 'OUT'
  message: Array<string> | string
}
declare interface IDataSendLCD {
  action: 'show' | 'clear'
  payload: IDataSendLCDPayload
}

declare interface IDataSendCar {
  action: 'IN' | 'OUT'
  payload: number
}

declare interface IDataSendGate {
  action: 'OPEN' | 'CLOSE'
  payload: 'IN' | 'OUT'
}
