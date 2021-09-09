declare interface IMessage {
  readonly action: string
  readonly payload: Object
}
declare interface IRChangePayload {
  id: number
  serving: boolean
}

declare interface IDataSendLCD {
  action: 'show' | 'clear'
  payload: Array<string> | string
}
