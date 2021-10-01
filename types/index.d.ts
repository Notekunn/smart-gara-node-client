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

declare interface IMasterCache {
  lastCard: string | null
  step: 0 | 1
}
// type Pick<T, K> = { [P in keyof K]: T[P] }
type RequireOnlyOne<T> = Pick<T, keyof T> &
  {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Record<K, undefined>>
  }[Keys]

type ToArrayLike<T> = Array<RequireOnlyOne<T>>
type MagicTransform<T, K> = {
  propName: K
  value: T[K]
}
type PatchProp<T> = Array<MagicTransform<T, keyof T>>
type NewType = PatchProp<{
  action: 'OPEN' | 'CLOSE'
  payload: 'IN' | 'OUT'
}>
