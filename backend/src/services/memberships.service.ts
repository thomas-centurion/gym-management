import {
  getMemberships,
  createMembership,
  findMembershipById,
  updateMembership,
  deleteMembership,
} from "../repositories/memberships.repository.js";

export const getMembershipsService = async () => {
  return await getMemberships();
};

export const createMembershipService = async (
  userId: number,
  plan: string,
  startDate: string,
  endDate: string
) => {
  if (!userId || !plan || !startDate || !endDate) {
    throw new Error("Todos los campos son obligatorios");
  }

  return await createMembership(
    userId,
    plan,
    startDate,
    endDate
  );
};

export const getMembershipByIdService = async (id: number) => {
  const membership = await findMembershipById(id);

  if (!membership) {
    throw new Error("Membresía no encontrada");
  }

  return membership;
};

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

  if (status !== "active" && status !== "pending") {
    throw new Error("El estado no es válido");
  }

  return await updateMembership(
    id,
    plan,
    startDate,
    endDate,
    status
  );
};

export const deleteMembershipService = async (id: number) => {
  const existingMembership = await findMembershipById(id);

  if (!existingMembership) {
    throw new Error("Membresía no encontrada");
  }

  return await deleteMembership(id);
};