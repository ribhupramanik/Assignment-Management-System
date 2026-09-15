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

export const getAdminAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params

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

        WHERE a.id = $1
          AND a.created_by = $2

        GROUP BY
          a.id,
          creator.name
      `,
      [assignmentId, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      })
    }

    return res.status(200).json({
      success: true,
      assignment: result.rows[0],
    })
  } catch (error) {
    console.error('Get assignment error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export const updateAssignment = async (req, res) => {
  const client = await pool.connect()

  try {
    const { assignmentId } = req.params

    const {
      title,
      description,
      dueDate,
      onedriveLink,
      scope,
      groupIds,
    } = req.body

    await client.query('BEGIN')

    const existingResult = await client.query(
      `
        SELECT
          id,
          title,
          description,
          due_date,
          onedrive_link,
          scope,
          created_by
        FROM assignments
        WHERE id = $1
          AND created_by = $2
      `,
      [assignmentId, req.user.id]
    )

    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK')

      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      })
    }

    const existingAssignment = existingResult.rows[0]

    const existingGroupsResult = await client.query(
      `
        SELECT group_id
        FROM assignment_groups
        WHERE assignment_id = $1
        ORDER BY group_id
      `,
      [assignmentId]
    )

    const existingGroupIds = existingGroupsResult.rows.map(
      (row) => Number(row.group_id)
    )

    const updatedTitle =
      title !== undefined
        ? title.trim()
        : existingAssignment.title

    if (!updatedTitle) {
      await client.query('ROLLBACK')

      return res.status(400).json({
        success: false,
        message: 'Assignment title is required',
      })
    }

    const updatedDescription =
      description !== undefined
        ? description?.trim() || null
        : existingAssignment.description

    let updatedDueDate = existingAssignment.due_date

    if (dueDate !== undefined) {
      const parsedDueDate = new Date(dueDate)

      if (Number.isNaN(parsedDueDate.getTime())) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'Invalid due date',
        })
      }

      if (parsedDueDate <= new Date()) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'Due date must be in the future',
        })
      }

      updatedDueDate = parsedDueDate
    }

    const updatedOnedriveLink =
      onedriveLink !== undefined
        ? onedriveLink.trim()
        : existingAssignment.onedrive_link

    if (!updatedOnedriveLink) {
      await client.query('ROLLBACK')

      return res.status(400).json({
        success: false,
        message: 'OneDrive submission link is required',
      })
    }

    if (onedriveLink !== undefined) {
      let parsedUrl

      try {
        parsedUrl = new URL(updatedOnedriveLink)
      } catch {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'Invalid OneDrive submission link',
        })
      }

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'Submission link must use HTTP or HTTPS',
        })
      }
    }

    const updatedScope =
      scope !== undefined
        ? scope
        : existingAssignment.scope

    if (!['all', 'groups'].includes(updatedScope)) {
      await client.query('ROLLBACK')

      return res.status(400).json({
        success: false,
        message: 'Scope must be either all or groups',
      })
    }

    let updatedGroupIds = []

    if (updatedScope === 'groups') {
      if (groupIds !== undefined) {
        if (!Array.isArray(groupIds) || groupIds.length === 0) {
          await client.query('ROLLBACK')

          return res.status(400).json({
            success: false,
            message: 'At least one group must be selected',
          })
        }

        updatedGroupIds = [
          ...new Set(
            groupIds
              .map((id) => Number(id))
              .filter(
                (id) =>
                  Number.isInteger(id) &&
                  id > 0
              )
          ),
        ]

        if (updatedGroupIds.length !== groupIds.length) {
          await client.query('ROLLBACK')

          return res.status(400).json({
            success: false,
            message: 'Invalid group IDs supplied',
          })
        }
      } else if (existingAssignment.scope === 'groups') {
        updatedGroupIds = existingGroupIds
      } else {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message:
            'Group IDs are required when changing assignment scope to groups',
        })
      }

      const groupCheck = await client.query(
        `
          SELECT id
          FROM groups
          WHERE id = ANY($1::BIGINT[])
        `,
        [updatedGroupIds]
      )

      if (groupCheck.rows.length !== updatedGroupIds.length) {
        await client.query('ROLLBACK')

        return res.status(400).json({
          success: false,
          message: 'One or more selected groups do not exist',
        })
      }
    }
        if (updatedScope === 'all') {
      const duplicateAssignment = await client.query(
        `
          SELECT id
          FROM assignments
          WHERE created_by = $1
            AND LOWER(title) = LOWER($2)
            AND id <> $3
          LIMIT 1
        `,
        [
          req.user.id,
          updatedTitle,
          assignmentId,
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

    if (updatedScope === 'groups') {
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
            AND a.id <> $2
            AND LOWER(a.title) = LOWER($3)
            AND (
              a.scope = 'all'
              OR (
                a.scope = 'groups'
                AND ag.group_id = ANY($4::BIGINT[])
              )
            )

          LIMIT 1
        `,
        [
          req.user.id,
          assignmentId,
          updatedTitle,
          updatedGroupIds,
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
        UPDATE assignments
        SET
          title = $1,
          description = $2,
          due_date = $3,
          onedrive_link = $4,
          scope = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
          AND created_by = $7
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
        updatedTitle,
        updatedDescription,
        updatedDueDate,
        updatedOnedriveLink,
        updatedScope,
        assignmentId,
        req.user.id,
      ]
    )
        await client.query(
      `
        DELETE FROM assignment_groups
        WHERE assignment_id = $1
      `,
      [assignmentId]
    )

    if (updatedScope === 'groups') {
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
        [
          assignmentId,
          updatedGroupIds,
        ]
      )
    }

    await client.query('COMMIT')

    return res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      assignment: {
        ...assignmentResult.rows[0],
        group_ids:
          updatedScope === 'groups'
            ? updatedGroupIds
            : [],
      },
    })
      } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Transaction may already have been rolled back.
    }

    console.error('Update assignment error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  } finally {
    client.release()
  }
}