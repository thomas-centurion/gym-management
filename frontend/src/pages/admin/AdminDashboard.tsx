import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../context/useAuth";
import { createAttendanceForMember, deleteAttendance, getAttendances, type Attendance } from "../../services/attendance.service";
import { createMembership, deleteMembership, getMemberships, updateMembership, type Membership } from "../../services/membership.service";
import { getAllPayments, type Payment } from "../../services/payment.service";
import { createUser, deleteUser, getUsers, updateUser, type AdminUser } from "../../services/user.service";
import { isDemoMode } from "../../config/demo";
import DemoReadOnlyNotice from "../../components/DemoReadOnlyNotice";

type View = "overview" | "members" | "memberships" | "attendances" | "payments";
type MembershipSituation = "current" | "scheduled" | "pending";
const plans: Membership["plan"][] = ["monthly", "quarterly", "annual"];
const planLabel = (plan: Membership["plan"]) => ({ monthly: "Mensual", quarterly: "Trimestral", annual: "Anual" })[plan];
const dateLabel = (value: string) => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const previewEndDate = (month: string, plan: Membership["plan"]): string => {
  if (!/^\d{4}-\d{2}$/.test(month)) return "";
  const [year, monthNumber] = month.split("-").map(Number);
  const months = { monthly: 1, quarterly: 3, annual: 12 }[plan];
  return new Date(Date.UTC(year, monthNumber - 1 + months, 0)).toISOString().slice(0, 10);
};
const emptyMembershipForm = () => ({ userId: "", plan: "monthly" as Membership["plan"], startMonth: today().slice(0, 7), status: "active" as Membership["status"] });
const navigation: { id: View; text: string }[] = [{ id: "overview", text: "Resumen" }, { id: "members", text: "Socios" }, { id: "memberships", text: "Membresías" }, { id: "attendances", text: "Asistencias" }, { id: "payments", text: "Pagos" }];
const normalizeSearchText = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase("es-AR")
  .trim()
  .replace(/\s+/g, " ");
const getMembershipSituation = (membership: Membership, currentDate: string): MembershipSituation | null => {
  if (membership.status === "pending") return "pending";
  if (membership.is_current) return "current";
  if (membership.start_date.slice(0, 10) > currentDate) return "scheduled";
  return null;
};

const AdminDashboard = () => {
  const { token, user, logout } = useAuth();
  const [view, setView] = useState<View>("overview");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [failedResources, setFailedResources] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberForm, setMemberForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [membershipForm, setMembershipForm] = useState(emptyMembershipForm);
  const [membershipFormOpen, setMembershipFormOpen] = useState(false);
  const [membershipPlanFilter, setMembershipPlanFilter] = useState<"all" | Membership["plan"]>("all");
  const [membershipSituationFilter, setMembershipSituationFilter] = useState<"all" | MembershipSituation>("all");
  const [membershipSearch, setMembershipSearch] = useState("");
  const deferredMembershipSearch = useDeferredValue(membershipSearch);
  const [editingMembershipId, setEditingMembershipId] = useState<number | null>(null);
  const membershipFormRef = useRef<HTMLElement | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({ userId: "", attendanceDate: today() });

  const resetMembershipVisit = () => {
    setEditingMembershipId(null);
    setMembershipForm(emptyMembershipForm());
    setMembershipFormOpen(false);
  };

  const navigateToView = (nextView: View) => {
    if (view === "memberships" && nextView !== "memberships") resetMembershipVisit();
    setView(nextView);
    setNotice("");
  };

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError(""); setFailedResources([]);
    const results = await Promise.allSettled([getUsers(token), getMemberships(token), getAttendances(token), getAllPayments(token)]);
    const errors: string[] = [];
    if (results[0].status === "fulfilled") setUsers(results[0].value.filter((entry) => entry.role === "member")); else errors.push("socios");
    if (results[1].status === "fulfilled") setMemberships(results[1].value); else errors.push("membresías");
    if (results[2].status === "fulfilled") setAttendances(results[2].value); else errors.push("asistencias");
    if (results[3].status === "fulfilled") setPayments(results[3].value); else errors.push("pagos");
    setFailedResources(errors);
    if (errors.length) setError(`No se pudieron cargar: ${errors.join(", ")}. Intentá nuevamente.`);
    setLoading(false);
  }, [token]);
  useEffect(() => { void Promise.resolve().then(reload); }, [reload]);
  useEffect(() => {
    if (!membershipFormOpen) return;
    const frame = requestAnimationFrame(() => membershipFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [membershipFormOpen, editingMembershipId]);

  const perform = async (action: () => Promise<unknown>, success: string, onSuccess?: () => void): Promise<boolean> => {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(success); onSuccess?.(); await reload(); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo completar la operación"); return false; }
    finally { setBusy(false); }
  };

  const requestDeletePendingMembership = (membership: Membership) => {
    if (!token) return;

    const confirmed = window.confirm(
      `¿Eliminar la membresía pendiente #${membership.id} de ${memberName(membership.user_id)}? Solo se podrá eliminar si todavía no comenzó y no tiene pagos asociados. Esta acción elimina la membresía; no cancela su edición ni programa una cancelación de período.`
    );

    if (!confirmed) return;

    void perform(
      () => deleteMembership(token, membership.id),
      `Membresía pendiente #${membership.id} eliminada.`,
      () => {
        setMemberships((current) => current.filter((entry) => entry.id !== membership.id));
        if (editingMembershipId === membership.id) resetMembershipVisit();
      }
    );
  };

  const submitMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!token) return;
    const data = { firstName: memberForm.firstName, lastName: memberForm.lastName, email: memberForm.email };
    const saved = await perform(() => editingMemberId ? updateUser(token, editingMemberId, data) : createUser(token, { ...data, password: memberForm.password }), editingMemberId ? "Socio actualizado." : "Socio creado.");
    if (saved) { setMemberForm({ firstName: "", lastName: "", email: "", password: "" }); setEditingMemberId(null); }
  };

  const submitMembership = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!token) return;
    const body = { plan: membershipForm.plan, startDate: `${membershipForm.startMonth}-01`, status: membershipForm.status };
    const saved = await perform(() => editingMembershipId ? updateMembership(token, editingMembershipId, body) : createMembership(token, { ...body, userId: Number(membershipForm.userId) }), editingMembershipId ? "Membresía actualizada." : "Membresía creada.");
    if (saved) {
      setEditingMembershipId(null);
      setMembershipForm(emptyMembershipForm());
      setMembershipFormOpen(false);
    }
  };

  const submitAttendance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!token) return;
    await perform(() => createAttendanceForMember(token, Number(attendanceForm.userId), attendanceForm.attendanceDate), "Asistencia registrada.");
  };

  const beginEditMember = (member: AdminUser) => {
    setSelectedMemberId(member.id); setEditingMemberId(member.id);
    setMemberForm({ firstName: member.first_name, lastName: member.last_name, email: member.email, password: "" });
    navigateToView("members");
  };
  const beginCreateMembership = () => {
    setEditingMembershipId(null);
    setMembershipForm(emptyMembershipForm());
    setMembershipFormOpen(true);
  };
  const usersById = useMemo(() => new Map(users.map((member) => [member.id, member] as const)), [users]);
  const memberName = (id: number | null) => {
    if (id === null) return "Usuario eliminado";
    const member = usersById.get(id);
    return member ? `${member.first_name} ${member.last_name}` : "Usuario no disponible";
  };
  const activeMembershipCount = memberships.filter((membership) => membership.is_current && membership.status === "active").length;
  const memberSearchTextById = useMemo(() => new Map(users.map((member) => [
    member.id,
    normalizeSearchText(`${member.first_name} ${member.last_name} ${member.email}`),
  ] as const)), [users]);
  const normalizedMembershipSearch = normalizeSearchText(deferredMembershipSearch);
  const membershipSearchTerms = useMemo(() => normalizedMembershipSearch.split(" ").filter(Boolean), [normalizedMembershipSearch]);
  const currentDate = today();
  const filteredMemberships = useMemo(() => memberships.filter((membership) => {
    const situation = getMembershipSituation(membership, currentDate);
    if (!situation) return false;
    if (membershipPlanFilter !== "all" && membership.plan !== membershipPlanFilter) return false;
    if (membershipSituationFilter !== "all" && situation !== membershipSituationFilter) return false;
    if (!membershipSearchTerms.length) return true;

    const memberText = memberSearchTextById.get(membership.user_id ?? -1);
    return Boolean(memberText && membershipSearchTerms.every((term) => memberText.includes(term)));
  }), [memberships, membershipPlanFilter, membershipSituationFilter, membershipSearchTerms, memberSearchTextById, currentDate]);
  const filteredCurrentMemberships = filteredMemberships.filter((membership) => getMembershipSituation(membership, currentDate) === "current");
  const filteredScheduledMemberships = filteredMemberships.filter((membership) => getMembershipSituation(membership, currentDate) === "scheduled");
  const filteredPendingMemberships = filteredMemberships.filter((membership) => getMembershipSituation(membership, currentDate) === "pending");
  const membershipCountLabel = `${filteredMemberships.length} membresía${filteredMemberships.length === 1 ? "" : "s"}${membershipPlanFilter !== "all" ? ` ${filteredMemberships.length === 1 ? ({ monthly: "mensual", quarterly: "trimestral", annual: "anual" })[membershipPlanFilter] : ({ monthly: "mensuales", quarterly: "trimestrales", annual: "anuales" })[membershipPlanFilter]}` : ""}${membershipSituationFilter !== "all" ? ` ${filteredMemberships.length === 1 ? ({ current: "vigente", scheduled: "programada", pending: "pendiente" })[membershipSituationFilter] : ({ current: "vigentes", scheduled: "programadas", pending: "pendientes" })[membershipSituationFilter]}` : ""}`;
  const displayedCount = (resource: string, value: number) => failedResources.includes(resource) ? "—" : value;

  return <div className="dashboard-shell min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-4 sm:px-8">
        <div className="min-w-0">
          <p className="text-base font-black tracking-tight sm:text-lg">GYM MANAGEMENT</p>
          <p className="text-xs text-slate-500">Sistema de gestión del gimnasio</p>
        </div>

        {isDemoMode ? (
          <div className="justify-self-center"><DemoReadOnlyNotice /></div>) : (<div />)}

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-4">
          <div className="min-w-0 text-right">
            <span className="block max-w-[32vw] truncate text-sm text-slate-700 sm:max-w-none">{user?.firstName} {user?.lastName}</span>
            <span className="text-xs text-slate-500">Administrador</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
    <div className="mx-auto grid max-w-7xl gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[220px_1fr]">
      <div className="lg:hidden">
        <button type="button" aria-expanded={mobileNavigationOpen} aria-controls="admin-mobile-navigation" onClick={() => setMobileNavigationOpen((open) => !open)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700">
          Menú{mobileNavigationOpen ? " −" : " +"}
        </button>
        <nav id="admin-mobile-navigation" aria-label="Navegación administrativa" className={`${mobileNavigationOpen ? "mt-2 grid" : "hidden"} gap-2 rounded-xl border border-slate-200 bg-white p-2`}>
          {navigation.map((item) => <button key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => { navigateToView(item.id); setMobileNavigationOpen(false); }} className={`cursor-pointer rounded-lg px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 ${view === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{item.text}</button>)}
        </nav>
      </div>
      <nav aria-label="Navegación administrativa" className="hidden max-w-full gap-2 pb-1 lg:flex lg:flex-col lg:overflow-visible">{navigation.map((item) => <button key={item.id} type="button" aria-current={view === item.id ? "page" : undefined} onClick={() => navigateToView(item.id)} className={`shrink-0 cursor-pointer rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 ${view === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white"}`}>{item.text}</button>)}</nav>
      <main className="min-w-0"><div className="mb-6"><p className="text-sm font-semibold text-emerald-700">PANEL DE ADMINISTRACIÓN</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{navigation.find((item) => item.id === view)?.text}</h1><p className="mt-2 text-slate-500">Consulta y gestión de los datos del gimnasio.</p></div>
        {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<button onClick={() => void reload()} className="ml-2 font-bold underline">Reintentar</button></div>}{notice && <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}
        {loading ? <div role="status" className="rounded-2xl border bg-white p-8 text-slate-500">Cargando información…</div> : <>
          {view === "overview" && <section><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Socios", displayedCount("socios", users.length)], ["Membresías activas", displayedCount("membresías", activeMembershipCount)], ["Asistencias", displayedCount("asistencias", attendances.length)], ["Pagos", displayedCount("pagos", payments.length)]].map(([label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p></article>)}</div><article className="mt-5 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold">Actividad reciente</h2><p className="mt-1 text-sm text-slate-500">Últimas asistencias registradas</p>{attendances.length ? <div className="mt-4 divide-y divide-slate-100">{attendances.slice(0, 5).map((entry) => <div key={entry.id} className="flex justify-between gap-4 py-3 text-sm"><span>{memberName(entry.user_id)}</span><span className="text-slate-500">{dateLabel(entry.attendance_date)}</span></div>)}</div> : !failedResources.includes("asistencias") ? <p className="mt-4 text-sm text-slate-500">Todavía no hay asistencias.</p> : null}</article></section>}

          {view === "members" && <section className="space-y-5">{isDemoMode && <p role="status" className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">Las acciones de creación, edición y eliminación están deshabilitadas en esta demo.</p>}<article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold">{editingMemberId ? "Editar socio" : "Crear socio"}</h2><form onSubmit={(event) => void submitMember(event)} className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Nombre<input disabled={isDemoMode} required value={memberForm.firstName} onChange={(event) => setMemberForm({ ...memberForm, firstName: event.target.value })} className="mt-1.5 w-full rounded-lg border p-2.5 disabled:cursor-not-allowed disabled:opacity-60" /></label><label className="text-sm font-medium">Apellido<input disabled={isDemoMode} required value={memberForm.lastName} onChange={(event) => setMemberForm({ ...memberForm, lastName: event.target.value })} className="mt-1.5 w-full rounded-lg border p-2.5 disabled:cursor-not-allowed disabled:opacity-60" /></label><label className="text-sm font-medium sm:col-span-2">Email<input disabled={isDemoMode} required type="email" value={memberForm.email} onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })} className="mt-1.5 w-full rounded-lg border p-2.5 disabled:cursor-not-allowed disabled:opacity-60" /></label>{!editingMemberId && <label className="text-sm font-medium sm:col-span-2">Contraseña inicial<input disabled={isDemoMode} required minLength={6} type="password" value={memberForm.password} onChange={(event) => setMemberForm({ ...memberForm, password: event.target.value })} className="mt-1.5 w-full rounded-lg border p-2.5 disabled:cursor-not-allowed disabled:opacity-60" /><span className="mt-1 block text-xs text-slate-500">Mínimo 6 caracteres.</span></label>}<div className="flex gap-3 sm:col-span-2"><button disabled={busy || isDemoMode} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Guardando…" : editingMemberId ? "Guardar socio" : "Crear socio"}</button>{editingMemberId && <button type="button" disabled={isDemoMode} onClick={() => { setEditingMemberId(null); setMemberForm({ firstName: "", lastName: "", email: "", password: "" }); }} className="rounded-lg border px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">Cancelar edición</button>}</div></form></article>
            <article className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Socio</th><th className="p-4">Email</th><th className="p-4">Membresía actual</th><th className="p-4">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((member) => { const current = memberships.find((entry) => entry.user_id === member.id && entry.is_current); return <tr key={member.id}><td className="p-4 font-semibold">{member.first_name} {member.last_name}</td><td className="p-4 text-slate-600">{member.email}</td><td className="p-4">{current ? `${planLabel(current.plan)} · ${current.status === "active" ? "Activa" : "Pendiente"}` : "Sin actual"}</td><td className="p-4"><div className="flex gap-2"><button onClick={() => { setSelectedMemberId((current) => current === member.id ? null : member.id); setNotice(""); }} aria-expanded={selectedMemberId === member.id} aria-controls={selectedMemberId === member.id ? "selected-member-details" : undefined} className={`cursor-pointer font-semibold ${selectedMemberId === member.id ? "text-emerald-900 underline" : "text-emerald-700"}`}>Detalle</button><button disabled={isDemoMode} onClick={() => beginEditMember(member)} className="font-semibold disabled:cursor-not-allowed disabled:opacity-50">Editar</button><button disabled={busy || isDemoMode} onClick={() => { if (window.confirm(`¿Eliminar a ${member.first_name} ${member.last_name}?`)) void perform(() => deleteUser(token!, member.id), "Socio eliminado.", () => { if (selectedMemberId === member.id) setSelectedMemberId(null); }); }} className="font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Eliminar</button></div></td></tr>; })}</tbody></table>{users.length === 0 && !failedResources.includes("socios") && <p className="p-5 text-sm text-slate-500">No hay socios registrados.</p>}</article>
            {selectedMemberId && <article id="selected-member-details" className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6"><div className="flex justify-between"><div><h2 className="font-bold">Detalle: {memberName(selectedMemberId)}</h2><p className="mt-1 text-sm text-slate-500">Historial disponible según membresías y pagos registrados.</p></div><button onClick={() => setSelectedMemberId(null)} className="text-sm font-semibold">Cerrar</button></div><h3 className="mt-5 text-sm font-bold">Membresías</h3>{memberships.filter((entry) => entry.user_id === selectedMemberId).length ? <div className="mt-2 space-y-2">{memberships.filter((entry) => entry.user_id === selectedMemberId).map((entry) => <div key={entry.id} className="rounded-lg border bg-white p-3 text-sm">{planLabel(entry.plan)} · {dateLabel(entry.start_date)} — {dateLabel(entry.end_date)} · {entry.is_current ? "Actual" : "Histórica"}</div>)}</div> : <p className="mt-2 text-sm text-slate-500">{failedResources.includes("membresías") ? "No se pudo cargar el historial." : "Sin membresías."}</p>}<h3 className="mt-4 text-sm font-bold">Asistencias</h3><p className="mt-2 text-sm text-slate-600">{failedResources.includes("asistencias") ? "No se pudo cargar el historial." : String(attendances.filter((entry) => entry.user_id === selectedMemberId).length) + " registradas"}</p><h3 className="mt-4 text-sm font-bold">Pagos</h3><p className="mt-2 text-sm text-slate-600">{failedResources.includes("pagos") ? "No se pudo cargar el historial." : String(payments.filter((payment) => memberships.some((entry) => entry.user_id === selectedMemberId && entry.id === payment.membership_id)).length) + " registrados"}</p></article>}</section>}

          {view === "memberships" && <section className="space-y-5"><article ref={membershipFormRef} className={`${membershipFormOpen ? "" : "hidden"} rounded-2xl border border-slate-200 bg-white p-6`}><h2 className="font-bold">{editingMembershipId ? `Editar membresía #${editingMembershipId}` : "Crear membresía"}</h2><form onSubmit={(event) => void submitMembership(event)} className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{!editingMembershipId && <label className="text-sm font-medium">Socio<select disabled={isDemoMode} required value={membershipForm.userId} onChange={(event) => setMembershipForm({ ...membershipForm, userId: event.target.value })} className="mt-1.5 w-full cursor-pointer rounded-lg border bg-white p-2.5 disabled:cursor-not-allowed disabled:opacity-60"><option value="">Seleccionar socio</option>{users.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>)}</select></label>}<label className="text-sm font-medium">Plan<select disabled={isDemoMode} value={membershipForm.plan} onChange={(event) => setMembershipForm({ ...membershipForm, plan: event.target.value as Membership["plan"] })} className="mt-1.5 w-full cursor-pointer rounded-lg border bg-white p-2.5 disabled:cursor-not-allowed disabled:opacity-60">{plans.map((plan) => <option key={plan} value={plan}>{planLabel(plan)}</option>)}</select></label><label className="text-sm font-medium">Estado<select disabled={isDemoMode} value={membershipForm.status} onChange={(event) => setMembershipForm({ ...membershipForm, status: event.target.value as Membership["status"] })} className="mt-1.5 w-full cursor-pointer rounded-lg border bg-white p-2.5 disabled:cursor-not-allowed disabled:opacity-60"><option value="active">Activa</option><option value="pending">Pendiente</option></select></label><label className="text-sm font-medium">Mes/año de inicio<input disabled={isDemoMode} required type="month" value={membershipForm.startMonth} onChange={(event) => setMembershipForm({ ...membershipForm, startMonth: event.target.value })} className="mt-1.5 w-full rounded-lg border p-2.5 disabled:cursor-not-allowed disabled:opacity-60" /></label><div className="rounded-lg bg-slate-50 p-3 text-sm sm:col-span-2"><p className="font-semibold">Vista previa del período</p>{membershipForm.startMonth && previewEndDate(membershipForm.startMonth, membershipForm.plan) ? <p className="mt-1">{dateLabel(`${membershipForm.startMonth}-01`)} — {dateLabel(previewEndDate(membershipForm.startMonth, membershipForm.plan))}</p> : <p className="mt-1 text-slate-500">Elegí un mes para ver el período.</p>}</div><div className="flex items-end gap-3"><button disabled={busy || isDemoMode} className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{editingMembershipId ? "Guardar" : "Crear"}</button><button type="button" onClick={resetMembershipVisit} className="cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-semibold">Cancelar</button></div></form><p className="mt-3 text-xs text-slate-500">El servidor calcula la fecha de fin a partir del plan y el mes elegido.</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-end gap-4">{!membershipFormOpen && <button type="button" disabled={isDemoMode} onClick={beginCreateMembership} className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Crear membresía</button>}<label className="text-sm font-medium">Plan<select value={membershipPlanFilter} onChange={(event) => setMembershipPlanFilter(event.target.value as typeof membershipPlanFilter)} className="mt-1.5 block cursor-pointer rounded-lg border bg-white p-2.5 disabled:cursor-not-allowed disabled:opacity-60"><option value="all">Todos</option>{plans.map((plan) => <option key={plan} value={plan}>{planLabel(plan)}</option>)}</select></label><label className="text-sm font-medium">Situación<select value={membershipSituationFilter} onChange={(event) => setMembershipSituationFilter(event.target.value as typeof membershipSituationFilter)} className="mt-1.5 block cursor-pointer rounded-lg border bg-white p-2.5"><option value="all">Todas</option><option value="current">Vigentes</option><option value="scheduled">Programadas</option><option value="pending">Pendientes</option></select></label><label className="min-w-56 flex-1 text-sm font-medium">Buscar socio<span className="relative mt-1.5 block"><input type="search" value={membershipSearch} onChange={(event) => setMembershipSearch(event.target.value)} placeholder="Buscar socio..." className="w-full rounded-lg border bg-white p-2.5 pr-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700" />{membershipSearch && <button type="button" onClick={() => setMembershipSearch("")} aria-label="Limpiar búsqueda de socios" title="Limpiar búsqueda" className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded px-2 py-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700">×</button>}</span></label><p aria-live="polite" className="ml-auto text-sm font-semibold">{membershipCountLabel}</p></div></article>
            {normalizedMembershipSearch && filteredMemberships.length === 0 ? <article role="status" className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No se encontraron membresías para esta búsqueda.</article> : ([ ["current", "Membresías vigentes", filteredCurrentMemberships, "Membresías activas actualmente."], ["scheduled", "Membresías futuras", filteredScheduledMemberships, "Membresías programadas para períodos posteriores."], ["pending", "Membresías pendientes", filteredPendingMemberships, "Membresías pendientes de confirmación."] ] as const).filter(([situation]) => membershipSituationFilter === "all" || membershipSituationFilter === situation).map(([situation, title, entries, description]) => <article key={situation} className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><div className="border-b p-5"><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Socio</th><th className="p-4">Plan</th><th className="p-4">Período</th><th className="p-4">Situación</th><th className="p-4">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{entries.map((entry) => <tr key={entry.id}><td className="p-4 font-medium">{memberName(entry.user_id)}</td><td className="p-4">{planLabel(entry.plan)}</td><td className="p-4">{dateLabel(entry.start_date)} — {dateLabel(entry.end_date)}</td><td className="p-4">{situation === "current" ? "Vigente" : situation === "scheduled" ? "Programada" : "Pendiente"}</td><td className="p-4"><div className="flex flex-wrap gap-3"><button type="button" disabled={isDemoMode} onClick={() => { setEditingMembershipId(entry.id); setMembershipFormOpen(true); setMembershipForm({ userId: entry.user_id === null ? "" : String(entry.user_id), plan: entry.plan, startMonth: entry.start_date.slice(0, 7), status: entry.status }); }} className="cursor-pointer whitespace-nowrap font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Editar</button>{entry.status === "pending" && <button type="button" disabled={busy || isDemoMode} onClick={() => requestDeletePendingMembership(entry)} className="cursor-pointer whitespace-nowrap font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Eliminar pendiente</button>}</div></td></tr>)}</tbody></table>{entries.length === 0 && <p className="p-5 text-sm text-slate-500">No hay membresías {situation === "current" ? "vigentes" : situation === "scheduled" ? "futuras" : "pendientes"} para estos filtros.</p>}</article>)}</section>}

          {view === "attendances" && <section className="space-y-5"><article className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-bold">Registrar asistencia para un socio</h2><form onSubmit={(event) => void submitAttendance(event)} className="mt-4 flex flex-wrap items-end gap-4"><label className="min-w-52 flex-1 text-sm font-medium">Socio<select disabled={isDemoMode} required value={attendanceForm.userId} onChange={(event) => setAttendanceForm({ ...attendanceForm, userId: event.target.value })} className="mt-1.5 w-full rounded-lg border bg-white p-2.5"><option value="">Seleccionar socio</option>{users.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>)}</select></label><label className="text-sm font-medium">Fecha<input disabled={isDemoMode} required type="date" max={today()} value={attendanceForm.attendanceDate} onChange={(event) => setAttendanceForm({ ...attendanceForm, attendanceDate: event.target.value })} className="mt-1.5 block rounded-lg border p-2.5 disabled:cursor-not-allowed disabled:opacity-60" /></label><button disabled={busy || isDemoMode} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Registrar</button></form></article><article className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[500px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Socio</th><th className="p-4">Fecha</th><th className="p-4">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{attendances.map((entry) => <tr key={entry.id}><td className="p-4 font-medium">{memberName(entry.user_id)}</td><td className="p-4">{dateLabel(entry.attendance_date)}</td><td className="p-4"><button disabled={busy || isDemoMode} onClick={() => { if (window.confirm("¿Eliminar este registro de asistencia?")) void perform(() => deleteAttendance(token!, entry.id), "Asistencia eliminada."); }} className="font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50">Eliminar</button></td></tr>)}</tbody></table>{attendances.length === 0 && !failedResources.includes("asistencias") && <p className="p-5 text-sm text-slate-500">No hay asistencias registradas.</p>}</article></section>}

          {view === "payments" && <article className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><div className="border-b p-6"><h2 className="font-bold">Pagos simulados</h2><p className="mt-1 text-sm text-slate-500">Consulta de operaciones simuladas.</p></div><table className="w-full min-w-[550px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Socio</th><th className="p-4">Membresía</th><th className="p-4">Fecha</th><th className="p-4">Importe</th></tr></thead><tbody className="divide-y divide-slate-100">{payments.map((payment) => { const relatedMembership = memberships.find((entry) => entry.id === payment.membership_id); return <tr key={payment.id}><td className="p-4 font-medium">{relatedMembership ? memberName(relatedMembership.user_id) : "—"}</td><td className="p-4">#{payment.membership_id}</td><td className="p-4">{dateLabel(String(payment.payment_date))}</td><td className="p-4 font-semibold">{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(payment.amount))}</td></tr>; })}</tbody></table>{payments.length === 0 && !failedResources.includes("pagos") && <p className="p-5 text-sm text-slate-500">No hay pagos registrados.</p>}</article>}
        </>}</main>
    </div>
  </div>;
};

export default AdminDashboard;
