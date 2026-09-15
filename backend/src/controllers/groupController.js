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

export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params
    const { identifier } = req.body

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student email or student ID is required',
      })
    }

    const groupResult = await pool.query(
      `
        SELECT
          id,
          name,
          created_by
        FROM groups
        WHERE id = $1
      `,
      [groupId]
    )

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      })
    }

    const group = groupResult.rows[0]

    if (String(group.created_by) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the group creator can add members',
      })
    }

    const normalizedIdentifier = identifier.trim()

    const studentResult = await pool.query(
      `
        SELECT
          id,
          student_id,
          name,
          email
        FROM users
        WHERE role = 'student'
          AND (
            LOWER(email) = LOWER($1)
            OR student_id = $1
          )
        LIMIT 1
      `,
      [normalizedIdentifier]
    )

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No student found with this email or student ID',
      })
    }

    const student = studentResult.rows[0]

    const memberResult = await pool.query(
      `
        INSERT INTO group_members (
          group_id,
          student_id
        )
        VALUES ($1, $2)
        RETURNING joined_at
      `,
      [group.id, student.id]
    )

    return res.status(201).json({
      success: true,
      message: 'Student added to group successfully',
      member: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        joined_at: memberResult.rows[0].joined_at,
      },
    })
  } catch (error) {
    if (
      error.code === '23505' &&
      error.constraint === 'unique_group_member'
    ) {
      return res.status(409).json({
        success: false,
        message: 'Student is already a member of this group',
      })
    }

    console.error('Add group member error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params

    const groupResult = await pool.query(
      `
        SELECT
          id,
          name,
          created_by
        FROM groups
        WHERE id = $1
      `,
      [groupId]
    )

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      })
    }

    const group = groupResult.rows[0]

    const membershipResult = await pool.query(
      `
        SELECT id
        FROM group_members
        WHERE group_id = $1
          AND student_id = $2
      `,
      [groupId, req.user.id]
    )

    if (membershipResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      })
    }

    const membersResult = await pool.query(
      `
        SELECT
          u.id,
          u.student_id,
          u.name,
          u.email,
          gm.joined_at,
          (u.id = g.created_by) AS is_creator
        FROM group_members AS gm

        INNER JOIN users AS u
          ON u.id = gm.student_id

        INNER JOIN groups AS g
          ON g.id = gm.group_id

        WHERE gm.group_id = $1

        ORDER BY
          is_creator DESC,
          gm.joined_at ASC
      `,
      [groupId]
    )

    return res.status(200).json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        created_by: group.created_by,
      },
      members: membersResult.rows,
    })
  } catch (error) {
    console.error('Get group members error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}