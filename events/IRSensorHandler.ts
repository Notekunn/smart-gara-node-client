import { debug } from '../utils'
import { Client } from 'mqtt'
import { PrismaClient } from '@prisma/client'
import { vn } from '../config/language'
const prisma = new PrismaClient()

const IRSensorHandler = async (client: Client, message: IMessage): Promise<void> => {
  debug.info('ir-sensor', message.action, message.payload)
  if (message.action == 'change') {
    const { id, serving } = message.payload as IRChangePayload
    debug.verbose('slot-change', id + '', serving)
    // const parking = await prisma.parking.findUnique({
    //   where: {
    //     id,
    //   },
    // })
    const history = await prisma.history.findFirst({
      where: {
        idParking: id,
      },
      include: {
        card: true,
        parking: true,
      },
      orderBy: {
        timeIn: 'desc',
      },
    })
    if (history == null) return
    const { parking, card } = history
    if (parking == null || card == null) return
    // Nếu ở trạng thái free mà trống chỗ thì bỏ quá
    if (!serving && parking.status == 'FREE') return
    // Nếu ở trạng thái service mà kín chỗ thì bỏ qua
    if (serving && parking.status == 'BUSY') return
    // Rời khỏi vị trí đỗ -> serving = false
    if (!serving && parking.status == 'BUSY') {
      debug.info('Driving out', card.id + '', card.status)
      // Nếu thẻ không ở trạng thái parking
      if (card.status != 'PARKING') return
      await prisma.history.update({
        where: {
          id: history.id,
        },
        data: {
          parking: {
            update: {
              status: 'FREE',
            },
          },
          card: {
            update: {
              status: 'DRIVING_OUT',
            },
          },
        },
      })
    }
    // Vào bãi đỗ xe -> serving = true
    if (serving && parking.status == 'FREE') {
      debug.info('Parking', card.id + '', card.status)
      // Nếu thẻ không ở trạng thái driving in
      if (card.status != 'DRIVING_IN') return
      await prisma.history.update({
        where: {
          id: history.id,
        },
        data: {
          parking: {
            update: {
              status: 'BUSY',
            },
          },
          card: {
            update: {
              status: 'PARKING',
            },
          },
        },
      })
    }
  }
}
export default IRSensorHandler
