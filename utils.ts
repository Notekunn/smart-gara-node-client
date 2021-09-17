import log from 'npmlog'
export interface Message {
  action: string
  payload: Object
}

export const debug = log

export const subtractTime = (a: Date, b: Date) => {
  const milisec_diff = Math.abs(a.getTime() - b.getTime())
  const seconds = Math.floor(milisec_diff / 1000)
  const minutes = Math.floor(seconds / 60)
  return minutes
}

export const caculateMoney = (minutes: number): number => {
  if (minutes < 60) return 3000
  const hours = Math.ceil(minutes / 60)
  if (hours > 12) return 24000
  else return hours * 2000
}
export const formatMoney = (money: number): string => {
  return money.toFixed(1)
}
export const formatSlot = (slot: string): string => {
  return slot.padStart(16, ' ')
}
