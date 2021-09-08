import { Message, debug, caculateMoney, subtractTime, formatMoney } from './utils'
import { Client } from 'mqtt'
import { PrismaClient } from '@prisma/client'
import { vn } from './config/language'
const prisma = new PrismaClient()
export const scanHandler = async (client: Client, message: Message): Promise<void> => {
  debug.info('scan', message.action, message.payload)
  const rfid = message.payload as string
  // Mã thẻ không hợp lệ (nên thay bằng regex)
  if (rfid == null || rfid.length < 10) return

  const card = await prisma.card.findUnique({
    where: {
      rfid,
    },
  })
  // Nếu card chưa đăng ký -> Gửi yêu cầu đăng ký chờ admin duyệt
  if (card == null || card.status == 'PENDING') {
    // Chưa có trên hệ thống
    if (card == null) {
      //   const dataSend = {
      //     action: 'add',
      //     payload: rfid,
      //   }
      //   client.publish('mqtt/admin/card', JSON.stringify(dataSend))
      // Thêm vào hệ thống
      await prisma.card.create({
        data: {
          rfid,
          status: 'PENDING',
        },
      })
    }
    // Thông báo
    const dataSend = {
      action: 'show',
      payload: [vn.NOT_EXIST_IN_SYSTEM],
    }
    client.publish('mqtt/lcd', JSON.stringify(dataSend))
    return
  }

  // Nếu card đăng ký rồi -> Kiểm tra trạng thái
  // đang vào bãi -> Quẹt 2 lần -> bỏ qua
  if (card.status == 'DRIVING_IN') {
    debug.warn('car', 'Đang vào bãi rồi')
    return
  }
  // Đang thanh toán -> quẹt -> thanh toán xong
  if (card.status == 'PAYING') {
    debug.info('car', 'Đang thanh toán')
    return
  }
  // Chưa vào bãi -> Quẹt thẻ vào
  if (card.status == 'OUT') {
    const dataSend = {
      action: 'out',
      payload: card.id,
    }
    client.publish('mqtt/car', JSON.stringify(dataSend))
    return
  }
  // Đã vào bãi -> Quẹt thẻ ra ngoài
  if (card.status == 'PARKING') {
    const dataSend = {
      action: 'in',
      payload: card.id,
    }
    client.publish('mqtt/car', JSON.stringify(dataSend))
  }
}

export const carHandler = async (client: Client, message: Message): Promise<void> => {
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
    await prisma.card.update({
      where: {
        id: cardId,
      },
      data: {
        status: 'DRIVING_IN',
      },
    })
  }
  if (message.action == 'out') {
    const history = await prisma.history.findFirst({
      where: {
        idCard: message.payload,
        timeOut: {
          equals: null,
        },
      },
      orderBy: {
        timeIn: 'desc',
      },
    })
    // Có lỗi xảy ra
    if (history == null || history.timeOut != null) {
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
