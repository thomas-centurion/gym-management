import pool from "../config/database.js";


export const getUsers = async () => {
  const result = await pool.query("SELECT * FROM users");

  return result.rows;
};

export const createUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password)
     VALUES ($1, $2, $3, $4)
     RETURNING id, first_name, last_name, email, role`,
    [firstName, lastName, email, password]
  );

  return result.rows[0];
};


export const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  return result.rows[0];
};


export const findUserById = async (id: number) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );

  return result.rows[0];
};


export const updateUser = async (
  id: number,
  firstName: string,
  lastName: string,
  email: string
) => {
  const result = await pool.query(
    `UPDATE users
     SET first_name = $1,
         last_name = $2,
         email = $3
     WHERE id = $4
     RETURNING id, first_name, last_name, email, role`,
    [firstName, lastName, email, id]
  );

  return result.rows[0];
};


export const deleteUser = async (id: number) => {
  const result = await pool.query(
    `DELETE FROM users
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rows[0];
};