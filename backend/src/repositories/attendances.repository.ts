import pool from "../config/database.js";

// obtiene todas las asistencias
export const getAttendances = async () => {
  const result = await pool.query(
    `SELECT
      id,
      user_id,
      TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date
    FROM attendances
    ORDER BY id DESC`
  );

  return result.rows;
};

// obtiene las asistencias de un socio
export const getAttendancesByUserId = async (
  userId: number
) => {
  const result = await pool.query(
    `SELECT
      id,
      user_id,
      TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date
    FROM attendances
    WHERE user_id = $1
    ORDER BY id DESC`,
    [userId]
  );

  return result.rows;
};

// obtiene una asistencia por su ID
export const findAttendanceById = async (
  id: number
) => {
  const result = await pool.query(
    `SELECT
      id,
      user_id,
      TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date
    FROM attendances
    WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};

// busca una asistencia de un socio en una fecha determinada
export const findAttendanceByUserAndDate = async (
  userId: number,
  attendanceDate: string
) => {
  const result = await pool.query(
    `SELECT
      id,
      user_id,
      TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date
    FROM attendances
    WHERE user_id = $1
      AND attendance_date = $2`,
    [
      userId,
      attendanceDate,
    ]
  );

  return result.rows[0];
};

// crea una nueva asistencia
export const createAttendance = async (
  userId: number,
  attendanceDate: string
) => {
  const result = await pool.query(
    `INSERT INTO attendances (
      user_id,
      attendance_date
    )
    VALUES ($1, $2)
    RETURNING
      id,
      user_id,
      TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date`,
    [
      userId,
      attendanceDate,
    ]
  );

  return result.rows[0];
};

// elimina una asistencia
export const deleteAttendance = async (
  id: number
) => {
  const result = await pool.query(
    `DELETE FROM attendances
     WHERE id = $1
     RETURNING
       id,
       user_id,
       TO_CHAR(attendance_date, 'YYYY-MM-DD') AS attendance_date`,
    [id]
  );

  return result.rows[0];
};