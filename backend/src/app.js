import express from 'express'
import cors from 'cors'

import authRoutes from './routes/authRoutes.js'
import groupRoutes from './routes/groupRoutes.js'

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
)

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Joineazy API is running',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/groups', groupRoutes)

export default app