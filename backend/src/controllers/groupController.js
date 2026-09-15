import pool from '../config/db.js'

export const createGroup = async (req, res) => {
  const client = await pool.connect()

  try {
    const { name } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required',
      })
    }

    const normalizedName = name.trim()

    if (normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Group name cannot exceed 100 characters',
      })
    }

    await client.query('BEGIN')

    const groupResult = await client.query(
      `
        INSERT INTO groups (
          name,
          created_by
        )
        VALUES ($1, $2)
        RETURNING
          id,
          name,
          created_by,
          created_at,
          updated_at
      `,
      [normalizedName, req.user.id]
    )

    const group = groupResult.rows[0]

    await client.query(
      `
        INSERT INTO group_members (
          group_id,
          student_id
        )
        VALUES ($1, $2)
      `,
      [group.id, req.user.id]
    )

    await client.query('COMMIT')

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: {
        ...group,
        member_count: 1,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')

    if (
      error.code === '23505' &&
      error.constraint === 'unique_group_name_per_creator'
    ) {
      return res.status(409).json({
        success: false,
        message: 'You already have a group with this name',
      })
    }

    console.error('Create group error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  } finally {
    client.release()
  }
}

export const getMyGroups = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          g.id,
          g.name,
          g.created_by,
          creator.name AS created_by_name,
          g.created_at,
          g.updated_at,
          COUNT(all_members.id)::INTEGER AS member_count
        FROM group_members AS my_membership

        INNER JOIN groups AS g
          ON g.id = my_membership.group_id

        INNER JOIN users AS creator
          ON creator.id = g.created_by

        LEFT JOIN group_members AS all_members
          ON all_members.group_id = g.id

        WHERE my_membership.student_id = $1

        GROUP BY
          g.id,
          g.name,
          g.created_by,
          creator.name,
          g.created_at,
          g.updated_at

        ORDER BY g.created_at DESC
      `,
      [req.user.id]
    )

    return res.status(200).json({
      success: true,
      groups: result.rows,
    })
  } catch (error) {
    console.error('Get groups error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}