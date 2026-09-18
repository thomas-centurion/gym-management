import {
  getAttendances,
  getAttendancesByUserId,
  findAttendanceById,
  createAttendance,
  deleteAttendance,
} from "../repositories/attendances.repository.js";

import { findCurrentMembershipByUserId } from "../repositories/memberships.repository.js";

// obtiene todas las asistencias
export const getAttendancesService = async () => {
  return await getAttendances();
};

// obtiene las asistencias de un socio
export const getAttendancesByUserIdService = async (
  userId: number
) => {
  return await getAttendancesByUserId(userId);
};

// obtiene una asistencia por su ID
export const getAttendanceByIdService = async (
  id: number
) => {
  const attendance = await findAttendanceById(id);

  if (!attendance) {
    throw new Error("Asistencia no encontrada");
  }

  return attendance;
};

// obtiene una asistencia verificando que pertenezca al usuario
export const getAttendanceByIdForUserService = async (
  id: number,
  userId: number
) => {
  const attendance = await findAttendanceById(id);

  if (!attendance) {
    throw new Error("Asistencia no encontrada");
  }

  if (attendance.user_id !== userId) {
    throw new Error(
      "No tienes permisos para acceder a esta asistencia"
    );
  }

  return attendance;
};

// valida que una fecha tenga el formato YYYY-MM-DD
const isValidDateFormat = (date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(
    `${date}T00:00:00Z`
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return parsedDate.toISOString().startsWith(date);
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

// registra una asistencia de un socio
export const createAttendanceService = async (
  userId: number,
  attendanceDate: string,
  isAdmin = false
) => {
  if (!attendanceDate) {
    throw new Error("La fecha es obligatoria");
  }

  if (!isValidDateFormat(attendanceDate)) {
    throw new Error(
      "La fecha debe tener el formato YYYY-MM-DD"
    );
  }

  const today = getArgentinaDate();

  // los socios solamente pueden registrar asistencias del día actual
  if (!isAdmin && attendanceDate !== today) {
    throw new Error(
      "Los socios solamente pueden registrar la asistencia del día actual"
    );
  }

  // los administradores pueden cargar asistencias históricas
  if (isAdmin && attendanceDate > today) {
    throw new Error(
      "No se pueden registrar asistencias futuras"
    );
  }

  const membership =
    await findCurrentMembershipByUserId(userId);

  if (!membership) {
    throw new Error(
      "El socio no tiene una membresía"
    );
  }

  // los socios necesitan una membresía activa
  if (!isAdmin && membership.status !== "active") {
    throw new Error(
      "El socio no tiene una membresía activa"
    );
  }

  return await createAttendance(
    userId,
    attendanceDate
  );
};

// elimina una asistencia
export const deleteAttendanceService = async (
  id: number
) => {
  const attendance = await findAttendanceById(id);

  if (!attendance) {
    throw new Error("Asistencia no encontrada");
  }

  return await deleteAttendance(id);
};