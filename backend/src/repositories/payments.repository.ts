import pool from "../config/database.js";

export const getPayments = async () => {
  const result = await pool.query(
    "SELECT * FROM payments"
  );

  return result.rows;
};

export const createPayment = async (
  membershipId: number,
  amount: number,
  paymentDate: string
) => {
  const result = await pool.query(
    `INSERT INTO payments
      (membership_id, amount, payment_date)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [membershipId, amount, paymentDate]
  );

  return result.rows[0];
};

export const findPaymentById = async (id: number) => {
  const result = await pool.query(
    "SELECT * FROM payments WHERE id = $1",
    [id]
  );

  return result.rows[0];
};

export const updatePayment = async (
  id: number,
  amount: number,
  paymentDate: string
) => {
  const result = await pool.query(
    `UPDATE payments
     SET amount = $1,
         payment_date = $2
     WHERE id = $3
     RETURNING *`,
    [amount, paymentDate, id]
  );

  return result.rows[0];
};

export const deletePayment = async (id: number) => {
  const result = await pool.query(
    `DELETE FROM payments
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rows[0];
};