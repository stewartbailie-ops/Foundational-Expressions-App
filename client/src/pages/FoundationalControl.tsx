import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
import {
  CheckCircle2, ChevronDown, ChevronUp, Copy, ExternalLink, Home,
  Inbox, Loader2, LogOut, Mail, Pencil, Phone, Save, Settings,
  UserRound, UsersRound, WalletCards,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Advisor, Email as Lead } from "@shared/schema";

type Session = { authenticated: boolean; advisorId?: number; slug?: string };
type Section = "home" | "leads" | "clients" | "settings";

async function json<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error((await response.text()) || "Request failed");
  return response.json();
}

function BrandMark() {
  return <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#b34dcc]/35 bg-[#b34dcc]/15 font-serif text-lg text-[#e398f2]">FE</span>;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await apiRequest("POST", "/api/advisor/login", { email, password }); onSuccess(); }
    catch (cause) { setError(cause instanceof Error ? cause.message.replace(/^\d+:\s*/, "") : "Unable to sign in."); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#08070a] px-5 py-12 text-white"><div className="fe-ambient" aria-hidden="true" /><section className="relative mx-auto mt-[8vh] max-w-md rounded-[2rem] border border-white/10 bg-[#111014]/95 p-7 shadow-2xl sm:p-9"><div className="flex items-center gap-3"><BrandMark /><div><strong className="block text-sm tracking-[0.14em]">FOUNDATIONAL</strong><span className="text-[10px] tracking-[0.28em] text-white/45">EXPRESSIONS</span></div></div><p className="mt-9 text-xs font-bold uppercase tracking-[0.24em] text-[#d979ef]">Advisor control panel</p><h1 className="mt-3 font-serif text-4xl">Welcome back</h1><p className="mt-3 text-sm leading-6 text-white/55">Manage your contact card and client enquiries.</p><form className="mt-7 grid gap-4" onSubmit={submit}><Field label="Email address"><input autoComplete="email" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} /></Field><Field label="Password"><input autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} required type="password" value={password} /></Field>{error && <p className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}<button className="fe-action mt-1 bg-[#b34dcc] text-white" disabled={busy} type="submit">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in</button></form><a className="mt-6 block text-center text-xs text-white/45 hover:text-white" href="/">Return to public profile</a></section></main>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="fe-field"><span>{label}</span>{children}</label>; }

function AdvisorHeader({ advisor, onLogout, onSettings }: { advisor: Advisor; onLogout: () => void; onSettings: () => void }) {
  return <header className="flex items-center gap-3 border-b border-white/10 bg-black/55 px-4 py-3"><BrandMark />{advisor.profilePicUrl ? <img className="h-10 w-10 rounded-full border border-white/15 object-cover" src={advisor.profilePicUrl} alt="" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-[#b34dcc]/20 text-sm font-bold text-[#e398f2]">{advisor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>}<div className="min-w-0 flex-1"><strong className="block truncate text-sm">{advisor.name}</strong><span className="block text-[11px] text-white/45">Advisor Control Panel</span></div><button className="rounded-xl bg-white/[0.07] p-2.5 text-white/65 hover:text-white" onClick={onSettings} aria-label="Settings"><Settings className="h-4 w-4" /></button><button className="rounded-xl bg-white/[0.07] p-2.5 text-white/65 hover:text-white" onClick={onLogout} aria-label="Sign out"><LogOut className="h-4 w-4" /></button></header>;
}

function Nav({ section }: { section: Section }) {
  const items = [{ key: "home" as const, label: "Home", icon: Home }, { key: "leads" as const, label: "Enquiries", icon: Inbox }, { key: "clients" as const, label: "My Clients", icon: UsersRound }];
  return <nav className="grid grid-cols-3 border-b border-white/10 bg-black/25">{items.map(({ key, label, icon: Icon }) => <Link className={`relative flex flex-col items-center gap-1 py-3 text-[11px] ${section === key ? "text-white" : "text-white/45"}`} href={key === "home" ? "/control" : `/control/${key}`} key={key}><Icon className="h-4 w-4" />{label}{section === key && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#d979ef]" />}</Link>)}</nav>;
}

function Accordion({ icon, title, copy, open, onToggle, color, children }: { icon: ReactNode; title: string; copy: string; open?: boolean; onToggle?: () => void; color: string; children?: ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-white/12 bg-white/[0.055]"><button className="flex w-full items-center gap-3 p-4 text-left" onClick={onToggle}><span className="grid h-10 w-10 place-items-center rounded-xl border" style={{ color, borderColor: `${color}55`, backgroundColor: `${color}18` }}>{icon}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><span className="block truncate text-[11px]" style={{ color }}>{copy}</span></span>{children && (open ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />)}</button>{open && children && <div className="border-t border-white/10 p-3">{children}</div>}</section>;
}

function ProfilePreview({ advisor, onEdit }: { advisor: Advisor; onEdit: () => void }) {
  const profileUrl = `${window.location.origin}/${advisor.profileSlug}`;
  async function copy() { await navigator.clipboard.writeText(profileUrl); }
  return <div className="rounded-xl border border-white/15 bg-[#09090b] p-3"><div className="mb-3"><p className="text-xs font-bold">Your Profile</p><p className="mt-1 text-[11px] text-white/45">Your public contact card — its link, identity, biography and contact actions.</p></div><div className="rounded-xl border border-white/70 p-3"><div className="grid grid-cols-[110px_1fr] gap-3 sm:grid-cols-[140px_1fr]">{advisor.profilePicUrl ? <img className="h-32 w-full rounded-xl object-cover sm:h-36" src={advisor.profilePicUrl} alt={advisor.name} /> : <div className="grid h-32 place-items-center rounded-xl bg-gradient-to-br from-[#b34dcc]/35 to-white/5 font-serif text-5xl text-[#e398f2] sm:h-36">{advisor.name.slice(0, 1)}</div>}<div className="grid gap-2"><div className="rounded-lg border border-white/15 bg-black p-2"><span className="text-[9px] font-bold uppercase text-[#d979ef]">Profile preview</span><strong className="mt-1 block text-xs leading-4">{advisor.name}</strong><p className="mt-1 line-clamp-2 text-[10px] text-white/45">{advisor.title || "Foundational Expressions Advisor"}</p></div><div className="grid grid-cols-2 gap-2"><button className="grid place-items-center rounded-lg bg-white px-2 py-3 text-[10px] font-semibold text-black" onClick={copy}><Copy className="mb-1 h-4 w-4" />Copy link</button><a className="grid place-items-center rounded-lg bg-white px-2 py-3 text-[10px] font-semibold text-black" href={`/${advisor.profileSlug}`} target="_blank"><ExternalLink className="mb-1 h-4 w-4" />View profile</a></div></div></div><p className="mt-3 truncate text-[10px] text-white/45">{profileUrl}</p><button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-xs font-bold text-black" onClick={onEdit}><Pencil className="h-3.5 w-3.5" />Edit Contact Card</button></div></div>;
}

function ProfileEditor({ advisor, onDone }: { advisor: Advisor; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: advisor.name, title: advisor.title ?? "", email: advisor.email, contactNumber: advisor.contactNumber ?? "", location: advisor.location ?? "", customBio: advisor.customBio ?? advisor.bio ?? "", websiteUrl: advisor.websiteUrl ?? "", linkedinUrl: advisor.linkedinUrl ?? "", facebookUrl: advisor.facebookUrl ?? "", instagramUrl: advisor.instagramUrl ?? "", bookingUrl: advisor.bookingUrl ?? "" });
  useEffect(() => setForm({ name: advisor.name, title: advisor.title ?? "", email: advisor.email, contactNumber: advisor.contactNumber ?? "", location: advisor.location ?? "", customBio: advisor.customBio ?? advisor.bio ?? "", websiteUrl: advisor.websiteUrl ?? "", linkedinUrl: advisor.linkedinUrl ?? "", facebookUrl: advisor.facebookUrl ?? "", instagramUrl: advisor.instagramUrl ?? "", bookingUrl: advisor.bookingUrl ?? "" }), [advisor]);
  const save = useMutation({ mutationFn: () => apiRequest("PATCH", `/api/advisors/${advisor.id}`, form), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["advisor", advisor.id] }); onDone(); } });
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="grid gap-4 rounded-xl border border-[#b34dcc]/25 bg-black/30 p-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Display name"><input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field><Field label="Professional title"><input value={form.title} onChange={(e) => set("title", e.target.value)} /></Field><Field label="Email"><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field><Field label="Phone / WhatsApp"><input value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value)} /></Field><Field label="Location"><input value={form.location} onChange={(e) => set("location", e.target.value)} /></Field><Field label="Website"><input value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} /></Field></div><Field label="Biography"><textarea rows={5} value={form.customBio} onChange={(e) => set("customBio", e.target.value)} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="LinkedIn"><input value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} /></Field><Field label="Facebook"><input value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} /></Field><Field label="Instagram"><input value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} /></Field><Field label="Booking link"><input value={form.bookingUrl} onChange={(e) => set("bookingUrl", e.target.value)} /></Field></div><button className="fe-action bg-[#b34dcc] text-white" disabled={save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4" />{save.isPending ? "Saving…" : "Save Contact Card"}</button>{save.isError && <p className="text-sm text-red-300">{save.error.message}</p>}</div>;
}

function HomePanel({ advisor, leads }: { advisor: Advisor; leads: Lead[] }) {
  const [profilesOpen, setProfilesOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  return <div className="space-y-4"><div><h1 className="text-lg font-bold">Welcome back, {advisor.name.split(" ")[0]}</h1><p className="mt-1 text-xs text-white/45">Tap a section to expand it.</p></div><Accordion icon={<UserRound className="h-5 w-5" />} title="Profiles" copy="Edit your contact card" color="#60a5fa" open={profilesOpen} onToggle={() => setProfilesOpen((value) => !value)}>{editing ? <ProfileEditor advisor={advisor} onDone={() => setEditing(false)} /> : <ProfilePreview advisor={advisor} onEdit={() => setEditing(true)} />}</Accordion><Accordion icon={<Inbox className="h-5 w-5" />} title="Enquiries" copy={`${leads.filter((lead) => lead.leadStatus !== "Contacted" && lead.leadStatus !== "Archive").length} awaiting contact`} color="#34d399" /><Accordion icon={<WalletCards className="h-5 w-5" />} title="Services" copy="Financial planning, coaching and wellness" color="#c084fc" /><div className="rounded-2xl border border-[#b34dcc]/20 bg-[#b34dcc]/10 p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e398f2]">NFC profile</p><p className="mt-2 text-sm text-white/60">Changes saved under Profiles update the public contact card at <strong className="text-white">/{advisor.profileSlug}</strong>.</p></div></div>;
}

function LeadList({ leads, onComplete }: { leads: Lead[]; onComplete: (id: number) => void }) {
  if (!leads.length) return <p className="py-12 text-center text-sm text-white/40">No enquiries have arrived yet.</p>;
  return <div className="space-y-3">{leads.map((lead) => <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-4" key={lead.id}><div className="flex items-start justify-between gap-3"><div><strong className="text-sm">{lead.senderName}</strong><p className="mt-1 text-[11px] text-white/40">{lead.type} · {new Date(lead.receivedAt).toLocaleDateString()}</p></div>{lead.leadStatus !== "Contacted" && <button className="rounded-full border border-emerald-300/20 p-2 text-emerald-200" onClick={() => onComplete(lead.id)} title="Mark contacted"><CheckCircle2 className="h-4 w-4" /></button>}</div><div className="mt-3 flex flex-wrap gap-3 text-xs text-white/60">{lead.clientPhone && <a className="inline-flex items-center gap-1" href={`tel:${lead.clientPhone}`}><Phone className="h-3.5 w-3.5" />{lead.clientPhone}</a>}<a className="inline-flex items-center gap-1" href={`mailto:${lead.senderEmail}`}><Mail className="h-3.5 w-3.5" />{lead.senderEmail}</a></div>{lead.body && <p className="mt-3 text-xs leading-5 text-white/50">{lead.body}</p>}</article>)}</div>;
}

function LeadsPanel({ leads, slug }: { leads: Lead[]; slug: string }) {
  const queryClient = useQueryClient();
  const update = useMutation({ mutationFn: (id: number) => apiRequest("PATCH", `/api/emails/${id}/status`, { leadStatus: "Contacted" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads", slug] }) });
  const sorted = useMemo(() => [...leads].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()), [leads]);
  return <div><h1 className="text-lg font-bold">Enquiries</h1><p className="mt-1 mb-5 text-xs text-white/45">Callback and contact-card requests.</p><LeadList leads={sorted} onComplete={(id) => update.mutate(id)} /></div>;
}

function ClientsPanel() { return <div><h1 className="text-lg font-bold">My Clients</h1><p className="mt-1 text-xs text-white/45">A lightweight client area can be added after the contact-card workflow is confirmed.</p><div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center"><UsersRound className="mx-auto h-8 w-8 text-[#d979ef]" /><p className="mt-4 text-sm text-white/55">Client management is intentionally deferred for this first clean release.</p></div></div>; }

function SettingsPanel({ advisor }: { advisor: Advisor }) { return <div><h1 className="text-lg font-bold">Settings</h1><p className="mt-1 text-xs text-white/45">Account and profile status.</p><div className="mt-6 grid gap-3"><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><span className="text-[10px] uppercase tracking-wider text-white/35">Login email</span><p className="mt-1 text-sm">{advisor.email}</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><span className="text-[10px] uppercase tracking-wider text-white/35">Public profile</span><p className="mt-1 text-sm">/{advisor.profileSlug} · {advisor.active ? "Live" : "Offline"}</p></div></div></div>; }

export default function FoundationalControl() {
  const [, params] = useRoute<{ section?: string }>("/control/:section?");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const requested = params?.section;
  const section: Section = requested === "leads" || requested === "clients" || requested === "settings" ? requested : "home";
  const session = useQuery<Session>({ queryKey: ["advisor-session"], queryFn: () => json("/api/advisor/session"), staleTime: 0 });
  const advisor = useQuery<Advisor>({ queryKey: ["advisor", session.data?.advisorId], queryFn: () => json(`/api/advisors/${session.data!.advisorId}`), enabled: !!session.data?.authenticated && !!session.data.advisorId });
  const leads = useQuery<Lead[]>({ queryKey: ["leads", session.data?.slug], queryFn: () => json(`/api/advisors/${session.data!.slug}/emails`), enabled: !!session.data?.authenticated && !!session.data.slug });
  if (session.isLoading || (session.data?.authenticated && advisor.isLoading)) return <div className="grid min-h-screen place-items-center bg-[#08070a] text-white"><Loader2 className="h-6 w-6 animate-spin text-[#d979ef]" /></div>;
  if (!session.data?.authenticated) return <Login onSuccess={() => session.refetch()} />;
  if (!advisor.data) return <div className="grid min-h-screen place-items-center bg-[#08070a] text-red-200">Unable to load the advisor account.</div>;
  async function logout() { await apiRequest("POST", "/api/advisor/logout"); queryClient.clear(); navigate("/control"); window.location.reload(); }
  const content = section === "leads" ? <LeadsPanel leads={leads.data ?? []} slug={session.data.slug!} /> : section === "clients" ? <ClientsPanel /> : section === "settings" ? <SettingsPanel advisor={advisor.data} /> : <HomePanel advisor={advisor.data} leads={leads.data ?? []} />;
  return <main className="min-h-screen bg-[#08090a] text-white"><div className="fe-ambient" aria-hidden="true" /><div className="relative mx-auto min-h-screen max-w-2xl border-x border-white/5 bg-[#0c0d0f]/92"><AdvisorHeader advisor={advisor.data} onLogout={logout} onSettings={() => navigate("/control/settings")} /><Nav section={section} /><div className="p-4 py-6 sm:p-6">{content}</div></div></main>;
}
