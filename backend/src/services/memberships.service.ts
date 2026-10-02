import {
  getMemberships,
  deletePendingMembership,
  createMembership,
  findMembershipById,
  findCurrentMembershipByUserId,
  updateMembership,
  cancelMembership,
  undoMembershipCancellation,
} from "../repositories/memberships.repository.js";

import { processPlanChange } from "../repositories/payments.repository.js";
import { calculateMembershipEndDate, firstDayAfterPeriod, firstDayOfMonth, isValidDate } from "../utils/membership-dates.js";

const validPlans = [
  "monthly",
  "quarterly",
  "annual",
];

const planPrices: Record<string, number> = {
  monthly: 10000,
  quarterly: 25000,
  annual: 90000,
};

// obtiene la fecha actual de Argentina
const getArgentinaDate = (): string => {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Argentina/Buenos_Aires",
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

// obtiene todas las membresías
export const getMembershipsService = async () => {
  return await getMemberships();
};

// crea una nueva membresía
export const createMembershipService = async (
  userId: number,
  plan: string,
  startDate: string,
  status: string
) => {
  if (
    !userId ||
    !plan ||
    !startDate ||
    !status
  ) {
    throw new Error(
      "Todos los campos son obligatorios"
    );
  }

  if (!validPlans.includes(plan)) {
    throw new Error(
      "El plan no es válido"
    );
  }

  if (
    status !== "active" &&
    status !== "pending"
  ) {
    throw new Error(
      "El estado no es válido"
    );
  }

  if (!isValidDate(startDate)) throw new Error("La fecha de inicio no es válida");
  const calendarStartDate = firstDayOfMonth(startDate);
  const endDate = calculateMembershipEndDate(calendarStartDate, plan);

  const currentMembership =
    await findCurrentMembershipByUserId(
      userId
    );

  if (currentMembership) {
    throw new Error(
      "No se puede crear una nueva membresía porque el socio ya tiene una membresía actual"
    );
  }

  return await createMembership(
    userId,
    plan,
    calendarStartDate,
    endDate,
    status
  );
};

// obtiene una membresía por su ID
export const getMembershipByIdService = async (
  id: number
) => {
  const membership =
    await findMembershipById(id);

  if (!membership) {
    throw new Error(
      "Membresía no encontrada"
    );
  }

  return membership;
};

// obtiene la membresía actual de un socio
export const getCurrentMembershipService =
  async (userId: number) => {
    return await findCurrentMembershipByUserId(
      userId
    );
  };

// actualiza una membresía
export const updateMembershipService = async (
  id: number,
  plan: string,
  startDate: string,
  status: string
) => {
  if (
    !plan ||
    !startDate ||
    !status
  ) {
    throw new Error(
      "Todos los campos son obligatorios"
    );
  }

  const existingMembership =
    await findMembershipById(id);

  if (!existingMembership) {
    throw new Error(
      "Membresía no encontrada"
    );
  }

  if (!validPlans.includes(plan)) {
    throw new Error(
      "El plan no es válido"
    );
  }

  if (
    status !== "active" &&
    status !== "pending"
  ) {
    throw new Error(
      "El estado no es válido"
    );
  }

  if (!isValidDate(startDate)) throw new Error("La fecha de inicio no es válida");
  const calendarStartDate = firstDayOfMonth(startDate);
  const endDate = calculateMembershipEndDate(calendarStartDate, plan);

  return await updateMembership(
    id,
    plan,
    calendarStartDate,
    endDate,
    status,
    existingMembership.next_plan ?? null,
    existingMembership.cancel_at_end ?? false,
    existingMembership.is_current ?? true
  );
};

// solicita un cambio de plan
export const changeMembershipPlanService =
  async (
    userId: number,
    membershipId: number,
    newPlan: string
  ) => {
    if (!newPlan) {
      throw new Error(
        "El plan es obligatorio"
      );
    }

    if (!validPlans.includes(newPlan)) {
      throw new Error(
        "El plan no es válido"
      );
    }

    const membership =
      await findMembershipById(
        membershipId
      );

    if (!membership) {
      throw new Error(
        "Membresía no encontrada"
      );
    }

    if (membership.user_id !== userId) {
      throw new Error(
        "No tienes permisos para modificar esta membresía"
      );
    }

    if (membership.status !== "active") {
      throw new Error(
        "Solo puedes cambiar el plan de una membresía activa"
      );
    }

    if (!membership.is_current) {
      throw new Error(
        "Esta membresía no es la membresía actual"
      );
    }

    if (membership.next_plan) {
      throw new Error(
        "Ya existe un cambio de plan pendiente"
      );
    }

    if (membership.cancel_at_end) {
      throw new Error(
        "No puedes cambiar de plan mientras la membresía está cancelada"
      );
    }

    if (membership.plan === newPlan) {
      throw new Error(
        "El nuevo plan debe ser diferente al actual"
      );
    }

    const amount = planPrices[newPlan];

    const membershipEndDate = membership.end_date instanceof Date
      ? membership.end_date.toISOString().slice(0, 10)
      : String(membership.end_date).split("T")[0];
    const startDate = firstDayAfterPeriod(membershipEndDate);
    const endDate = calculateMembershipEndDate(startDate, newPlan);

    return await processPlanChange(
      userId,
      membershipId,
      newPlan,
      amount,
      startDate,
      endDate
    );
  };

// cancela una membresía al finalizar el período actual
export const cancelMembershipService =
  async (
    userId: number,
    membershipId: number
  ) => {
    const membership =
      await findMembershipById(
        membershipId
      );

    if (!membership) {
      throw new Error(
        "Membresía no encontrada"
      );
    }

    if (membership.user_id !== userId) {
      throw new Error(
        "No tienes permisos para modificar esta membresía"
      );
    }

    if (!membership.is_current) {
      throw new Error(
        "Esta membresía no es la membresía actual"
      );
    }

    if (membership.status !== "active") {
      throw new Error(
        "Solo puedes cancelar una membresía activa"
      );
    }

    if (membership.cancel_at_end) {
      throw new Error(
        "La membresía ya está cancelada"
      );
    }

    return await cancelMembership(
      userId,
      membershipId
    );
  };

// deshace la cancelación de una membresía
export const undoMembershipCancellationService =
  async (
    userId: number,
    membershipId: number
  ) => {
    const membership =
      await findMembershipById(
        membershipId
      );

    if (!membership) {
      throw new Error(
        "Membresía no encontrada"
      );
    }

    if (membership.user_id !== userId) {
      throw new Error(
        "No tienes permisos para modificar esta membresía"
      );
    }

    if (!membership.is_current) {
      throw new Error(
        "Esta membresía no es la membresía actual"
      );
    }

    if (membership.status !== "active") {
      throw new Error(
        "Solo puedes deshacer la cancelación de una membresía activa"
      );
    }

    if (!membership.cancel_at_end) {
      throw new Error(
        "La membresía no está cancelada"
      );
    }

    const today = getArgentinaDate();

    if (membership.end_date < today) {
      throw new Error(
        "La membresía ya finalizó y no se puede deshacer la cancelación"
      );
    }

    return await undoMembershipCancellation(
      userId,
      membershipId
    );
  };

// solo elimina membresías pendientes futuras que no formen parte del historial
export const deleteMembershipService = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Membresía no encontrada");
  }

  return deletePendingMembership(id, getArgentinaDate());
};
