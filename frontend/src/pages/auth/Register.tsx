import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { register } from "../../services/auth.service";
import AuthLayout from "../../components/AuthLayout";
import { isDemoMode } from "../../config/demo";

const Register = () => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDemoMode) return;
    setLoading(true); setError("");
    try { await register(form); setSuccess(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo crear la cuenta"); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout size="register" title="Crear cuenta de socio" description="El registro público crea una cuenta de socio.">
      {success ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-semibold">Tu cuenta fue creada.</p>
          <p className="mt-1">Ya podés iniciar sesión con tu email y contraseña.</p>
          <Link to="/login" className="mt-4 inline-block font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Ir a iniciar sesión</Link>
        </div>
      ) : (
        <form onSubmit={(event) => void handleSubmit(event)} aria-busy={loading} className="space-y-4">
          {isDemoMode && <p role="status" className="rounded-lg border border-slate-200 bg-slate-100 p-3 text-sm text-slate-600">El registro de cuentas está deshabilitado en esta demo de solo lectura.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">Nombre
              <input disabled={isDemoMode} required autoComplete="given-name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-60" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Apellido
              <input disabled={isDemoMode} required autoComplete="family-name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-60" />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">Email
            <input disabled={isDemoMode} required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-60" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Contraseña
            <input disabled={isDemoMode} required type="password" minLength={6} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-60" />
            <span className="mt-1 block text-xs font-normal text-slate-500">Mínimo 6 caracteres.</span>
          </label>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button type="submit" disabled={loading || isDemoMode} className="w-full cursor-pointer rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Creando cuenta…" : "Crear cuenta de socio"}</button>
          <p className="text-center text-sm text-slate-600">¿Ya tenés cuenta? <Link to="/login" className="font-semibold text-slate-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">Iniciá sesión</Link></p>
        </form>
      )}
    </AuthLayout>
  );
};

export default Register;
