import { debug } from '../utils'
import { Client } from 'mqtt'
import { PrismaClient } from '@prisma/client'
import { vn } from '../config/language'
const prisma = new PrismaClient()

const IRSensorHandler = async (client: Client, message: IMessage): Promise<void> => {
  debug.info('ir-sensor', message.action, message.payload)
  if (message.action == 'change') {
    const { id, isFree } = message.payload as IRChangePayload
    const parking = await prisma.parking.findUnique({
      where: {
        id,
      },
    })
    if (parking == null) return
    // Nếu ở trạng thái free mà trống chỗ thì bỏ quá
    if (isFree && parking.status == 'FREE') return
    // Nếu ở trạng thái service mà kín chỗ thì bỏ qua
    if (!isFree && parking.status == 'BUSY') return
    // Rời khỏi vị trí đỗ
    if (isFree && parking.status == 'BUSY') {
    }
  }
}
export default IRSensorHandler
