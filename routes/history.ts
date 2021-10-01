import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { sendAll } from '../config/apiAdapter'
const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req, res) => {
  const history = await prisma.history.findMany({})
  return res.status(200).send(sendAll(history))
})

export default router
