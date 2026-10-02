import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/useAuth";
import AuthLayout from "../../components/AuthLayout";
import { isDemoMode } from "../../config/demo";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const authenticate = async (credentials: Parameters<typeof login>[0]) => {
    setError("");
    setIsLoading(true);

    try {
      const user = await login(credentials);

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/member");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al iniciar sesión",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void authenticate({ email, password });
  };

  return (
    <AuthLayout
      title="Acceder al sistema"
      description={isDemoMode ? "Explorá la demo con una cuenta de administrador o socio." : "Ingresá con tu email y contraseña para continuar."}
    >
      {isDemoMode ? (
        <section aria-labelledby="demo-access-title" aria-busy={isLoading}>
          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void authenticate({ email: "demo-admin@gym.com", password: "DemoAdmin2026!" })}
              className="w-full cursor-pointer rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Ingresando…" : "Entrar como administrador"}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => void authenticate({ email: "sofia.demo@gym.com", password: "DemoSocio1-2026!" })}
              className="w-full cursor-pointer rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Ingresando…" : "Entrar como socio"}
            </button>
          </div>
        </section>
      ) : (
        <form onSubmit={handleSubmit} aria-busy={isLoading} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default Login;
