import { demoReadOnlyMessage, isDemoMode } from "../config/demo";

const getApiUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

  if (!apiUrl) {
    throw new Error("La URL del servidor no está configurada.");
  }

  return apiUrl;
};

interface ApiOptions {
  token?: string;
  method?: string;
  body?: unknown;
}

export const apiRequest = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
  const method = (options.method ?? "GET").toUpperCase();
  const isReadOnlyMethod = ["GET", "HEAD", "OPTIONS"].includes(method);
  const isLogin = method === "POST" && path.split("?", 1)[0] === "/auth/login";
  if (isDemoMode && !isReadOnlyMethod && !isLogin) {
    throw new Error(demoReadOnlyMessage);
  }

  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const apiUrl = getApiUrl();

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente.");
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    const payload = typeof result === "object" && result !== null ? result as Record<string, unknown> : {};
    const message = typeof payload.error === "string" ? payload.error : typeof payload.message === "string" ? payload.message : undefined;
    if (message === "JWT_SECRET no está configurado") {
      throw new Error("No se pudo validar la sesión. Intentá nuevamente más tarde.");
    }
    throw new Error(message ?? "No se pudo completar la operación. Intentá nuevamente.");
  }

  return result as T;
};
