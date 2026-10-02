import type { ReactNode } from "react";
import DemoReadOnlyNotice from "./DemoReadOnlyNotice";
import { isDemoMode } from "../config/demo";

interface AuthLayoutProps {
  title: string;
  description: string;
  size?: "login" | "register";
  children: ReactNode;
}

const AuthLayout = ({ title, description, size = "login", children }: AuthLayoutProps) => (
  <main className="auth-shell flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
    <section aria-labelledby="auth-title" className={`w-full ${size === "register" ? "max-w-lg" : "max-w-md"} rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8`}>
      <header className="mb-8">
        <p className="text-sm font-black tracking-[0.16em] text-slate-700">GYM MANAGEMENT</p>
        <p className="mt-1 text-xs text-slate-500">Sistema de gestión del gimnasio</p>
        {isDemoMode && <div className="mt-3 flex justify-center"><DemoReadOnlyNotice /></div>}
        <h1 id="auth-title" className={`mt-7 tracking-tight text-slate-900 ${size === "register" ? "text-3xl font-bold" : "text-2xl font-semibold sm:text-[30px]"}`}>{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </header>
      {children}
    </section>
  </main>
);

export default AuthLayout;
