import pool from "../config/database.js";

export const getAttendances = async () => {
  const result = await pool.query(
    "SELECT * FROM attendances"
  );

  return result.rows;
};

export const createAttendance = async (
  userId: number,
  attendanceDate: string
) => {
  const result = await pool.query(
    `INSERT INTO attendances
      (user_id, attendance_date)
     VALUES ($1, $2)
     RETURNING *`,
    [userId, attendanceDate]
  );

  return result.rows[0];
};

export const findAttendanceById = async (id: number) => {
  const result = await pool.query(
    "SELECT * FROM attendances WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

export const updateAttendance = async (
  id: number,
  attendanceDate: string
) => {
  const result = await pool.query(
    `UPDATE attendances
     SET attendance_date = $1
     WHERE id = $2
     RETURNING *`,
    [attendanceDate, id]
  );

  return result.rows[0];
};

export const deleteAttendance = async (id: number) => {
  const result = await pool.query(
    `DELETE FROM attendances
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rows[0];
};