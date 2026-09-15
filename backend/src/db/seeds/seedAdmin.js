import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pool from '../../config/db.js'

const seedAdmin = async () => {
  try {
    const {
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        'ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be configured'
      )
    }

    const normalizedEmail = ADMIN_EMAIL.trim().toLowerCase()

    const passwordHash = await bcrypt.hash(
      ADMIN_PASSWORD,
      12
    )

    const result = await pool.query(
      `
        INSERT INTO users (
          student_id,
          name,
          email,
          password_hash,
          role
        )
        VALUES (
          NULL,
          $1,
          $2,
          $3,
          'admin'
        )
        ON CONFLICT (email)
        DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          role = 'admin',
          updated_at = CURRENT_TIMESTAMP
        RETURNING
          id,
          name,
          email,
          role
      `,
      [
        ADMIN_NAME.trim(),
        normalizedEmail,
        passwordHash,
      ]
    )

    console.log('Admin account seeded successfully')
    console.table(result.rows)
  } catch (error) {
    console.error('Failed to seed admin:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

seedAdmin()