import jwt from 'jsonwebtoken'

const generateToken = (user) => {
  return jwt.sign(
    {
      role: user.role,
      studentId: user.student_id,
    },
    process.env.JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    }
  )
}

export default generateToken