declare interface IMessage {
  readonly action: string
  readonly payload: Object
}
declare interface IRChangePayload {
  id: number
  isFree: boolean
}
