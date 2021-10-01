import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { sendAll, sendError, sendOne } from '../config/apiAdapter'
const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  const history = await prisma.history.findMany({
    include: {
      card: true,
      parking: true,
    },
  })
  return res.status(200).send(sendAll(history))
})
router.get('/:id', async (req, res) => {
  const historyId = parseInt(req.params.id, 10) || 0
  const history = await prisma.history.findUnique({
    where: {
      id: historyId,
    },
    include: {
      card: true,
      parking: true,
    },
  })
  if (history == null) {
    res.status(400).json(sendError('Card is not found'))
    return
  }
  res.status(200).json(sendOne(history))
})
export default router
