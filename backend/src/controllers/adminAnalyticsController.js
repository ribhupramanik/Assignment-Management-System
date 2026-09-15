import pool from '../config/db.js'

export const getDashboardAnalytics = async (req, res) => {
  try {
    const summaryResult = await pool.query(
      `
        WITH eligible_pairs AS (

          SELECT
            a.id AS assignment_id,
            u.id AS student_id

          FROM assignments AS a

          INNER JOIN users AS u
            ON u.role = 'student'

          WHERE a.created_by = $1
            AND a.scope = 'all'


          UNION


          SELECT
            a.id AS assignment_id,
            gm.student_id

          FROM assignments AS a

          INNER JOIN assignment_groups AS ag
            ON ag.assignment_id = a.id

          INNER JOIN group_members AS gm
            ON gm.group_id = ag.group_id

          WHERE a.created_by = $1
            AND a.scope = 'groups'
        )

        SELECT
          (
            SELECT COUNT(*)::INTEGER
            FROM users
            WHERE role = 'student'
          ) AS total_students,

          (
            SELECT COUNT(*)::INTEGER
            FROM groups
          ) AS total_groups,

          (
            SELECT COUNT(*)::INTEGER
            FROM assignments
            WHERE created_by = $1
          ) AS total_assignments,

          (
            SELECT COUNT(*)::INTEGER
            FROM assignments
            WHERE created_by = $1
              AND due_date < CURRENT_TIMESTAMP
          ) AS overdue_assignments,

          COUNT(ep.student_id)::INTEGER
            AS expected_confirmations,

          COUNT(s.id)::INTEGER
            AS confirmed_submissions,

          (
            COUNT(ep.student_id)
            -
            COUNT(s.id)
          )::INTEGER
            AS pending_submissions,

          CASE
            WHEN COUNT(ep.student_id) = 0
              THEN 0

            ELSE ROUND(
              (
                COUNT(s.id)::NUMERIC
                /
                COUNT(ep.student_id)
              ) * 100,
              2
            )
          END
            AS overall_confirmation_percentage

        FROM eligible_pairs AS ep

        LEFT JOIN submissions AS s
          ON s.assignment_id = ep.assignment_id
          AND s.student_id = ep.student_id
      `,
      [req.user.id]
    )

    const assignmentPerformanceResult =
      await pool.query(
        `
          WITH eligible_pairs AS (

            SELECT
              a.id AS assignment_id,
              u.id AS student_id

            FROM assignments AS a

            INNER JOIN users AS u
              ON u.role = 'student'

            WHERE a.created_by = $1
              AND a.scope = 'all'


            UNION


            SELECT
              a.id AS assignment_id,
              gm.student_id

            FROM assignments AS a

            INNER JOIN assignment_groups AS ag
              ON ag.assignment_id = a.id

            INNER JOIN group_members AS gm
              ON gm.group_id = ag.group_id

            WHERE a.created_by = $1
              AND a.scope = 'groups'
          )

          SELECT
            a.id,
            a.title,
            a.scope,
            a.due_date,

            COUNT(ep.student_id)::INTEGER
              AS total_students,

            COUNT(s.id)::INTEGER
              AS confirmed_students,

            (
              COUNT(ep.student_id)
              -
              COUNT(s.id)
            )::INTEGER
              AS pending_students,

            CASE
              WHEN COUNT(ep.student_id) = 0
                THEN 0

              ELSE ROUND(
                (
                  COUNT(s.id)::NUMERIC
                  /
                  COUNT(ep.student_id)
                ) * 100,
                2
              )
            END
              AS completion_percentage,

            CASE
              WHEN COUNT(ep.student_id) = 0
                THEN 'no_students'

              WHEN COUNT(s.id) = 0
                THEN 'not_started'

              WHEN COUNT(s.id) = COUNT(ep.student_id)
                THEN 'completed'

              ELSE 'in_progress'
            END
              AS status,

            (
              a.due_date < CURRENT_TIMESTAMP
            ) AS is_overdue

          FROM assignments AS a

          LEFT JOIN eligible_pairs AS ep
            ON ep.assignment_id = a.id

          LEFT JOIN submissions AS s
            ON s.assignment_id = a.id
            AND s.student_id = ep.student_id

          WHERE a.created_by = $1

          GROUP BY
            a.id,
            a.title,
            a.scope,
            a.due_date

          ORDER BY
            a.due_date ASC,
            a.created_at DESC
        `,
        [req.user.id]
      )

    const groupPerformanceResult =
      await pool.query(
        `
          WITH applicable_pairs AS (

            SELECT DISTINCT
              g.id AS group_id,
              a.id AS assignment_id,
              gm.student_id

            FROM groups AS g

            INNER JOIN group_members AS gm
              ON gm.group_id = g.id

            INNER JOIN assignments AS a
              ON a.created_by = $1

              AND (
                a.scope = 'all'

                OR EXISTS (
                  SELECT 1

                  FROM assignment_groups AS ag

                  WHERE ag.assignment_id = a.id
                    AND ag.group_id = g.id
                )
              )
          )

          SELECT
            g.id,
            g.name,

            (
              SELECT COUNT(*)::INTEGER
              FROM group_members AS member_count
              WHERE member_count.group_id = g.id
            ) AS member_count,

            COUNT(
              DISTINCT ap.assignment_id
            )::INTEGER
              AS total_assignments,

            COUNT(ap.student_id)::INTEGER
              AS expected_confirmations,

            COUNT(s.id)::INTEGER
              AS confirmed_submissions,

            (
              COUNT(ap.student_id)
              -
              COUNT(s.id)
            )::INTEGER
              AS pending_submissions,

            CASE
              WHEN COUNT(ap.student_id) = 0
                THEN 0

              ELSE ROUND(
                (
                  COUNT(s.id)::NUMERIC
                  /
                  COUNT(ap.student_id)
                ) * 100,
                2
              )
            END
              AS completion_percentage

          FROM groups AS g

          LEFT JOIN applicable_pairs AS ap
            ON ap.group_id = g.id

          LEFT JOIN submissions AS s
            ON s.assignment_id = ap.assignment_id
            AND s.student_id = ap.student_id

          GROUP BY
            g.id,
            g.name

          ORDER BY
            completion_percentage DESC,
            g.name ASC
        `,
        [req.user.id]
      )

    const summary = summaryResult.rows[0]

    const assignmentPerformance =
      assignmentPerformanceResult.rows.map(
        (assignment) => ({
          ...assignment,
          completion_percentage:
            Number(assignment.completion_percentage),
        })
      )

    const groupPerformance =
      groupPerformanceResult.rows.map(
        (group) => ({
          ...group,
          completion_percentage:
            Number(group.completion_percentage),
        })
      )

    return res.status(200).json({
      success: true,

      summary: {
        ...summary,
        overall_confirmation_percentage:
          Number(
            summary.overall_confirmation_percentage
          ),
      },

      assignment_performance:
        assignmentPerformance,

      group_performance:
        groupPerformance,
    })
  } catch (error) {
    console.error(
      'Get dashboard analytics error:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}