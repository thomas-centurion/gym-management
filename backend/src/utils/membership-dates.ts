const monthsByPlan = {
  monthly: 1,
  quarterly: 3,
  annual: 12,
} as const;

export type MembershipPlan = keyof typeof monthsByPlan;

export const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

export const firstDayOfMonth = (value: string): string => {
  if (!isValidDate(value)) throw new Error("La fecha de inicio no es válida");
  return `${value.slice(0, 7)}-01`;
};

export const calculateMembershipEndDate = (
  startDate: string,
  plan: string
): string => {
  if (!(plan in monthsByPlan)) throw new Error("El plan no es válido");
  const start = firstDayOfMonth(startDate);
  const [year, month] = start.split("-").map(Number);
  const end = new Date(Date.UTC(year, month - 1 + monthsByPlan[plan as MembershipPlan], 0));
  return end.toISOString().slice(0, 10);
};

export const firstDayAfterPeriod = (endDate: string): string => {
  if (!isValidDate(endDate)) throw new Error("La fecha de finalización de la membresía no es válida");
  const [year, month] = endDate.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 1));
  return `${nextMonth.toISOString().slice(0, 7)}-01`;
};
