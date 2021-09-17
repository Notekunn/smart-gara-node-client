import { debug, caculateMoney, subtractTime, formatMoney, formatSlot } from '../utils'
import { Client } from 'mqtt'
import { PrismaClient } from '@prisma/client'
import { vn } from '../config/language'
const prisma = new PrismaClient()

const carHandler = async (client: Client, message: IMessage): Promise<void> => {
  debug.info('car', message.action, message.payload)
  const cardId = parseInt(message.payload as string)
  if (message.action == 'IN') {
    const freeParking = await prisma.parking.findFirst({
      where: {
        status: 'FREE',
      },
    })
    // Hết chỗ
    if (freeParking == null) {
      const dataSend: IDataSendLCD = {
        action: 'show',
        payload: {
          lcd: 'IN',
          message: [vn.FULL_SLOT, vn.COME_BACK_LATER],
        },
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
        timeIn: new Date(),
      },
    })
    // Đổi trạng thái bãi đỗ xe thành inserving
    const parkingUpdate = prisma.parking.update({
      where: {
        id: freeParking.id,
      },
      data: {
        status: 'INSERVING',
      },
    })
    await Promise.all([cardUpdate, historyInsert, parkingUpdate])
    const dataSend: IDataSendLCD = {
      action: 'show',
      payload: {
        lcd: 'IN',
        message: [vn.YOUR_SLOT, formatSlot(freeParking.name)],
      },
    }
    client.publish('mqtt/lcd', JSON.stringify(dataSend))
    // Mở cổng
    const dataSend2: IDataSendGate = {
      action: 'OPEN',
      payload: 'IN',
    }
    client.publish('mqtt/gate', JSON.stringify(dataSend2))
  }
  if (message.action == 'OUT') {
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
      const dataSend: IDataSendLCD = {
        action: 'show',
        payload: {
          lcd: 'OUT',
          message: [vn.SOME_THING_ERROR],
        },
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
    const dataSend: IDataSendLCD = {
      action: 'show',
      payload: {
        lcd: 'OUT',
        message: [vn.TOTAL_MONEY, formatMoney(money)],
      },
    }
    client.publish('mqtt/lcd', JSON.stringify(dataSend))
    return
  }
}

export default carHandler
