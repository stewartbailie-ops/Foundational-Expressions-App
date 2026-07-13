import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Check, Loader2, Save, X } from "lucide-react";
import type { Advisor, AdvisorProfile } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { serviceGroups } from "@/data/foundationalProfile";
import { useToast } from "@/hooks/use-toast";

type Props = {
  advisor: Advisor;
  profile?: AdvisorProfile;
  isPrimary?: boolean;
  onDone: () => void;
};

const fieldClass = "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-[#b34dcc]/70";

export function FoundationalProfileEditor({ advisor, profile, isPrimary = false, onDone }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const source = profile ?? advisor;
  const [form, setForm] = useState({
    nickname: source.nickname ?? (isPrimary ? advisor.name : ""),
    profileSlug: source.profileSlug ?? `${advisor.profileSlug}-profile`,
    title: source.title ?? "",
    customBio: source.customBio ?? source.bio ?? "",
    profilePicUrl: source.profilePicUrl ?? "",
    websiteUrl: source.websiteUrl ?? "",
    linkedinUrl: source.linkedinUrl ?? "",
    facebookUrl: source.facebookUrl ?? "",
    instagramUrl: source.instagramUrl ?? "",
    youtubeUrl: source.youtubeUrl ?? "",
    individualServices: source.individualServices?.filter((name) => serviceGroups.some((group) => group.title === name)) ?? serviceGroups.map((group) => group.title),
  });
  const [uploading, setUploading] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nickname: form.nickname.trim() || null,
        title: form.title.trim() || null,
        customBio: form.customBio.trim() || null,
        profilePicUrl: form.profilePicUrl || null,
        websiteUrl: form.websiteUrl.trim() || null,
        linkedinUrl: form.linkedinUrl.trim() || null,
        facebookUrl: form.facebookUrl.trim() || null,
        instagramUrl: form.instagramUrl.trim() || null,
        youtubeUrl: form.youtubeUrl.trim() || null,
        individualServices: form.individualServices,
        showCallbackLink: true,
        showQrCode: true,
        showHeader: true,
        showProfilePic: true,
        showIntro: true,
        showIndividualServices: true,
        showSocials: true,
      };
      if (isPrimary) return apiRequest("PATCH", `/api/advisors/${advisor.id}`, payload);
      if (profile) return apiRequest("PATCH", `/api/advisors/${advisor.id}/profiles/${profile.id}`, payload);
      return apiRequest("POST", `/api/advisors/${advisor.id}/profiles`, { ...payload, profileSlug: form.profileSlug.trim(), advisorId: advisor.id });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/advisors/slug/${advisor.profileSlug}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/advisors/${advisor.id}/profiles`] }),
        queryClient.invalidateQueries({ queryKey: ["public-foundational-advisor"] }),
      ]);
      toast({ title: "Profile saved", description: "The public contact card has been updated." });
      onDone();
    },
    onError: (error: Error) => toast({ title: "Unable to save profile", description: error.message, variant: "destructive" }),
  });

  const set = (key: keyof typeof form, value: string | string[]) => setForm((current) => ({ ...current, [key]: value }));
  const toggleService = (title: string) => set("individualServices", form.individualServices.includes(title) ? form.individualServices.filter((item) => item !== title) : [...form.individualServices, title]);

  async function uploadPhoto(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData(); body.append("file", file);
      const response = await fetch("/api/upload/profile-pic", { method: "POST", body, credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");
      set("profilePicUrl", data.url);
    } catch (error) {
      toast({ title: "Photo upload failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally { setUploading(false); }
  }

  return <div className="space-y-5 rounded-xl border border-[#b34dcc]/35 bg-black/15 p-4 text-white">
    <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">{isPrimary ? "Edit primary card" : profile ? "Edit profile" : "Create profile"}</h3><p className="mt-1 text-xs text-white/45">Only options used by the Foundational Expressions card are shown.</p></div><button onClick={onDone} className="rounded-lg p-2 text-white/50 hover:bg-white/5"><X className="h-4 w-4" /></button></div>
    <div className="flex flex-wrap items-center gap-4"><div className="grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/25">{form.profilePicUrl ? <img src={form.profilePicUrl} alt="Profile" className="h-full w-full object-cover" /> : <Camera className="h-6 w-6 text-white/30" />}</div><div className="space-y-2"><input ref={fileRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPhoto(event.target.files?.[0])} /><button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black" disabled={uploading}>{uploading ? "Uploading…" : "Upload photo"}</button>{form.profilePicUrl && <button type="button" onClick={() => set("profilePicUrl", "")} className="ml-2 text-xs text-white/45">Remove</button>}</div></div>
    <div className="grid gap-4 sm:grid-cols-2"><Label text="Profile name"><input className={fieldClass} value={form.nickname} onChange={(e) => set("nickname", e.target.value)} placeholder="Erika" /></Label>{!isPrimary && !profile && <Label text="Profile URL"><div className="flex items-center rounded-xl border border-white/10 bg-black/20"><span className="pl-3 text-xs text-white/35">card…/</span><input className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm outline-none" value={form.profileSlug} onChange={(e) => set("profileSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} /></div></Label>}<Label text="Professional title"><input className={fieldClass} value={form.title} onChange={(e) => set("title", e.target.value)} /></Label></div>
    <Label text="Introduction"><textarea className={fieldClass} rows={5} value={form.customBio} onChange={(e) => set("customBio", e.target.value)} placeholder="A short introduction for this profile…" /></Label>
    <div><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-white/45">Services shown</p><span className="rounded-full bg-[#b34dcc]/15 px-2 py-1 text-[10px] font-semibold text-[#e398f2]">{form.individualServices.length} selected</span></div><div className="grid gap-2 sm:grid-cols-2">{serviceGroups.map((group) => { const selected = form.individualServices.includes(group.title); return <button key={group.title} type="button" onClick={() => toggleService(group.title)} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm ${selected ? "border-[#b34dcc]/60 bg-[#b34dcc]/15" : "border-white/10 bg-black/15 text-white/55"}`}><span className={`grid h-5 w-5 place-items-center rounded-full ${selected ? "bg-[#b34dcc]" : "border border-white/20"}`}>{selected && <Check className="h-3 w-3" />}</span>{group.title}</button>; })}</div><p className="mt-2 text-[11px] text-white/35">Only selected categories appear on the public card after saving.</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><UrlField label="Website" value={form.websiteUrl} onChange={(value) => set("websiteUrl", value)} /><UrlField label="LinkedIn" value={form.linkedinUrl} onChange={(value) => set("linkedinUrl", value)} /><UrlField label="Facebook" value={form.facebookUrl} onChange={(value) => set("facebookUrl", value)} /><UrlField label="Instagram" value={form.instagramUrl} onChange={(value) => set("instagramUrl", value)} /><UrlField label="YouTube" value={form.youtubeUrl} onChange={(value) => set("youtubeUrl", value)} /></div>
    <button type="button" disabled={save.isPending || (!isPrimary && !profile && !form.profileSlug)} onClick={() => save.mutate()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b34dcc] py-3 text-sm font-semibold text-white disabled:opacity-50">{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{save.isPending ? "Saving…" : "Save profile"}</button>
  </div>;
}

function Label({ text, children }: { text: string; children: React.ReactNode }) { return <label className="grid gap-1.5"><span className="text-xs font-semibold uppercase tracking-wider text-white/45">{text}</span>{children}</label>; }
function UrlField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Label text={label}><input className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://" /></Label>; }
