import { apiRequest } from "./api.service";

export interface Attendance {
  id: number;
  user_id: number;
  attendance_date: string;
}

export const getMyAttendances = (token: string): Promise<Attendance[]> =>
  apiRequest<Attendance[]>("/attendances/my-attendances", { token });

export const createAttendance = (token: string, attendanceDate: string) =>
  apiRequest<Attendance>("/attendances", { token, method: "POST", body: { attendanceDate } });

export const getAttendances = (token: string): Promise<Attendance[]> => apiRequest<Attendance[]>("/attendances", { token });

export const createAttendanceForMember = (token: string, userId: number, attendanceDate: string) =>
  apiRequest<Attendance>("/attendances/admin", { token, method: "POST", body: { userId, attendanceDate } });

export const deleteAttendance = (token: string, id: number) =>
  apiRequest<{ message: string; attendance: Attendance }>(`/attendances/${id}`, { token, method: "DELETE" });
