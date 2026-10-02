import { apiRequest } from "./api.service";

export interface Payment {
  id: number;
  membership_id: number;
  amount: number;
  payment_date: string;
}

export const getMyPayments = (token: string) => apiRequest<Payment[]>("/payments/my-payments", { token });

export const getAllPayments = (token: string) => apiRequest<Payment[]>("/payments", { token });

export const createSimulatedPayment = (token: string, membershipId: number, plan: string) =>
  apiRequest<{ payment: Payment; membership: { id: number; is_current: boolean } }>("/payments", {
    token,
    method: "POST",
    body: { membershipId, plan },
  });
