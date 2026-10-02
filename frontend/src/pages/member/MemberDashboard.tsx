import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../context/useAuth";
import { createAttendance, getMyAttendances, type Attendance } from "../../services/attendance.service";
import { cancelMembership, changeMembershipPlan, getMyMembership, undoMembershipCancellation, type Membership } from "../../services/membership.service";
import { createSimulatedPayment, getMyPayments, type Payment } from "../../services/payment.service";
import { getMyProfile, updateMyProfile, type MemberProfile } from "../../services/user.service";
import { isDemoMode } from "../../config/demo";
import DemoReadOnlyNotice from "../../components/DemoReadOnlyNotice";

type Section = "inicio" | "membresia" | "pagos" | "asistencias" | "perfil";
const planLabels: Record<Membership["plan"], string> = { monthly: "Mensual", quarterly: "Trimestral", annual: "Anual" };
const money = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
const dateLabel = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, day)));
};
const todayInArgentina = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const navItems: { id: Section; label: string }[] = [
  { id: "inicio", label: "Inicio" }, { id: "membresia", label: "Mi membresía" }, { id: "pagos", label: "Mis pagos" }, { id: "asistencias", label: "Mis asistencias" }, { id: "perfil", label: "Mi perfil" },
];

const MemberDashboard = () => {
  const { user, token, logout, updateUser } = useAuth();
  const [section, setSection] = useState<Section>("inicio");
  const [membership, setMembership] = useState<Membership | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [paymentsError, setPaymentsError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [membershipError, setMembershipError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    if (!token || !user) return;
    setPageLoading(true);
    setPageError("");
    setPaymentsError("");
    setProfileError("");
    setMembershipError("");
    setAttendanceError("");
    const [memberResult, paymentsResult, attendanceResult, profileResult] = await Promise.allSettled([
      getMyMembership(token), getMyPayments(token), getMyAttendances(token), getMyProfile(token, user.id),
    ]);
    if (memberResult.status === "fulfilled") setMembership(memberResult.value);
    else if (memberResult.reason instanceof Error && memberResult.reason.message.includes("no tiene una membresía actual")) setMembership(null);
    else setMembershipError(memberResult.reason instanceof Error ? memberResult.reason.message : "No se pudo cargar la membresía");
    if (paymentsResult.status === "fulfilled") setPayments(paymentsResult.value);
    else setPaymentsError(paymentsResult.reason instanceof Error ? paymentsResult.reason.message : "No se pudo cargar el historial de pagos");
    if (attendanceResult.status === "fulfilled") setAttendances(attendanceResult.value);
    else setAttendanceError(attendanceResult.reason instanceof Error ? attendanceResult.reason.message : "No se pudo cargar el historial de asistencias");
    if (profileResult.status === "fulfilled") setProfile(profileResult.value);
    else setProfileError(profileResult.reason instanceof Error ? profileResult.reason.message : "No se pudo cargar el perfil");
    setPageLoading(false);
  }, [token, user]);

  useEffect(() => { void Promise.resolve().then(loadData); }, [loadData]);

  const runMembershipAction = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true); setMembershipError(""); setNotice("");
    try { await action(); setNotice(success); await loadData(); }
    catch (error) { setMembershipError(error instanceof Error ? error.message : "No se pudo actualizar la membresía"); }
    finally { setBusy(false); }
  };

  const handlePayment = async () => {
    if (!token || !membership) return;
    setBusy(true); setPageError(""); setNotice("");
    try {
      const result = await createSimulatedPayment(token, membership.id, membership.plan);
      setNotice(result.membership.is_current ? "Pago simulado registrado. Tu membresía está activa." : "Pago simulado registrado. La renovación quedó programada para el fin del período actual.");
      await loadData();
    }
    catch (error) { setPageError(error instanceof Error ? error.message : "No se pudo procesar el pago"); }
    finally { setBusy(false); }
  };

  const handleAttendance = async () => {
    if (!token) return;
    setBusy(true); setAttendanceError(""); setNotice("");
    try { await createAttendance(token, todayInArgentina()); setNotice("Asistencia registrada correctamente."); await loadData(); }
    catch (error) { setAttendanceError(error instanceof Error ? error.message : "No se pudo registrar la asistencia"); }
    finally { setBusy(false); }
  };

  const handleProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !user || !profile) return;
    setBusy(true); setPageError(""); setNotice("");
    try {
      const updated = await updateMyProfile(token, user.id, profile);
      setProfile(updated);
      updateUser({ firstName: updated.first_name, lastName: updated.last_name, email: updated.email });
      setNotice("Perfil actualizado correctamente.");
    } catch (error) { setPageError(error instanceof Error ? error.message : "No se pudo actualizar el perfil"); }
    finally { setBusy(false); }
  };

  const updateProfileField = (field: "first_name" | "last_name" | "email", value: string) => setProfile((current) => current ? { ...current, [field]: value } : current);
  const heading = navItems.find((item) => item.id === section)?.label;

  return (
    <div className="dashboard-shell min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4 sm:px-8">
          <div><p className="text-base font-black tracking-tight sm:text-lg">GYM MANAGEMENT</p><p className="text-xs text-slate-500">Sistema de gestión del gimnasio</p></div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-4"><div className="flex min-w-0 items-center gap-2"><div className="min-w-0 text-right"><span className="block max-w-[30vw] truncate text-sm text-slate-700 sm:max-w-none">{user?.firstName} {user?.lastName}</span><span className="text-xs text-slate-500">Socio</span></div><DemoReadOnlyNotice /></div><button type="button" onClick={logout} className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700">Salir</button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Navegación del socio" className="flex max-w-full gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {navItems.map((item) => <button key={item.id} type="button" aria-current={section === item.id ? "page" : undefined} onClick={() => { setSection(item.id); setNotice(""); }} className={`shrink-0 cursor-pointer rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 ${section === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white"}`}>{item.label}</button>)}
        </nav>
        <main className="min-w-0">
          <div className="mb-6"><p className="text-sm font-semibold text-emerald-700">PANEL DEL SOCIO</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{section === "inicio" ? `Hola, ${user?.name?.split(" ")[0] ?? "socio"}` : heading}</h1><p className="mt-2 text-slate-500">{section === "inicio" ? "Resumen de tu membresía y actividad." : `Consultá y gestioná ${heading?.toLowerCase()} desde tu cuenta.`}</p></div>
          {pageError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{pageError}</div>}
          {notice && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}
          {pageLoading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500" role="status">Cargando tus datos…</div> : (
            <>
              {(section === "inicio" || section === "membresia") && <section className="space-y-5">
                {membershipError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{membershipError}</div>}
                {!membership ? <article className="rounded-2xl border border-slate-200 bg-white p-7"><h2 className="text-xl font-bold">{membershipError ? "No se pudo cargar la membresía" : "Todavía no tenés una membresía actual"}</h2><p className="mt-2 text-slate-500">{membershipError ? "Intentá cargar la página nuevamente." : "Consultá en recepción para activar tu primera membresía."}</p></article> : <>
                  <article className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8"><div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm text-slate-300">PLAN ACTUAL</p><h2 className="mt-2 text-3xl font-bold">{planLabels[membership.plan]}</h2><p className="mt-3 text-sm text-slate-300">Vigente del {dateLabel(membership.start_date)} al {dateLabel(membership.end_date)}</p></div><span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-sm font-semibold text-emerald-200">{membership.status === "active" ? "Activa" : "Pendiente"}</span></div>
                    {(membership.next_plan || membership.cancel_at_end) && <div className="mt-6 rounded-xl bg-white/10 p-4 text-sm">{membership.next_plan ? <>Cambio programado: <strong>{planLabels[membership.next_plan]}</strong> desde {dateLabel(membership.end_date)}.</> : "La membresía finalizará al terminar el período actual."}</div>}
                    <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => setSection("membresia")} className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-900">Gestionar membresía</button><button type="button" onClick={() => setSection("pagos")} className="rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Ver pagos</button></div>
                  </article>
                  {section === "membresia" && <div className="grid gap-5 xl:grid-cols-2">
                    <article className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="text-lg font-bold">Cambiar de plan</h3><p className="mt-1 text-sm text-slate-500">El nuevo plan comienza al finalizar tu período actual. El pago se registra como una operación simulada.</p><div className="mt-4 grid gap-3">{(Object.keys(planLabels) as Membership["plan"][]).filter((plan) => plan !== membership.plan).map((plan) => <button key={plan} type="button" disabled={isDemoMode || busy || membership.status !== "active" || Boolean(membership.next_plan) || membership.cancel_at_end} onClick={() => void runMembershipAction(() => changeMembershipPlan(token!, membership.id, plan), `Cambio a plan ${planLabels[plan]} programado correctamente.`)} className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"><span className="font-semibold">{planLabels[plan]}</span><span className="text-sm font-medium text-slate-600">Solicitar cambio →</span></button>)}</div>{(membership.status !== "active" || membership.next_plan || membership.cancel_at_end) && <p className="mt-3 text-xs text-slate-500">No se puede cambiar el plan mientras haya un cambio pendiente, una cancelación o la membresía no esté activa.</p>}</article>
                    <article className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="text-lg font-bold">Fin de membresía</h3><p className="mt-2 text-sm text-slate-500">Podés cancelar al finalizar el período y seguir usando tu membresía hasta esa fecha.</p>{membership.cancel_at_end ? <button type="button" disabled={isDemoMode || busy} onClick={() => void runMembershipAction(() => undoMembershipCancellation(token!, membership.id), "Cancelación deshecha. Tu membresía continúa activa.")} className="mt-5 cursor-pointer rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Deshacer cancelación</button> : <button type="button" disabled={isDemoMode || busy || membership.status !== "active"} onClick={() => void runMembershipAction(() => cancelMembership(token!, membership.id), "Cancelación programada para el fin del período.")} className="mt-5 cursor-pointer rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">Cancelar al finalizar</button>}{membership.next_plan && <p className="mt-4 text-sm text-amber-700">Tenés un cambio pendiente al plan {planLabels[membership.next_plan]}.</p>}</article>
                  </div>}
                </>}
                {section === "inicio" && <div className="grid gap-4 sm:grid-cols-2"><button type="button" onClick={() => setSection("asistencias")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left hover:border-emerald-400"><p className="text-sm text-slate-500">ASISTENCIAS REGISTRADAS</p><p className="mt-2 text-3xl font-bold">{attendanceError ? "—" : attendances.length}</p><p className="mt-2 text-sm font-semibold text-emerald-700">Ver historial →</p></button><button type="button" onClick={() => setSection("pagos")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left hover:border-emerald-400"><p className="text-sm text-slate-500">PAGOS REGISTRADOS</p><p className="mt-2 text-3xl font-bold">{paymentsError ? "—" : payments.length}</p><p className="mt-2 text-sm font-semibold text-emerald-700">Ver historial →</p></button></div>}
              </section>}
              {section === "pagos" && <section className="space-y-5"><article className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Renovar membresía</h2><p className="mt-1 text-sm text-slate-500">Operación simulada: no se realiza ningún cobro real.</p>{membershipError && <p role="alert" className="mt-2 text-sm text-red-700">{membershipError}</p>}</div><button type="button" disabled={isDemoMode || busy || !membership || Boolean(membership?.next_plan)} onClick={() => void handlePayment()} className="cursor-pointer rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Procesando…" : "Registrar renovación simulada"}</button></div>{!membership && !membershipError && <p className="mt-3 text-sm text-slate-500">Necesitás una membresía actual para iniciar una renovación.</p>}{membership?.next_plan && <p className="mt-3 text-sm text-amber-700">Ya hay un cambio de plan programado; no se puede registrar otra renovación hasta que se resuelva.</p>}</article><article className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-6"><h2 className="text-lg font-bold">Historial de pagos</h2></div>{paymentsError && <p role="alert" className="p-4 text-sm text-red-700">{paymentsError}</p>}{payments.length === 0 && !paymentsError ? <p className="p-6 text-sm text-slate-500">Todavía no hay pagos registrados.</p> : <div className="divide-y divide-slate-100">{payments.map((payment) => <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-semibold">Pago #{payment.id}</p><p className="mt-1 text-sm text-slate-500">Membresía #{payment.membership_id} · {dateLabel(String(payment.payment_date).slice(0, 10))}</p></div><p className="font-bold">{money(Number(payment.amount))}</p></div>)}</div>}</article></section>}
              {section === "asistencias" && <section className="space-y-5"><article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6"><div><h2 className="text-lg font-bold">Tu actividad</h2><p className="mt-1 text-sm text-slate-500">Registrá tu visita de hoy. El backend valida membresía y fecha.</p></div><button type="button" disabled={isDemoMode || busy} onClick={() => void handleAttendance()} className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Registrando…" : "Registrar asistencia de hoy"}</button></article>{attendanceError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{attendanceError}</div>}<article className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-6"><h2 className="text-lg font-bold">Historial de asistencias</h2></div>{attendances.length === 0 && !attendanceError ? <p className="p-6 text-sm text-slate-500">Todavía no tenés asistencias registradas.</p> : <div className="divide-y divide-slate-100">{attendances.map((attendance) => <div key={attendance.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 p-5"><span className="font-medium">{dateLabel(attendance.attendance_date)}</span><span className="text-sm text-slate-500">Visita #{attendance.id}</span></div>)}</div>}</article></section>}
              {section === "perfil" && <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-lg font-bold">Datos personales</h2><p className="mt-1 text-sm text-slate-500">Actualizá los datos asociados a tu cuenta.</p>{profileError && <p role="alert" className="mt-4 text-sm text-red-700">{profileError}</p>}{profile ? <form onSubmit={(event) => void handleProfile(event)} className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Nombre<input disabled={isDemoMode} required value={profile.first_name} onChange={(event) => updateProfileField("first_name", event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60" /></label><label className="text-sm font-medium">Apellido<input disabled={isDemoMode} required value={profile.last_name} onChange={(event) => updateProfileField("last_name", event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60" /></label><label className="text-sm font-medium sm:col-span-2">Email<input disabled={isDemoMode} required type="email" value={profile.email} onChange={(event) => updateProfileField("email", event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60" /></label><div className="sm:col-span-2"><button disabled={isDemoMode || busy} className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Guardando…" : "Guardar cambios"}</button></div></form> : !profileError ? <p className="mt-5 text-sm text-slate-500">Cargando perfil…</p> : null}</article>}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MemberDashboard;
