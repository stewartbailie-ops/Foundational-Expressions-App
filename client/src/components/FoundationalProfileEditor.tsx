import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Check, Loader2, Save, X } from "lucide-react";
import type { Advisor, AdvisorProfile } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { serviceGroups } from "@/data/foundationalProfile";
import { useToast } from "@/hooks/use-toast";

type Props = { advisor: Advisor; profile?: AdvisorProfile; isPrimary?: boolean; onDone: () => void };
const fieldClass = "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-[#b34dcc]/70";

export function FoundationalProfileEditor({ advisor, profile, isPrimary = false, onDone }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const source = profile ?? advisor;
  const [form, setForm] = useState({
    nickname: source.nickname ?? (isPrimary ? advisor.name : ""), profileSlug: source.profileSlug ?? `${advisor.profileSlug}-profile`,
    title: source.title ?? "", customBio: source.customBio ?? source.bio ?? "", profilePicUrl: source.profilePicUrl ?? "",
    contactNumber: advisor.contactNumber ?? "", location: advisor.location ?? "", workingHours: advisor.workingHours ?? "",
    showContactDetails: advisor.showContactDetails !== false, websiteUrl: source.websiteUrl ?? "",
    individualServices: source.individualServices?.filter((name) => serviceGroups.some((group) => group.title === name)) ?? serviceGroups.map((group) => group.title),
    showQrCode: source.showQrCode !== false, showCallbackLink: source.showCallbackLink !== false, showReferralsLink: source.showReferralsLink !== false,
    showFinancialDashboard: source.showFinancialDashboard === true,
    showMoneywebFeed: source.showMoneywebFeed === true, showSecondNews: source.showSecondNews === true, showForex: source.showForex === true,
    showFunFacts: source.showFunFacts === true, showEmergencyContacts: source.showEmergencyContacts === true, showTradingView: source.showTradingView === true,
    showInteractive: source.showInteractive === true, rotateInteractiveTools: source.rotateInteractiveTools === true,
    showShowpieceSqueeze: source.showShowpieceSqueeze !== false, showShowpieceTaxBite: source.showShowpieceTaxBite !== false,
    showShowpieceInflation: source.showShowpieceInflation !== false, showShowpieceWaiting: source.showShowpieceWaiting !== false,
    showToolReality: source.showToolReality !== false, showToolLatte: source.showToolLatte !== false,
  });
  const [uploading, setUploading] = useState(false);
  const set = (key: keyof typeof form, value: string | string[] | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const toggleService = (title: string) => set("individualServices", form.individualServices.includes(title) ? form.individualServices.filter((item) => item !== title) : [...form.individualServices, title]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nickname: form.nickname.trim() || null, title: form.title.trim() || null, customBio: form.customBio.trim() || null,
        profilePicUrl: form.profilePicUrl || null, contactNumber: form.contactNumber.trim() || null, location: form.location.trim() || null,
        workingHours: form.workingHours.trim() || null, showContactDetails: form.showContactDetails, websiteUrl: form.websiteUrl.trim() || null,
        linkedinUrl: null, facebookUrl: null, instagramUrl: null, youtubeUrl: null, individualServices: form.individualServices,
        showHeader: true, showProfilePic: true, showIntro: true, showIndividualServices: true, showSocials: false,
        showQrCode: form.showQrCode, showCallbackLink: form.showCallbackLink, showReferralsLink: form.showReferralsLink,
        showFinancialDashboard: form.showFinancialDashboard,
        showMoneywebFeed: form.showMoneywebFeed, showSecondNews: form.showSecondNews, showForex: form.showForex, showFunFacts: form.showFunFacts,
        showEmergencyContacts: form.showEmergencyContacts, showTradingView: form.showTradingView, showInteractive: form.showInteractive,
        rotateInteractiveTools: form.rotateInteractiveTools, showShowpieceSqueeze: form.showShowpieceSqueeze,
        showShowpieceTaxBite: form.showShowpieceTaxBite, showShowpieceInflation: form.showShowpieceInflation,
        showShowpieceWaiting: form.showShowpieceWaiting, showToolReality: form.showToolReality, showToolLatte: form.showToolLatte,
      };
      if (isPrimary) return apiRequest("PATCH", `/api/advisors/${advisor.id}`, payload);
      if (profile) return apiRequest("PATCH", `/api/advisors/${advisor.id}/profiles/${profile.id}`, payload);
      return apiRequest("POST", `/api/advisors/${advisor.id}/profiles`, { ...payload, profileSlug: form.profileSlug.trim(), advisorId: advisor.id });
    },
    onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: [`/api/advisors/slug/${advisor.profileSlug}`] }), queryClient.invalidateQueries({ queryKey: [`/api/advisors/${advisor.id}/profiles`] }), queryClient.invalidateQueries({ queryKey: ["public-foundational-advisor"] })]); toast({ title: "Profile saved", description: "The public contact card has been updated." }); onDone(); },
    onError: (error: Error) => toast({ title: "Unable to save profile", description: error.message, variant: "destructive" }),
  });

  async function uploadPhoto(file?: File) {
    if (!file) return; setUploading(true);
    try { const body = new FormData(); body.append("file", file); const response = await fetch("/api/upload/profile-pic", { method: "POST", body, credentials: "include" }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Upload failed"); set("profilePicUrl", data.url); }
    catch (error) { toast({ title: "Photo upload failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }); }
    finally { setUploading(false); }
  }

  return <div className="space-y-5 rounded-xl border border-[#b34dcc]/35 bg-black/15 p-4 text-white">
    <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">{isPrimary ? "Edit primary card" : profile ? "Edit profile" : "Create profile"}</h3><p className="mt-1 text-xs text-white/45">Manage the Foundational Expressions contact card.</p></div><button onClick={onDone} className="rounded-lg p-2 text-white/50 hover:bg-white/5"><X className="h-4 w-4" /></button></div>
    <div className="flex flex-wrap items-center gap-4"><div className="grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/25">{form.profilePicUrl ? <img src={form.profilePicUrl} alt="Profile" className="h-full w-full object-cover" /> : <Camera className="h-7 w-7 text-white/30" />}</div><div><input ref={fileRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPhoto(event.target.files?.[0])} /><button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black" disabled={uploading}>{uploading ? "Uploading…" : "Upload photo"}</button>{form.profilePicUrl && <button type="button" onClick={() => set("profilePicUrl", "")} className="ml-3 text-xs text-white/45">Remove</button>}</div></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Profile name"><input className={fieldClass} value={form.nickname} onChange={(e) => set("nickname", e.target.value)} /></Field><Field label="Professional title"><input className={fieldClass} value={form.title} onChange={(e) => set("title", e.target.value)} /></Field></div>
    <Field label="Introduction"><textarea className={fieldClass} rows={5} value={form.customBio} onChange={(e) => set("customBio", e.target.value)} /></Field>
    <EditorSection title="Contact Details" description="Shown on the public contact card when enabled."><Toggle label="Show contact details" checked={form.showContactDetails} onChange={(v) => set("showContactDetails", v)} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Email"><input className={fieldClass} value={advisor.email} readOnly /></Field><Field label="Phone number"><input className={fieldClass} value={form.contactNumber} onChange={(e) => set("contactNumber", e.target.value)} placeholder="+27..." /></Field><Field label="Location / Office"><input className={fieldClass} value={form.location} onChange={(e) => set("location", e.target.value)} /></Field><Field label="Working hours"><input className={fieldClass} value={form.workingHours} onChange={(e) => set("workingHours", e.target.value)} placeholder="Mon–Fri 08:00–17:00" /></Field></div></EditorSection>
    <div><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-white/45">Services shown</p><span className="rounded-full bg-[#b34dcc]/15 px-2 py-1 text-[10px] font-semibold text-[#e398f2]">{form.individualServices.length} selected</span></div><div className="grid gap-2 sm:grid-cols-2">{serviceGroups.map((group) => { const selected = form.individualServices.includes(group.title); return <button key={group.title} type="button" onClick={() => toggleService(group.title)} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm ${selected ? "border-[#b34dcc]/60 bg-[#b34dcc]/15" : "border-white/10 bg-black/15 text-white/55"}`}><span className={`grid h-5 w-5 place-items-center rounded-full ${selected ? "bg-[#b34dcc]" : "border border-white/20"}`}>{selected && <Check className="h-3 w-3" />}</span>{group.title}</button>; })}</div></div>
    <Field label="Website"><input className={fieldClass} value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://" /></Field>
    <EditorSection title="Profile Elements" description="Core actions shown on the public card."><Toggle label="QR Code" checked={form.showQrCode} onChange={(v) => set("showQrCode", v)} /><Toggle label="Call Back Button" checked={form.showCallbackLink} onChange={(v) => set("showCallbackLink", v)} /><Toggle label="Refer Friends Button" checked={form.showReferralsLink} onChange={(v) => set("showReferralsLink", v)} /></EditorSection>
    <EditorSection title="Financial Dashboard" description="Interactive financial health snapshot."><Toggle label="Show Financial Dashboard" checked={form.showFinancialDashboard} onChange={(v) => set("showFinancialDashboard", v)} /></EditorSection>
    <EditorSection title="Profile Displays" description="Live data and content displayed on the public profile."><Toggle label="Live News Feed" checked={form.showMoneywebFeed} onChange={(v) => set("showMoneywebFeed", v)} /><Toggle label="More Finance News" checked={form.showSecondNews} onChange={(v) => set("showSecondNews", v)} /><Toggle label="Live Exchange Rates" checked={form.showForex} onChange={(v) => set("showForex", v)} /><Toggle label="Financial Facts of the Day" checked={form.showFunFacts} onChange={(v) => set("showFunFacts", v)} /><Toggle label="Emergency Contacts" checked={form.showEmergencyContacts} onChange={(v) => set("showEmergencyContacts", v)} /><Toggle label="Live Markets (TradingView)" checked={form.showTradingView} onChange={(v) => set("showTradingView", v)} /></EditorSection>
    <EditorSection title="Interactive Financial Tools" description="Choose the interactive tools shown on the profile."><Toggle label="Show Interactive Financial Tools" checked={form.showInteractive} onChange={(v) => set("showInteractive", v)} /><Toggle label="Rotate one tool every few hours" checked={form.rotateInteractiveTools} onChange={(v) => set("rotateInteractiveTools", v)} /><Toggle label="Real Money Squeeze" checked={form.showShowpieceSqueeze} onChange={(v) => set("showShowpieceSqueeze", v)} /><Toggle label="Tax Bite" checked={form.showShowpieceTaxBite} onChange={(v) => set("showShowpieceTaxBite", v)} /><Toggle label="Inflation Eats Your Million" checked={form.showShowpieceInflation} onChange={(v) => set("showShowpieceInflation", v)} /><Toggle label="The Cost of Waiting" checked={form.showShowpieceWaiting} onChange={(v) => set("showShowpieceWaiting", v)} /><Toggle label="30-Year Reality Check" checked={form.showToolReality} onChange={(v) => set("showToolReality", v)} /><Toggle label="The Latte Millionaire" checked={form.showToolLatte} onChange={(v) => set("showToolLatte", v)} /></EditorSection>
    <button type="button" disabled={save.isPending || (!isPrimary && !profile && !form.profileSlug)} onClick={() => save.mutate()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b34dcc] py-3 text-sm font-semibold disabled:opacity-50">{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{save.isPending ? "Saving…" : "Save profile"}</button>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5"><span className="text-xs font-semibold uppercase tracking-wider text-white/45">{label}</span>{children}</label>; }
function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-4"><div><h4 className="text-sm font-semibold">{title}</h4><p className="mt-1 text-[11px] text-white/45">{description}</p></div>{children}</section>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <div className="flex items-center justify-between gap-4 text-xs font-medium"><span>{label}</span><button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-[#b34dcc]" : "bg-white/20"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-6" : "left-1"}`} /></button></div>; }
