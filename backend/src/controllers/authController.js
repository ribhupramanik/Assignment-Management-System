import bcrypt from 'bcryptjs'
import pool from '../config/db.js'

export const register = async (req, res) => {
  try {
    const { name, email, studentId, password } = req.body

    if (!name || !email || !studentId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, student ID and password are required',
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedStudentId = studentId.trim()
    const normalizedName = name.trim()

    const existingUser = await pool.query(
      `
        SELECT id, email, student_id
        FROM users
        WHERE email = $1 OR student_id = $2
      `,
      [normalizedEmail, normalizedStudentId]
    )

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0]

      if (user.email === normalizedEmail) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        })
      }

      return res.status(409).json({
        success: false,
        message: 'An account with this student ID already exists',
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `
        INSERT INTO users (
          student_id,
          name,
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, $4, 'student')
        RETURNING
          id,
          student_id,
          name,
          email,
          role,
          created_at
      `,
      [
        normalizedStudentId,
        normalizedName,
        normalizedEmail,
        passwordHash,
      ]
    )

    return res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      user: result.rows[0],
    })
  } catch (error) {
    console.error('Registration error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}