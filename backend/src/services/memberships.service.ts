import {
  getMemberships,
  createMembership,
  findMembershipById,
  findCurrentMembershipByUserId,
  updateMembership,
  cancelMembership,
  undoMembershipCancellation,
} from "../repositories/memberships.repository.js";

import { processPlanChange } from "../repositories/payments.repository.js";

const validPlans = ["monthly", "quarterly", "annual"];

const planPrices: Record<string, number> = {
  monthly: 10000,
  quarterly: 25000,
  annual: 90000,
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
  endDate: string,
  status: string
) => {
  if (!userId || !plan || !startDate || !endDate || !status) {
    throw new Error("Todos los campos son obligatorios");
  }

  if (!validPlans.includes(plan)) {
    throw new Error("El plan no es válido");
  }

  if (status !== "active" && status !== "pending") {
    throw new Error("El estado no es válido");
  }

  if (new Date(endDate) <= new Date(startDate)) {
    throw new Error(
      "La fecha de finalización debe ser posterior a la fecha de inicio"
    );
  }

  return await createMembership(
    userId,
    plan,
    startDate,
    endDate,
    status
  );
};

// obtiene una membresía por su ID
export const getMembershipByIdService = async (id: number) => {
  const membership = await findMembershipById(id);

  if (!membership) {
    throw new Error("Membresía no encontrada");
  }

  return membership;
};

// obtiene la membresía actual de un socio
export const getCurrentMembershipService = async (userId: number) => {
  return await findCurrentMembershipByUserId(userId);
};

// actualiza una membresía
export const updateMembershipService = async (
  id: number,
  plan: string,
  startDate: string,
  endDate: string,
  status: string
) => {
  if (!plan || !startDate || !endDate || !status) {
    throw new Error("Todos los campos son obligatorios");
  }

  const existingMembership = await findMembershipById(id);

  if (!existingMembership) {
    throw new Error("Membresía no encontrada");
  }

  if (!validPlans.includes(plan)) {
    throw new Error("El plan no es válido");
  }

  if (status !== "active" && status !== "pending") {
    throw new Error("El estado no es válido");
  }

  if (new Date(endDate) <= new Date(startDate)) {
    throw new Error(
      "La fecha de finalización debe ser posterior a la fecha de inicio"
    );
  }

  return await updateMembership(
    id,
    plan,
    startDate,
    endDate,
    status,
    existingMembership.next_plan ?? null,
    existingMembership.cancel_at_end ?? false,
    existingMembership.is_current ?? true
  );
};

// solicita un cambio de plan
export const changeMembershipPlanService = async (
  userId: number,
  membershipId: number,
  newPlan: string
) => {
  if (!newPlan) {
    throw new Error("El plan es obligatorio");
  }

  if (!validPlans.includes(newPlan)) {
    throw new Error("El plan no es válido");
  }

  const membership = await findMembershipById(membershipId);

  if (!membership) {
    throw new Error("Membresía no encontrada");
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

  let startDate: string;

  // convierte la fecha de finalización a formato YYYY-MM-DD
  if (membership.end_date instanceof Date) {
    const year = membership.end_date.getUTCFullYear();
    const month = String(
      membership.end_date.getUTCMonth() + 1
    ).padStart(2, "0");
    const day = String(
      membership.end_date.getUTCDate()
    ).padStart(2, "0");

    startDate = `${year}-${month}-${day}`;
  } else {
    startDate = String(membership.end_date).split("T")[0];
  }

  const end = new Date(`${startDate}T00:00:00Z`);

  if (Number.isNaN(end.getTime())) {
    throw new Error(
      "La fecha de finalización de la membresía no es válida"
    );
  }

  if (newPlan === "monthly") {
    end.setUTCMonth(end.getUTCMonth() + 1);
  }

  if (newPlan === "quarterly") {
    end.setUTCMonth(end.getUTCMonth() + 3);
  }

  if (newPlan === "annual") {
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  }

  const endDate = end.toISOString().split("T")[0];

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
export const cancelMembershipService = async (
  userId: number,
  membershipId: number
) => {
  const membership = await findMembershipById(membershipId);

  if (!membership) {
    throw new Error("Membresía no encontrada");
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
export const undoMembershipCancellationService = async (
  userId: number,
  membershipId: number
) => {
  const membership = await findMembershipById(membershipId);

  if (!membership) {
    throw new Error("Membresía no encontrada");
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

  return await undoMembershipCancellation(
    userId,
    membershipId
  );
};

// las membresias no se eliminan para conservar el historial
export const deleteMembershipService = async (id: number) => {
  const existingMembership = await findMembershipById(id);

  if (!existingMembership) {
    throw new Error("Membresía no encontrada");
  }

  throw new Error(
    "Las membresías no se pueden eliminar porque forman parte del historial"
  );
};