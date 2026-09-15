import {
  getPayments,
  createPayment,
  findPaymentById,
  updatePayment,
  deletePayment,
} from "../repositories/payments.repository.js";

export const getPaymentsService = async () => {
  return await getPayments();
};

export const createPaymentService = async (
  membershipId: number,
  amount: number,
  paymentDate: string
) => {
  if (!membershipId || !amount || !paymentDate) {
    throw new Error("Todos los campos son obligatorios");
  }

  if (amount <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  return await createPayment(
    membershipId,
    amount,
    paymentDate
  );
};

export const getPaymentByIdService = async (id: number) => {
  const payment = await findPaymentById(id);

  if (!payment) {
    throw new Error("Pago no encontrado");
  }

  return payment;
};

export const updatePaymentService = async (
  id: number,
  amount: number,
  paymentDate: string
) => {
  if (!amount || !paymentDate) {
    throw new Error("Todos los campos son obligatorios");
  }

  if (amount <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  const existingPayment = await findPaymentById(id);

  if (!existingPayment) {
    throw new Error("Pago no encontrado");
  }

  return await updatePayment(
    id,
    amount,
    paymentDate
  );
};

export const deletePaymentService = async (id: number) => {
  const existingPayment = await findPaymentById(id);

  if (!existingPayment) {
    throw new Error("Pago no encontrado");
  }

  return await deletePayment(id);
};