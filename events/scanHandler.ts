import { Message, debug } from '../utils'
import { Client } from 'mqtt'
import { PrismaClient } from '@prisma/client'
import { vn } from '../config/language'
const prisma = new PrismaClient()
const scanHandler = async (client: Client, message: Message): Promise<void> => {
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
    await prisma.card.update({
      where: {
        id: card.id,
      },
      data: {
        status: 'OUT',
      },
    })
    return
  }
  // Chưa vào bãi -> Quẹt thẻ vào
  if (card.status == 'OUT') {
    const dataSend = {
      action: 'in',
      payload: card.id,
    }
    client.publish('mqtt/car', JSON.stringify(dataSend))
    return
  }
  // Đã vào bãi -> Quẹt thẻ ra ngoài
  if (card.status == 'PARKING') {
    const dataSend = {
      action: 'out',
      payload: card.id,
    }
    client.publish('mqtt/car', JSON.stringify(dataSend))
  }
}
export default scanHandler
