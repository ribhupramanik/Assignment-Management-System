import pool from '../config/db.js'

export const getAssignmentSubmissions = async (req, res) => {
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
          id,
          title,
          description,
          due_date,
          scope,
          created_by
        FROM assignments
        WHERE id = $1
          AND created_by = $2
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

    const assignment = assignmentResult.rows[0]

    const studentsResult = await pool.query(
      `
        WITH eligible_students AS (
          SELECT DISTINCT
            u.id,
            u.student_id,
            u.name,
            u.email

          FROM users AS u

          WHERE u.role = 'student'
            AND (
              $2 = 'all'

              OR EXISTS (
                SELECT 1

                FROM group_members AS gm

                INNER JOIN assignment_groups AS ag
                  ON ag.group_id = gm.group_id

                WHERE gm.student_id = u.id
                  AND ag.assignment_id = $1
              )
            )
        )

        SELECT
          es.id,
          es.student_id,
          es.name,
          es.email,

          (s.id IS NOT NULL) AS confirmed,

          s.confirmed_at,

          (
            s.confirmed_at IS NOT NULL
            AND s.confirmed_at > $3
          ) AS is_late

        FROM eligible_students AS es

        LEFT JOIN submissions AS s
          ON s.assignment_id = $1
          AND s.student_id = es.id

        ORDER BY
          es.name ASC,
          es.student_id ASC
      `,
      [
        parsedAssignmentId,
        assignment.scope,
        assignment.due_date,
      ]
    )

    const groupProgressResult = await pool.query(
      `
        WITH target_groups AS (
          SELECT
            g.id,
            g.name

          FROM groups AS g

          WHERE
            $2 = 'all'

            OR EXISTS (
              SELECT 1

              FROM assignment_groups AS ag

              WHERE ag.assignment_id = $1
                AND ag.group_id = g.id
            )
        )

        SELECT
          tg.id,
          tg.name,

          COUNT(gm.student_id)::INTEGER
            AS total_members,

          COUNT(s.id)::INTEGER
            AS confirmed_members,

          (
            COUNT(gm.student_id)
            -
            COUNT(s.id)
          )::INTEGER
            AS pending_members,

          COUNT(s.id)
            FILTER (
              WHERE s.confirmed_at > $3
            )::INTEGER
            AS late_confirmations,

          CASE
            WHEN COUNT(gm.student_id) = 0
              THEN 0

            ELSE ROUND(
              (
                COUNT(s.id)::NUMERIC
                /
                COUNT(gm.student_id)
              ) * 100,
              2
            )
          END
            AS completion_percentage,

          CASE
            WHEN COUNT(s.id) = 0
              THEN 'not_started'

            WHEN COUNT(s.id) = COUNT(gm.student_id)
              THEN 'completed'

            ELSE 'in_progress'
          END
            AS status

        FROM target_groups AS tg

        LEFT JOIN group_members AS gm
          ON gm.group_id = tg.id

        LEFT JOIN submissions AS s
          ON s.assignment_id = $1
          AND s.student_id = gm.student_id

        GROUP BY
          tg.id,
          tg.name

        ORDER BY
          tg.name ASC
      `,
      [
        parsedAssignmentId,
        assignment.scope,
        assignment.due_date,
      ]
    )

    const students = studentsResult.rows

    const totalStudents = students.length

    const confirmedStudents =
      students.filter(
        (student) => student.confirmed
      ).length

    const pendingStudents =
      totalStudents - confirmedStudents

    const lateConfirmations =
      students.filter(
        (student) => student.is_late
      ).length

    const completionPercentage =
      totalStudents === 0
        ? 0
        : Number(
            (
              (confirmedStudents / totalStudents) *
              100
            ).toFixed(2)
          )

    const groups = groupProgressResult.rows.map(
      (group) => ({
        ...group,
        completion_percentage:
          Number(group.completion_percentage),
      })
    )

    return res.status(200).json({
      success: true,

      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        due_date: assignment.due_date,
        scope: assignment.scope,
      },

      summary: {
        total_students: totalStudents,
        confirmed_students: confirmedStudents,
        pending_students: pendingStudents,
        late_confirmations: lateConfirmations,
        completion_percentage: completionPercentage,
      },

      groups,

      students,
    })
  } catch (error) {
    console.error(
      'Get assignment submissions error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

