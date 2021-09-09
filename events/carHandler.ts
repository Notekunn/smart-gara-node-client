import { debug, caculateMoney, subtractTime, formatMoney } from '../utils'
import { Client } from 'mqtt'
import { PrismaClient } from '@prisma/client'
import { vn } from '../config/language'
const prisma = new PrismaClient()

const carHandler = async (client: Client, message: IMessage): Promise<void> => {
  debug.info('car', message.action, message.payload)
  const cardId = parseInt(message.payload as string)
  if (message.action == 'in') {
    const freeParking = await prisma.parking.findFirst({
      where: {
        status: 'FREE',
      },
    })
    // Hết chỗ
    if (freeParking == null) {
      const dataSend = {
        action: 'show',
        payload: [vn.FULL_SLOT, vn.COME_BACK_LATER],
      }
      client.publish('mqtt/lcd', JSON.stringify(dataSend))
      return
    }
    // Set trạng thái cho xe (đang vào bãi)
    const cardUpdate = prisma.card.update({
      where: {
        id: cardId,
      },
      data: {
        status: 'DRIVING_IN',
      },
    })
    const historyInsert = prisma.history.create({
      data: {
        idCard: cardId,
        idParking: freeParking.id,
      },
    })
    // const parkingUpdate = prisma.parking.update({
    //   where: {
    //     id: freeParking.id,
    //   },
    //   data: {
    //     status: 'BUSY',
    //   },
    // })
    await Promise.all([cardUpdate, historyInsert /*, parkingUpdate */])
    const dataSend = {
      action: 'show',
      payload: [vn.YOUR_SLOT, freeParking.name],
    }
    client.publish('mqtt/lcd', JSON.stringify(dataSend))
  }
  if (message.action == 'out') {
    const history = await prisma.history.findUnique({
      where: {
        id: parseInt(message.payload + ''),
      },
      include: {
        card: true,
      },
    })
    // console.log(history)
    // Có lỗi xảy ra
    if (history == null) {
      await prisma.card.update({
        where: {
          id: cardId,
        },
        data: {
          status: 'OUT',
        },
      })
      const dataSend = {
        action: 'show',
        payload: [vn.SOME_THING_ERROR],
      }
      client.publish('mqtt/lcd', JSON.stringify(dataSend))
      return
    }
    // Yêu cầu trả tiền
    await prisma.history.update({
      where: {
        id: history.id,
      },
      data: {
        timeOut: new Date(),
      },
    })
    const money = caculateMoney(subtractTime(history.timeIn, new Date()))
    const dataSend = {
      action: 'show',
      payload: [vn.TOTAL_MONEY, formatMoney(money)],
    }
    client.publish('mqtt/lcd', JSON.stringify(dataSend))
    return
  }
}

export default carHandler
