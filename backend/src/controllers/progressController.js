import pool from '../config/db.js'

export const getGroupProgress = async (req, res) => {
  try {
    const { groupId } = req.params

    const parsedGroupId = Number(groupId)

    if (
      !Number.isInteger(parsedGroupId) ||
      parsedGroupId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid group ID',
      })
    }

    const groupResult = await pool.query(
      `
        SELECT
          g.id,
          g.name,
          g.created_by
        FROM groups AS g

        INNER JOIN group_members AS gm
          ON gm.group_id = g.id

        WHERE g.id = $1
          AND gm.student_id = $2
      `,
      [
        parsedGroupId,
        req.user.id,
      ]
    )

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      })
    }

    const group = groupResult.rows[0]

    const progressResult = await pool.query(
      `
        SELECT
          a.id,
          a.title,
          a.description,
          a.due_date,
          a.scope,

          COUNT(gm.student_id)::INTEGER
            AS total_members,

          COUNT(s.id)::INTEGER
            AS confirmed_members,

          ROUND(
            (
              COUNT(s.id)::NUMERIC
              /
              NULLIF(
                COUNT(gm.student_id),
                0
              )
            ) * 100,
            2
          ) AS completion_percentage,

          CASE
            WHEN COUNT(s.id) = 0
              THEN 'not_started'

            WHEN COUNT(s.id) = COUNT(gm.student_id)
              THEN 'completed'

            ELSE 'in_progress'
          END AS status,

          (a.due_date < CURRENT_TIMESTAMP)
            AS is_overdue

        FROM assignments AS a

        CROSS JOIN group_members AS gm

        LEFT JOIN submissions AS s
          ON s.assignment_id = a.id
          AND s.student_id = gm.student_id

        WHERE gm.group_id = $1
          AND (
            a.scope = 'all'

            OR EXISTS (
              SELECT 1

              FROM assignment_groups AS ag

              WHERE ag.assignment_id = a.id
                AND ag.group_id = $1
            )
          )

        GROUP BY
          a.id,
          a.title,
          a.description,
          a.due_date,
          a.scope

        ORDER BY
          a.due_date ASC,
          a.created_at DESC
      `,
      [parsedGroupId]
    )

    const assignments = progressResult.rows.map(
      (assignment) => ({
        ...assignment,
        completion_percentage:
          Number(assignment.completion_percentage),
      })
    )

    const totalAssignments = assignments.length

    const completedAssignments =
      assignments.filter(
        (assignment) =>
          assignment.status === 'completed'
      ).length

    const overallPercentage =
      totalAssignments === 0
        ? 0
        : Number(
            (
              assignments.reduce(
                (total, assignment) =>
                  total +
                  assignment.completion_percentage,
                0
              ) / totalAssignments
            ).toFixed(2)
          )

    return res.status(200).json({
      success: true,

      group: {
        id: group.id,
        name: group.name,
        created_by: group.created_by,
      },

      summary: {
        total_assignments: totalAssignments,
        completed_assignments: completedAssignments,
        overall_percentage: overallPercentage,
      },

      assignments,
    })
  } catch (error) {
    console.error('Get group progress error:', error)

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}