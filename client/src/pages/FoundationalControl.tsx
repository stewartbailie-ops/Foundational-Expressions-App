import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Save,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Advisor, Email as Lead } from "@shared/schema";

type Session = { authenticated: boolean; advisorId?: number; slug?: string };
type Section = "dashboard" | "profile" | "leads" | "settings";

const sections: Array<{ key: Section; label: string; icon: typeof LayoutDashboard }> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "profile", label: "Profile card", icon: UserRound },
  { key: "leads", label: "Callback requests", icon: Inbox },
  { key: "settings", label: "Settings", icon: Settings },
];

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error((await response.text()) || "Request failed");
  return response.json();
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest("POST", "/api/advisor/login", { email, password });
      onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message.replace(/^\d+:\s*/, "") : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08070a] px-5 py-12 text-white">
      <div className="fe-ambient" aria-hidden="true" />
      <section className="relative mx-auto mt-[8vh] max-w-md rounded-[2rem] border border-white/10 bg-[#111014]/95 p-7 shadow-2xl sm:p-9">
        <Brand />
        <p className="mt-9 text-xs font-bold uppercase tracking-[0.24em] text-[#d979ef]">Advisor control panel</p>
        <h1 className="mt-3 font-serif text-4xl">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Manage your public card and respond to new enquiries.</p>
        <form className="mt-7 grid gap-4" onSubmit={submit}>
          <Field label="Email address"><input autoComplete="email" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} /></Field>
          <Field label="Password"><input autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} required type="password" value={password} /></Field>
          {error && <p className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
          <button className="fe-action mt-1 bg-[#b34dcc] text-white hover:bg-[#c767df]" disabled={busy} type="submit">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
        </form>
        <a className="mt-6 block text-center text-xs text-white/45 hover:text-white" href="/">Return to public profile</a>
      </section>
    </main>
  );
}

function Brand() {
  return <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#b34dcc]/35 bg-[#b34dcc]/15 font-serif text-2xl text-[#d979ef]">FE</span><span><strong className="block text-sm tracking-[0.15em]">FOUNDATIONAL</strong><span className="block text-[10px] tracking-[0.3em] text-white/50">EXPRESSIONS</span></span></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="fe-field"><span>{label}</span>{children}</label>;
}

function Dashboard({ advisor, leads }: { advisor: Advisor; leads: Lead[] }) {
  const open = leads.filter((lead) => lead.leadStatus !== "Contacted" && lead.leadStatus !== "Archive");
  const callbacks = leads.filter((lead) => lead.type === "Callback");
  const latest = [...leads].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()).slice(0, 4);
  return <div className="space-y-6"><Heading eyebrow="Overview" title={`Hello, ${advisor.name.split(" ")[0]}`} copy="A focused view of your profile and incoming enquiries." />
    <div className="grid gap-3 sm:grid-cols-3"><Stat label="Open enquiries" value={open.length} /><Stat label="Callback requests" value={callbacks.length} /><Stat label="Total enquiries" value={leads.length} /></div>
    <Panel title="Recent activity"><LeadList leads={latest} empty="No enquiries have arrived yet." /></Panel>
    <div className="grid gap-3 sm:grid-cols-2"><Link className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 hover:bg-white/[0.06]" href="/control/profile"><UserRound className="h-5 w-5 text-[#d979ef]" /><h3 className="mt-4 font-semibold">Update profile card</h3><p className="mt-2 text-sm text-white/50">Contact details, biography, services and links.</p></Link><a className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 hover:bg-white/[0.06]" href={`/${advisor.profileSlug}`} target="_blank"><ExternalLink className="h-5 w-5 text-[#d979ef]" /><h3 className="mt-4 font-semibold">View live profile</h3><p className="mt-2 text-sm text-white/50">Open the public NFC destination.</p></a></div>
  </div>;
}

function ProfileEditor({ advisor }: { advisor: Advisor }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: advisor.name, title: advisor.title ?? "", email: advisor.email, contactNumber: advisor.contactNumber ?? "", location: advisor.location ?? "", customBio: advisor.customBio ?? advisor.bio ?? "", websiteUrl: advisor.websiteUrl ?? "", linkedinUrl: advisor.linkedinUrl ?? "", facebookUrl: advisor.facebookUrl ?? "", instagramUrl: advisor.instagramUrl ?? "", bookingUrl: advisor.bookingUrl ?? "" });
  useEffect(() => setForm({ name: advisor.name, title: advisor.title ?? "", email: advisor.email, contactNumber: advisor.contactNumber ?? "", location: advisor.location ?? "", customBio: advisor.customBio ?? advisor.bio ?? "", websiteUrl: advisor.websiteUrl ?? "", linkedinUrl: advisor.linkedinUrl ?? "", facebookUrl: advisor.facebookUrl ?? "", instagramUrl: advisor.instagramUrl ?? "", bookingUrl: advisor.bookingUrl ?? "" }), [advisor]);
  const save = useMutation({ mutationFn: () => apiRequest("PATCH", `/api/advisors/${advisor.id}`, form), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["advisor", advisor.id] }) });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="space-y-6"><Heading eyebrow="Public card" title="Profile details" copy="These fields use the existing advisor record and are ready to drive the public card." /><Panel title="Identity and contact"><div className="grid gap-4 sm:grid-cols-2"><Field label="Display name"><input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field><Field label="Professional title"><input value={form.title} onChange={(e) => set("title", e.target.value)} /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field><Field label="Phone / WhatsApp"><input value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value)} /></Field><Field label="Location"><input value={form.location} onChange={(e) => set("location", e.target.value)} /></Field><Field label="Website"><input value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} /></Field></div><div className="mt-4"><Field label="Biography"><textarea rows={5} value={form.customBio} onChange={(e) => set("customBio", e.target.value)} /></Field></div></Panel><Panel title="Links"><div className="grid gap-4 sm:grid-cols-2"><Field label="LinkedIn"><input value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} /></Field><Field label="Facebook"><input value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} /></Field><Field label="Instagram"><input value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} /></Field><Field label="Booking link"><input value={form.bookingUrl} onChange={(e) => set("bookingUrl", e.target.value)} /></Field></div></Panel><button className="fe-action bg-[#b34dcc] text-white" disabled={save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" />{save.isPending ? "Saving…" : "Save profile"}</button>{save.isSuccess && <span className="ml-3 text-sm text-emerald-300">Saved</span>}{save.isError && <p className="text-sm text-red-300">{save.error.message}</p>}</div>;
}

function Leads({ leads, slug }: { leads: Lead[]; slug: string }) {
  const queryClient = useQueryClient();
  const update = useMutation({ mutationFn: ({ id, leadStatus }: { id: number; leadStatus: string }) => apiRequest("PATCH", `/api/emails/${id}/status`, { leadStatus }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads", slug] }) });
  const sorted = useMemo(() => [...leads].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()), [leads]);
  return <div className="space-y-6"><Heading eyebrow="Inbox" title="Callback requests" copy="Contact prospects and mark each enquiry when it has been handled." /><Panel title={`${sorted.length} enquiries`}><LeadList leads={sorted} empty="No enquiries have arrived yet." onComplete={(id) => update.mutate({ id, leadStatus: "Contacted" })} /></Panel></div>;
}

function LeadList({ leads, empty, onComplete }: { leads: Lead[]; empty: string; onComplete?: (id: number) => void }) {
  if (!leads.length) return <p className="py-8 text-center text-sm text-white/45">{empty}</p>;
  return <div className="divide-y divide-white/10">{leads.map((lead) => <article className="py-4 first:pt-0 last:pb-0" key={lead.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-semibold">{lead.senderName}</h3><span className="rounded-full bg-[#b34dcc]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#e398f2]">{lead.type}</span></div><p className="mt-1 text-xs text-white/40">{new Date(lead.receivedAt).toLocaleString()}</p></div>{onComplete && lead.leadStatus !== "Contacted" && <button className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 px-3 py-1.5 text-xs text-emerald-200" onClick={() => onComplete(lead.id)}><CheckCircle2 className="h-3.5 w-3.5" />Mark contacted</button>}</div><div className="mt-3 flex flex-wrap gap-3 text-sm text-white/60">{lead.clientPhone && <a className="inline-flex items-center gap-1.5 hover:text-white" href={`tel:${lead.clientPhone}`}><Phone className="h-3.5 w-3.5" />{lead.clientPhone}</a>}<a className="inline-flex items-center gap-1.5 hover:text-white" href={`mailto:${lead.senderEmail}`}><Mail className="h-3.5 w-3.5" />{lead.senderEmail}</a></div>{lead.body && <p className="mt-3 rounded-xl bg-white/[0.035] p-3 text-sm leading-6 text-white/55">{lead.body}</p>}</article>)}</div>;
}

function AdvisorSettings({ advisor }: { advisor: Advisor }) {
  return <div className="space-y-6"><Heading eyebrow="Account" title="Settings" copy="A deliberately small settings area for the first Foundational Expressions release." /><Panel title="Profile status"><dl className="grid gap-4 text-sm sm:grid-cols-2"><Info icon={<UserRound />} label="Advisor" value={advisor.name} /><Info icon={<Mail />} label="Login email" value={advisor.email} /><Info icon={<MapPin />} label="Public route" value={`/${advisor.profileSlug}`} /><Info icon={<BarChart3 />} label="Status" value={advisor.active ? "Profile live" : "Profile offline"} /></dl></Panel><Panel title="Deferred for later"><p className="text-sm leading-6 text-white/55">Advanced billing, organisation management, multiple profiles, financial widgets and document storage remain outside this simplified control panel.</p></Panel></div>;
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="flex gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-[#d979ef]"><span>{icon}</span><div><dt className="text-xs uppercase tracking-wider text-white/35">{label}</dt><dd className="mt-1 text-white/75">{value}</dd></div></div>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><strong className="font-serif text-4xl text-[#e398f2]">{value}</strong><p className="mt-2 text-sm text-white/50">{label}</p></div>; }
function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 sm:p-6"><h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-white/65">{title}</h2>{children}</section>; }
function Heading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) { return <header><p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d979ef]">{eyebrow}</p><h1 className="mt-3 font-serif text-4xl sm:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">{copy}</p></header>; }

export default function FoundationalControl() {
  const queryClient = useQueryClient();
  const [, params] = useRoute<{ section?: string }>("/control/:section?");
  const [, navigate] = useLocation();
  const [menu, setMenu] = useState(false);
  const section = sections.some((item) => item.key === params?.section) ? params!.section as Section : "dashboard";
  const session = useQuery<Session>({ queryKey: ["advisor-session"], queryFn: () => json("/api/advisor/session"), staleTime: 0 });
  const advisor = useQuery<Advisor>({ queryKey: ["advisor", session.data?.advisorId], queryFn: () => json(`/api/advisors/${session.data!.advisorId}`), enabled: !!session.data?.authenticated && !!session.data.advisorId });
  const leads = useQuery<Lead[]>({ queryKey: ["leads", session.data?.slug], queryFn: () => json(`/api/advisors/${session.data!.slug}/emails`), enabled: !!session.data?.authenticated && !!session.data.slug });
  if (session.isLoading) return <div className="grid min-h-screen place-items-center bg-[#08070a] text-white"><Loader2 className="h-6 w-6 animate-spin text-[#d979ef]" /></div>;
  if (!session.data?.authenticated) return <Login onSuccess={() => session.refetch()} />;
  if (advisor.isLoading) return <div className="grid min-h-screen place-items-center bg-[#08070a] text-white"><Loader2 className="h-6 w-6 animate-spin text-[#d979ef]" /></div>;
  if (!advisor.data) return <div className="grid min-h-screen place-items-center bg-[#08070a] text-red-200">Unable to load the advisor account.</div>;
  const content = section === "profile" ? <ProfileEditor advisor={advisor.data} /> : section === "leads" ? <Leads leads={leads.data ?? []} slug={session.data.slug!} /> : section === "settings" ? <AdvisorSettings advisor={advisor.data} /> : <Dashboard advisor={advisor.data} leads={leads.data ?? []} />;
  async function logout() { await apiRequest("POST", "/api/advisor/logout"); queryClient.removeQueries({ queryKey: ["advisor-session"] }); navigate("/control"); window.location.reload(); }
  return <div className="min-h-screen bg-[#08070a] text-white"><div className="fe-ambient" aria-hidden="true" /><div className="relative flex min-h-screen"><aside className={`${menu ? "flex" : "hidden"} fixed inset-0 z-30 w-full flex-col bg-[#0d0c10] p-5 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:border-r md:border-white/10`}><div className="flex items-center justify-between"><Brand /><button className="md:hidden" onClick={() => setMenu(false)}><X /></button></div><nav className="mt-10 grid gap-2">{sections.map(({ key, label, icon: Icon }) => <Link className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${section === key ? "bg-[#b34dcc] text-white" : "text-white/55 hover:bg-white/[0.05] hover:text-white"}`} href={`/control/${key}`} key={key} onClick={() => setMenu(false)}><Icon className="h-4 w-4" />{label}</Link>)}</nav><div className="mt-auto grid gap-2"><a className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/50 hover:text-white" href={`/${advisor.data.profileSlug}`} target="_blank"><ArrowUpRight className="h-4 w-4" />View public card</a><button className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-white/50 hover:text-white" onClick={logout}><LogOut className="h-4 w-4" />Sign out</button></div></aside><main className="min-w-0 flex-1"><header className="flex h-16 items-center justify-between border-b border-white/10 px-5 md:px-8"><button className="md:hidden" onClick={() => setMenu(true)}><Menu /></button><span className="text-sm font-semibold text-white/65">{sections.find((item) => item.key === section)?.label}</span><span className="hidden text-xs text-white/35 sm:block">{advisor.data.email}</span></header><div className="mx-auto max-w-5xl p-5 py-8 sm:p-8 lg:py-12">{content}</div></main></div></div>;
}
