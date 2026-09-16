import pool from "../config/db.js";

export const getAdminGroups = async (req, res) => {
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

          COUNT(gm.student_id)::INTEGER
            AS member_count

        FROM groups AS g

        INNER JOIN users AS creator
          ON creator.id = g.created_by

        LEFT JOIN group_members AS gm
          ON gm.group_id = g.id

        GROUP BY
          g.id,
          g.name,
          g.created_by,
          creator.name,
          g.created_at,
          g.updated_at

        ORDER BY
          g.name ASC,
          g.created_at ASC
      `,
    );

    return res.status(200).json({
      success: true,
      groups: result.rows,
    });
  } catch (error) {
    console.error("Get admin groups error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
