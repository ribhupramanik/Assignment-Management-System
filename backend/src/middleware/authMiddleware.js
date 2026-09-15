import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    const result = await pool.query(
      `
        SELECT
          id,
          student_id,
          name,
          email,
          role,
          created_at
        FROM users
        WHERE id = $1
      `,
      [decoded.sub]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      })
    }

    req.user = result.rows[0]

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      })
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      })
    }

    console.error('Authentication error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      })
    }

    next()
  }
}