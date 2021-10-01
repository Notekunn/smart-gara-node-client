import { Request, Router } from 'express'
import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { sendAll, sendError, sendOne } from '../config/apiAdapter'
const prisma = new PrismaClient()
const router = Router()

router.get('/', async (req, res) => {
  const card = await prisma.card.findMany({})
  res.status(200).json(sendAll(card))
})

router
  .get('/:id', async (req, res) => {
    const { id } = req.params
    const cardID = parseInt(id, 10) || 0
    const card = await prisma.card.findUnique({
      where: {
        id: cardID,
      },
    })
    if (card == null) {
      res.status(400).json(sendError('Card is not found'))
      return
    }
    res.status(200).json(sendOne(card))
  })
  .delete('/:id', async (req, res) => {
    const { id } = req.params
    const cardID = parseInt(id, 10) || 0
    const card = await prisma.card.delete({
      where: {
        id: cardID,
      },
    })
    res.status(200).json({
      data: 'Card deleted successfully!',
    })
  })
  .patch('/:id', async (req: Request<{ id: string }, {}, Prisma.CardUpdateInput>, res) => {
    const { id } = req.params
    const cardID = parseInt(id, 10) || 0
    const updateOpts = req.body

    const card = await prisma.card.update({
      where: {
        id: cardID,
      },
      data: updateOpts,
    })
    res.status(200).json(sendOne(card))
  })

export default router
