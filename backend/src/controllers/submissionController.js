import pool from '../config/db.js'

export const confirmSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params
    const { confirmed } = req.body

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

    if (confirmed !== true) {
      return res.status(400).json({
        success: false,
        message: 'Submission confirmation is required',
      })
    }

    const assignmentResult = await pool.query(
      `
        SELECT
          a.id,
          a.title,
          a.scope,
          a.due_date,

          COALESCE(
            ARRAY_AGG(DISTINCT gm.group_id)
              FILTER (WHERE gm.group_id IS NOT NULL),
            ARRAY[]::BIGINT[]
          ) AS matched_group_ids

        FROM assignments AS a

        LEFT JOIN assignment_groups AS ag
          ON ag.assignment_id = a.id

        LEFT JOIN group_members AS gm
          ON gm.group_id = ag.group_id
          AND gm.student_id = $1

        WHERE a.id = $2

        GROUP BY
          a.id,
          a.title,
          a.scope,
          a.due_date
      `,
      [
        req.user.id,
        parsedAssignmentId,
      ]
    )

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      })
    }

    const assignment = assignmentResult.rows[0]

    const matchedGroupIds =
      assignment.matched_group_ids.map(Number)

    const hasAccess =
      assignment.scope === 'all' ||
      matchedGroupIds.length > 0

    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      })
    }

    const submissionGroupId =
      assignment.scope === 'groups' &&
      matchedGroupIds.length === 1
        ? matchedGroupIds[0]
        : null

    const submissionResult = await pool.query(
      `
        INSERT INTO submissions (
          assignment_id,
          student_id,
          group_id
        )
        VALUES ($1, $2, $3)

        ON CONFLICT (
          assignment_id,
          student_id
        )
        DO NOTHING

        RETURNING
          id,
          assignment_id,
          student_id,
          group_id,
          confirmed_at
      `,
      [
        parsedAssignmentId,
        req.user.id,
        submissionGroupId,
      ]
    )

    if (submissionResult.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'Submission has already been confirmed',
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Submission confirmed successfully',
      submission: submissionResult.rows[0],
    })
  } catch (error) {
    console.error('Confirm submission error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export const getSubmissionStatus = async (req, res) => {
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

    const assignmentResult = await pool.query(
      `
        SELECT
          a.id,
          a.scope

        FROM assignments AS a

        WHERE a.id = $1
          AND (
            a.scope = 'all'

            OR EXISTS (
              SELECT 1

              FROM assignment_groups AS ag

              INNER JOIN group_members AS gm
                ON gm.group_id = ag.group_id

              WHERE ag.assignment_id = a.id
                AND gm.student_id = $2
            )
          )
      `,
      [
        parsedAssignmentId,
        req.user.id,
      ]
    )

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      })
    }

    const submissionResult = await pool.query(
      `
        SELECT
          id,
          assignment_id,
          student_id,
          group_id,
          confirmed_at
        FROM submissions
        WHERE assignment_id = $1
          AND student_id = $2
      `,
      [
        parsedAssignmentId,
        req.user.id,
      ]
    )

    if (submissionResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        confirmed: false,
        submission: null,
      })
    }

    return res.status(200).json({
      success: true,
      confirmed: true,
      submission: submissionResult.rows[0],
    })
  } catch (error) {
    console.error('Get submission status error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}