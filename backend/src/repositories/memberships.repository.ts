import pool from "../config/database.js";

export const getMemberships = async () => {
  const result = await pool.query(
    "SELECT * FROM memberships"
  );

  return result.rows;
};

export const createMembership = async (
  userId: number,
  plan: string,
  startDate: string,
  endDate: string
) => {
  const result = await pool.query(
    `INSERT INTO memberships
      (user_id, plan, start_date, end_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, plan, startDate, endDate]
  );

  return result.rows[0];
};

export const findMembershipById = async (id: number) => {
  const result = await pool.query(
    "SELECT * FROM memberships WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

export const updateMembership = async (
  id: number,
  plan: string,
  startDate: string,
  endDate: string,
  status: string
) => {
  const result = await pool.query(
    `UPDATE memberships
     SET plan = $1,
         start_date = $2,
         end_date = $3,
         status = $4
     WHERE id = $5
     RETURNING *`,
    [plan, startDate, endDate, status, id]
  );

  return result.rows[0];
};

export const deleteMembership = async (id: number) => {
  const result = await pool.query(
    `DELETE FROM memberships
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rows[0];
};