import { debug } from '../utils'
import { Client } from 'mqtt'
import { PrismaClient } from '@prisma/client'
import { vn } from '../config/language'
import { ROOT_CHANNEL } from '../config/'
const masterCache: IMasterCache = {
  lastCard: null,
  step: 0,
}
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
    masterCache.lastCard = rfid
    // Thông báo
    const dataSend: IDataSendLCD = {
      action: 'show',
      payload: {
        lcd: 'IN',
        message: [vn.NOT_EXIST_IN_SYSTEM],
      },
    }
    client.publish(`${ROOT_CHANNEL}/lcd`, JSON.stringify(dataSend))
    return
  }
  // Xử lý card admin
  if (card.type == 'MASTER') {
    // Nếu chưa có thẻ nào k đăng ký
    if (masterCache.lastCard == null) return
    // Hiện thông báo xác nhận đăng ký
    if (masterCache.step == 0) {
      const dataSend: IDataSendLCD = {
        action: 'show',
        payload: {
          lcd: 'IN',
          message: [vn.CONFIRM_REGISTER],
        },
      }
      masterCache.step = 1
      setTimeout(() => {
        masterCache.step = 0
        masterCache.lastCard = null
      }, 5000)
      client.publish(`${ROOT_CHANNEL}/lcd`, JSON.stringify(dataSend))
      return
    }
    //Đăng ký xong
    if (masterCache.step == 1) {
      await prisma.card.update({
        where: {
          rfid: masterCache.lastCard,
        },
        data: {
          owner: 'Administrator',
          licencePlate: '1234567',
          createAt: new Date(),
          status: 'OUT',
        },
      })
      const dataSend: IDataSendLCD = {
        action: 'show',
        payload: {
          lcd: 'IN',
          message: [vn.REGISTER_SUCCESS],
        },
      }
      client.publish(`${ROOT_CHANNEL}/lcd`, JSON.stringify(dataSend))
      masterCache.step = 0
      masterCache.lastCard = null
      return
    }

    return
  }
  masterCache.lastCard = null
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
      action: 'OUT',
      payload: history.id,
    }
    client.publish(`${ROOT_CHANNEL}/car`, JSON.stringify(dataSend))
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
      payload: {
        lcd: 'OUT',
        message: [vn.GOODBYE],
      },
    }
    client.publish(`${ROOT_CHANNEL}/lcd`, JSON.stringify(dataSend))

    const dataSend2: IDataSendGate = {
      action: 'OPEN',
      payload: 'OUT',
    }
    client.publish(`${ROOT_CHANNEL}/gate`, JSON.stringify(dataSend2))
    return
  }
  // Chưa vào bãi -> Quẹt thẻ vào
  if (card.status == 'OUT') {
    const dataSend: IDataSendCar = {
      action: 'IN',
      payload: card.id,
    }
    client.publish(`${ROOT_CHANNEL}/car`, JSON.stringify(dataSend))
    return
  }
}
export default scanHandler
