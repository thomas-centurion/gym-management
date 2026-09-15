import {
  getAttendances,
  createAttendance,
  findAttendanceById,
  updateAttendance,
  deleteAttendance,
} from "../repositories/attendances.repository.js";

export const getAttendancesService = async () => {
  return await getAttendances();
};

export const createAttendanceService = async (
  userId: number,
  attendanceDate: string
) => {
  if (!userId || !attendanceDate) {
    throw new Error("Todos los campos son obligatorios");
  }

  return await createAttendance(
    userId,
    attendanceDate
  );
};

export const getAttendanceByIdService = async (
  id: number
) => {
  const attendance = await findAttendanceById(id);

  if (!attendance) {
    throw new Error("Asistencia no encontrada");
  }

  return attendance;
};

export const updateAttendanceService = async (
  id: number,
  attendanceDate: string
) => {
  if (!attendanceDate) {
    throw new Error("Todos los campos son obligatorios");
  }

  const existingAttendance = await findAttendanceById(id);

  if (!existingAttendance) {
    throw new Error("Asistencia no encontrada");
  }

  return await updateAttendance(
    id,
    attendanceDate
  );
};

export const deleteAttendanceService = async (
  id: number
) => {
  const existingAttendance = await findAttendanceById(id);

  if (!existingAttendance) {
    throw new Error("Asistencia no encontrada");
  }

  return await deleteAttendance(id);
};