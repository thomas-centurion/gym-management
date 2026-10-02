import {
  getPayments,
  getPaymentsByUserId,
  findPaymentById,
  processMembershipPayment,
} from "../repositories/payments.repository.js";

import {
  findMembershipById,
  findCurrentMembershipByUserId,
  findFutureMembershipByUserId,
} from "../repositories/memberships.repository.js";
import { calculateMembershipEndDate, firstDayOfMonth, firstDayAfterPeriod } from "../utils/membership-dates.js";

export const planPrices: Record<string, number> = {
  monthly: 10000,
  quarterly: 25000,
  annual: 90000,
};

// normaliza una fecha
const normalizeDate = (
  value: string | Date
): string => {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return String(value).split("T")[0];
};

// obtiene la fecha actual de Argentina
const getArgentinaDate = (): string => {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return `${year}-${month}-${day}`;
};

// obtiene todos los pagos
export const getPaymentsService = async () => {
  return await getPayments();
};

// obtiene los pagos de un socio
export const getPaymentsByUserIdService =
  async (userId: number) => {
    return await getPaymentsByUserId(userId);
  };

// obtiene el precio de un plan
export const getPlanPriceService = (
  plan: string
) => {
  const amount = planPrices[plan];

  if (!amount) {
    throw new Error(
      "El plan no es válido"
    );
  }

  return amount;
};

// crea un pago para una membresía
export const createPaymentService = async (
  userId: number,
  membershipId: number,
  plan: string
) => {
  if (!membershipId || !plan) {
    throw new Error(
      "Todos los campos son obligatorios"
    );
  }

  // sincroniza la membresía antes de procesar el pago
  await findCurrentMembershipByUserId(
    userId
  );

  const currentMembership =
    await findMembershipById(
      membershipId
    );

  if (!currentMembership) {
    throw new Error(
      "Membresía no encontrada"
    );
  }

  if (
    currentMembership.user_id !== userId
  ) {
    throw new Error(
      "No tienes permisos para pagar esta membresía"
    );
  }

  if (!currentMembership.is_current) {
    throw new Error(
      "Esta membresía no es la membresía actual"
    );
  }

  if (
    currentMembership.status === "active" &&
    currentMembership.plan !== plan
  ) {
    throw new Error(
      "Para cambiar de plan debes utilizar el cambio de plan"
    );
  }

  if (currentMembership.next_plan) {
    throw new Error(
      "Ya existe un cambio de plan pendiente"
    );
  }

  // evita crear más de una membresía futura
  if (
    currentMembership.status === "active"
  ) {
    const futureMembership =
      await findFutureMembershipByUserId(
        userId
      );

    if (futureMembership) {
      throw new Error(
        "Ya existe una membresía futura pendiente"
      );
    }
  }

  const amount =
    getPlanPriceService(plan);

  const today = getArgentinaDate();

  let startDate = firstDayOfMonth(today);
  let isCurrent = true;

  // si la membresía sigue activa, la renovación comienza al terminar el período actual
  if (
    currentMembership.status ===
    "active"
  ) {
    startDate = firstDayAfterPeriod(normalizeDate(currentMembership.end_date));

    isCurrent = false;
  }

  const endDate =
    calculateMembershipEndDate(
      startDate,
      plan
    );

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
export const getPaymentByIdService = async (
  id: number
) => {
  const payment =
    await findPaymentById(id);

  if (!payment) {
    throw new Error(
      "Pago no encontrado"
    );
  }

  return payment;
};
