import pool from '../config/db.js'

export const createAssignment = async (req, res) => {
  const client = await pool.connect()

  try {
    const {
      title,
      description,
      dueDate,
      onedriveLink,
      scope,
      groupIds = [],
    } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Assignment title is required',
      })
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required',
      })
    }

    if (!onedriveLink || !onedriveLink.trim()) {
      return res.status(400).json({
        success: false,
        message: 'OneDrive submission link is required',
      })
    }

    if (!['all', 'groups'].includes(scope)) {
      return res.status(400).json({
        success: false,
        message: 'Scope must be either all or groups',
      })
    }

    const parsedDueDate = new Date(dueDate)

    if (Number.isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due date',
      })
    }

    if (parsedDueDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Due date must be in the future',
      })
    }

    let parsedUrl

    try {
      parsedUrl = new URL(onedriveLink.trim())
    } catch {
      return res.status(400).json({
        success: false,
        message: 'Invalid OneDrive submission link',
      })
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: 'Submission link must use HTTP or HTTPS',
      })
    }

    let normalizedGroupIds = []

    if (scope === 'groups') {
      if (!Array.isArray(groupIds) || groupIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one group must be selected',
        })
      }

      normalizedGroupIds = [
        ...new Set(
          groupIds
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
        ),
      ]

      if (normalizedGroupIds.length !== groupIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid group IDs supplied',
        })
      }
    }

    await client.query('BEGIN')

    if (scope === 'groups') {
      const groupCheck = await client.query(
        `
          SELECT id
          FROM groups
          WHERE id = ANY($1::BIGINT[])
        `,
        [normalizedGroupIds]
      )

      if (groupCheck.rows.length !== normalizedGroupIds.length) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'One or more selected groups do not exist',
        })
      }
    }

    if (scope === 'all') {
      const duplicateAssignment = await client.query(
        `
          SELECT id, scope
          FROM assignments
          WHERE created_by = $1
            AND LOWER(title) = LOWER($2)
          LIMIT 1
        `,
        [
          req.user.id,
          title.trim(),
        ]
      )

      if (duplicateAssignment.rows.length > 0) {
        await client.query('ROLLBACK')

        return res.status(409).json({
          success: false,
          message: 'An assignment with this title already exists',
        })
      }
    }

    if (scope === 'groups') {
      const duplicateAssignment = await client.query(
        `
          SELECT DISTINCT
            a.id,
            a.scope,
            g.name AS group_name

          FROM assignments AS a

          LEFT JOIN assignment_groups AS ag
            ON ag.assignment_id = a.id

          LEFT JOIN groups AS g
            ON g.id = ag.group_id

          WHERE a.created_by = $1
            AND LOWER(a.title) = LOWER($2)
            AND (
              a.scope = 'all'
              OR (
                a.scope = 'groups'
                AND ag.group_id = ANY($3::BIGINT[])
              )
            )

          LIMIT 1
        `,
        [
          req.user.id,
          title.trim(),
          normalizedGroupIds,
        ]
      )

      if (duplicateAssignment.rows.length > 0) {
        await client.query('ROLLBACK')

        const duplicate = duplicateAssignment.rows[0]

        if (duplicate.scope === 'all') {
          return res.status(409).json({
            success: false,
            message:
              'An assignment with this title is already assigned to all students',
          })
        }

        return res.status(409).json({
          success: false,
          message:
            `An assignment with this title already exists for ${duplicate.group_name}`,
        })
      }
    }

    const assignmentResult = await client.query(
      `
        INSERT INTO assignments (
          title,
          description,
          due_date,
          onedrive_link,
          scope,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          title,
          description,
          due_date,
          onedrive_link,
          scope,
          created_by,
          created_at,
          updated_at
      `,
      [
        title.trim(),
        description?.trim() || null,
        parsedDueDate,
        onedriveLink.trim(),
        scope,
        req.user.id,
      ]
    )

    const assignment = assignmentResult.rows[0]

    if (scope === 'groups') {
      await client.query(
        `
          INSERT INTO assignment_groups (
            assignment_id,
            group_id
          )
          SELECT
            $1,
            UNNEST($2::BIGINT[])
        `,
        [assignment.id, normalizedGroupIds]
      )
    }

    await client.query('COMMIT')

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment: {
        ...assignment,
        group_ids:
          scope === 'groups'
            ? normalizedGroupIds
            : [],
      },
    })
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Transaction may already have been rolled back.
    }

    console.error('Create assignment error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  } finally {
    client.release()
  }
}

export const getAdminAssignments = async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          a.id,
          a.title,
          a.description,
          a.due_date,
          a.onedrive_link,
          a.scope,
          a.created_by,
          creator.name AS created_by_name,
          a.created_at,
          a.updated_at,

          COUNT(ag.group_id)::INTEGER AS assigned_group_count,

          COALESCE(
            JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'id', g.id,
                'name', g.name
              )
              ORDER BY g.name
            )
            FILTER (WHERE g.id IS NOT NULL),
            '[]'::JSONB
          ) AS assigned_groups

        FROM assignments AS a

        INNER JOIN users AS creator
          ON creator.id = a.created_by

        LEFT JOIN assignment_groups AS ag
          ON ag.assignment_id = a.id

        LEFT JOIN groups AS g
          ON g.id = ag.group_id

        GROUP BY
          a.id,
          creator.name

        ORDER BY a.created_at DESC
      `
    )

    return res.status(200).json({
      success: true,
      assignments: result.rows,
    })
  } catch (error) {
    console.error('Get admin assignments error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}