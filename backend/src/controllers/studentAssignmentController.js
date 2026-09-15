import pool from '../config/db.js'

export const getStudentAssignments = async (req, res) => {
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
          creator.name AS created_by_name,
          a.created_at,
          a.updated_at,

          (a.due_date < CURRENT_TIMESTAMP) AS is_overdue,

          COALESCE(
            (
              SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                  'id', g.id,
                  'name', g.name
                )
                ORDER BY g.name
              )

              FROM assignment_groups AS ag
              
              INNER JOIN groups AS g
                ON g.id = ag.group_id

              INNER JOIN group_members AS gm
                ON gm.group_id = g.id

              WHERE ag.assignment_id = a.id
                AND gm.student_id = $1
            ),
            '[]'::JSONB
          ) AS matched_groups

        FROM assignments AS a

        INNER JOIN users AS creator
          ON creator.id = a.created_by

        WHERE
          a.scope = 'all'

          OR EXISTS (
            SELECT 1

            FROM assignment_groups AS ag

            INNER JOIN group_members AS gm
              ON gm.group_id = ag.group_id

            WHERE ag.assignment_id = a.id
              AND gm.student_id = $1
          )

        ORDER BY
          a.due_date ASC,
          a.created_at DESC
      `,
      [req.user.id]
    )

    return res.status(200).json({
      success: true,
      assignments: result.rows,
    })
  } catch (error) {
    console.error('Get student assignments error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export const getStudentAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params

    const parsedAssignmentId = Number(assignmentId)

    if (
      !Number.isInteger(parsedAssignmentId) ||
      parsedAssignmentId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment ID',
      })
    }

    const result = await pool.query(
      `
        SELECT
          a.id,
          a.title,
          a.description,
          a.due_date,
          a.onedrive_link,
          a.scope,
          creator.name AS created_by_name,
          a.created_at,
          a.updated_at,

          (a.due_date < CURRENT_TIMESTAMP) AS is_overdue,

          COALESCE(
            (
              SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                  'id', g.id,
                  'name', g.name
                )
                ORDER BY g.name
              )

              FROM assignment_groups AS ag

              INNER JOIN groups AS g
                ON g.id = ag.group_id

              INNER JOIN group_members AS gm
                ON gm.group_id = g.id

              WHERE ag.assignment_id = a.id
                AND gm.student_id = $1
            ),
            '[]'::JSONB
          ) AS matched_groups

        FROM assignments AS a

        INNER JOIN users AS creator
          ON creator.id = a.created_by

        WHERE a.id = $2
          AND (
            a.scope = 'all'

            OR EXISTS (
              SELECT 1

              FROM assignment_groups AS ag

              INNER JOIN group_members AS gm
                ON gm.group_id = ag.group_id

              WHERE ag.assignment_id = a.id
                AND gm.student_id = $1
            )
          )
      `,
      [
        req.user.id,
        parsedAssignmentId,
      ]
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
    console.error('Get student assignment error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

