import { debug } from '../utils'
import { Client } from 'mqtt'
import { PrismaClient } from '@prisma/client'
import { vn } from '../config/language'
const prisma = new PrismaClient()
const scanHandler = async (client: Client, message: IMessage): Promise<void> => {
  debug.info('scan', message.action, message.payload)
  const rfid = `${message.payload}`
  // Mã thẻ không hợp lệ (nên thay bằng regex)
  if (rfid == null || rfid.length < 10) return
  if (message.action != 'read') return

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
    const dataSend: IDataSendLCD = {
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
  // Đang ra khỏi bãi -> Chuyển sang thanh toán
  if (card.status == 'DRIVING_OUT') {
    debug.info('car', 'Thanh toán')
    const history = await prisma.history.findFirst({
      where: {
        idCard: card.id,
      },
      include: {
        card: true,
        parking: true,
      },
      orderBy: {
        timeIn: 'desc',
      },
    })
    if (history == null) {
      debug.error('car', 'Không tìm thấy lịch sử đỗ xe')
      return
    }
    await prisma.history.update({
      where: {
        id: history.id,
      },
      data: {
        card: {
          update: {
            status: 'PAYING',
          },
        },
        parking: {
          update: {
            status: 'FREE',
          },
        },
      },
    })
    // await prisma.card.update({
    //   where: {
    //     id: card.id,
    //   },
    //   data: {
    //     status: 'PAYING',
    //   },
    // })
    const dataSend: IDataSendCar = {
      action: 'out',
      payload: history.id,
    }
    client.publish('mqtt/car', JSON.stringify(dataSend))
  }
  // Đang thanh toán -> quẹt -> thanh toán xong
  if (card.status == 'PAYING') {
    debug.info('car', 'Thanh toán xong')
    await prisma.card.update({
      where: {
        id: card.id,
      },
      data: {
        status: 'OUT',
      },
    })
    const dataSend: IDataSendLCD = {
      action: 'show',
      payload: [vn.GOODBYE],
    }
    client.publish('mqtt/lcd', JSON.stringify(dataSend))
    return
  }
  // Chưa vào bãi -> Quẹt thẻ vào
  if (card.status == 'OUT') {
    const dataSend: IDataSendCar = {
      action: 'in',
      payload: card.id,
    }
    client.publish('mqtt/car', JSON.stringify(dataSend))
    return
  }
}
export default scanHandler
