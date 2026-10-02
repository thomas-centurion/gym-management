import { apiRequest } from "./api.service";
import type { Payment } from "./payment.service";

export interface Membership {
  id: number;
  user_id: number | null;
  plan: "monthly" | "quarterly" | "annual";
  start_date: string;
  end_date: string;
  status: "active" | "pending";
  next_plan: "monthly" | "quarterly" | "annual" | null;
  cancel_at_end: boolean;
  is_current: boolean;
}

export const getMyMembership = (token: string): Promise<Membership> =>
  apiRequest<Membership>("/memberships/my-membership", { token });

export const changeMembershipPlan = (token: string, id: number, plan: Membership["plan"]) =>
  apiRequest<{ payment: Payment; membership: Membership; currentMembership: Membership }>(`/memberships/${id}/change-plan`, { token, method: "POST", body: { plan } });

export const cancelMembership = (token: string, id: number) =>
  apiRequest<{ membership: Membership; futureMembership?: Membership }>(`/memberships/${id}/cancel`, { token, method: "POST" });

export const undoMembershipCancellation = (token: string, id: number) =>
  apiRequest<{ membership: Membership; futureMembership?: Membership }>(`/memberships/${id}/undo-cancel`, { token, method: "POST" });

export const getMemberships = (token: string) => apiRequest<Membership[]>("/memberships", { token });
export const createMembership = (token: string, data: { userId: number; plan: Membership["plan"]; startDate: string; status: Membership["status"] }) => apiRequest<Membership>("/memberships", { token, method: "POST", body: data });
export const updateMembership = (token: string, id: number, data: { plan: Membership["plan"]; startDate: string; status: Membership["status"] }) => apiRequest<Membership>(`/memberships/${id}`, { token, method: "PUT", body: data });
export const deleteMembership = (token: string, id: number) => apiRequest<{ message: string }>(`/memberships/${id}`, { token, method: "DELETE" });
