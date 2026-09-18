import {
  getPayments,
  getPaymentsByUserId,
  findPaymentById,
  processMembershipPayment,
} from "../repositories/payments.repository.js";
import { findMembershipById } from "../repositories/memberships.repository.js";

const planPrices: Record<string, number> = {
  monthly: 10000,
  quarterly: 25000,
  annual: 90000,
};

// normaliza una fecha de PostgreSQL al formato YYYY-MM-DD
const normalizeDate = (value: string | Date): string => {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return String(value).split("T")[0];
};

// obtiene la fecha actual de argentina
const getArgentinaDate = (): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
};

// obtiene todos los pagos
export const getPaymentsService = async () => {
  return await getPayments();
};

// obtiene los pagos de un socio
export const getPaymentsByUserIdService = async (userId: number) => {
  return await getPaymentsByUserId(userId);
};

// obtiene el precio correspondiente a un plan
export const getPlanPrice = (plan: string) => {
  const price = planPrices[plan];

  if (!price) {
    throw new Error("El plan no es válido");
  }

  return price;
};

// registra un pago y genera la nueva etapa de membresia
export const createPaymentService = async (
  userId: number,
  membershipId: number,
  plan: string
) => {
  if (!membershipId || !plan) {
    throw new Error("Todos los campos son obligatorios");
  }

  const currentMembership = await findMembershipById(membershipId);

  if (!currentMembership) {
    throw new Error("Membresía no encontrada");
  }

  if (currentMembership.user_id !== userId) {
    throw new Error("No tienes permisos para pagar esta membresía");
  }

  if (currentMembership.status === "active") {
    if (currentMembership.plan !== plan) {
      throw new Error(
        "Para cambiar de plan debes utilizar el cambio de plan"
      );
    }
  }

  const amount = getPlanPrice(plan);

  const today = getArgentinaDate();

  let startDate = today;
  let isCurrent = true;

  // si la membresía actual sigue activa, la renovación empieza cuando termina
  if (currentMembership.status === "active") {
    startDate = normalizeDate(currentMembership.end_date);
    isCurrent = false;
  }

  const [year, month, day] = startDate
    .split("-")
    .map(Number);

  const end = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (plan === "monthly") {
    end.setUTCMonth(end.getUTCMonth() + 1);
  }

  if (plan === "quarterly") {
    end.setUTCMonth(end.getUTCMonth() + 3);
  }

  if (plan === "annual") {
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  }

  const endDate = end.toISOString().split("T")[0];

  return await processMembershipPayment(
    userId,
    membershipId,
    plan,
    amount,
    startDate,
    endDate,
    isCurrent
  );
};

// obtiene un pago por su ID
export const getPaymentByIdService = async (id: number) => {
  const payment = await findPaymentById(id);

  if (!payment) {
    throw new Error("Pago no encontrado");
  }

  return payment;
};