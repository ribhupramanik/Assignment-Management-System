import express from 'express'
import cors from 'cors'

import authRoutes from './routes/authRoutes.js'
import groupRoutes from './routes/groupRoutes.js'
import adminAssignmentRoutes from './routes/adminAssignmentRoutes.js'
import studentAssignmentRoutes from './routes/studentAssignmentRoutes.js'
import adminDashboardRoutes from './routes/adminDashboardRoutes.js'

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
app.use('/api/admin/assignments', adminAssignmentRoutes)
app.use('/api/assignments', studentAssignmentRoutes)
app.use('/api/admin/dashboard', adminDashboardRoutes)

export default app