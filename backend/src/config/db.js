import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

export const connectDB = async () => {
  const client = await pool.connect()

  try {
    const result = await client.query(`
      SELECT
        current_database() AS database,
        current_user AS user
    `)

    console.log(
      `PostgreSQL connected: database=${result.rows[0].database}, user=${result.rows[0].user}`
    )
  } finally {
    client.release()
  }
}

export default pool