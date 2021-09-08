import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const router = Router()

router.get('/', async (req, res) => {
  const card = await prisma.card.findMany({})
  res.status(200).json(card)
})

export default router
