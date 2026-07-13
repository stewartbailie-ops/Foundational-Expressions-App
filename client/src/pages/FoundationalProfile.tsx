import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  CalendarClock,
  Download,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import {
  buildVCard,
  foundationalProfile,
  serviceGroups,
  type ServiceGroup,
} from "@/data/foundationalProfile";
import type { Advisor } from "@shared/schema";

function downloadContact(vcard: string) {
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "foundational-expressions-erika.vcf";
  link.click();
  URL.revokeObjectURL(url);
}

function PrimaryAction({
  href,
  onClick,
  icon,
  label,
  variant = "primary",
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "bg-[#b34dcc] text-white shadow-[0_18px_42px_rgba(179,77,204,0.32)] hover:bg-[#c767df]"
      : "border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]";

  const content = (
    <>
      {icon}
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a className={`fe-action ${className}`} href={href}>
        {content}
      </a>
    );
  }

  return (
    <button className={`fe-action ${className}`} onClick={onClick} type="button">
      {content}
    </button>
  );
}

function ServicePanel({ group }: { group: ServiceGroup }) {
  return (
    <section className="grid gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c368d7]">
          Service Focus
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
          {group.title}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/62">{group.intro}</p>
      </div>
      <div className="grid gap-3 min-[520px]:grid-cols-2">
        {group.services.map((service) => (
          <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-4" key={service.name}>
            <h3 className="text-sm font-semibold text-white">{service.name}</h3>
            <p className="mt-2 text-xs leading-5 text-white/58">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function FoundationalProfile() {
  const [, routeParams] = useRoute<{ slug: string }>("/:slug");
  const slug = routeParams?.slug || "erika";
  const [activeGroup, setActiveGroup] = useState(serviceGroups[0].title);
  const { data: savedAdvisor } = useQuery<Advisor | null>({
    queryKey: ["public-foundational-advisor", slug],
    queryFn: async () => {
      const response = await fetch(`/api/advisors/slug/${encodeURIComponent(slug)}`, { cache: "no-store" });
      if (response.status === 404 || response.status === 410) return null;
      if (!response.ok) throw new Error("Unable to load saved profile");
      return response.json();
    },
    retry: false,
  });
  const phone = savedAdvisor?.contactNumber?.trim() || foundationalProfile.phoneDisplay;
  const phoneHref = phone.replace(/[^+\d]/g, "") || foundationalProfile.phoneHref;
  const email = savedAdvisor?.email || foundationalProfile.email;
  const website = savedAdvisor?.websiteUrl || foundationalProfile.website;
  const location = savedAdvisor?.location || foundationalProfile.location;
  const profile = {
    ...foundationalProfile,
    name: savedAdvisor?.nickname || savedAdvisor?.name || foundationalProfile.name,
    title: savedAdvisor?.title || foundationalProfile.title,
    intro: savedAdvisor?.customBio || savedAdvisor?.bio || foundationalProfile.intro,
    phoneDisplay: phone,
    phoneHref,
    email,
    location,
    website,
    profilePicUrl: savedAdvisor?.profilePicUrl || "",
    whatsappHref: phoneHref ? `https://wa.me/${phoneHref.replace(/^\+/, "")}` : foundationalProfile.whatsappHref,
    socials: {
      linkedin: savedAdvisor?.linkedinUrl || foundationalProfile.socials.linkedin,
      facebook: savedAdvisor?.facebookUrl || foundationalProfile.socials.facebook,
      instagram: savedAdvisor?.instagramUrl || foundationalProfile.socials.instagram,
      youtube: savedAdvisor?.youtubeUrl || foundationalProfile.socials.youtube,
    },
  };
  const configuredServices = savedAdvisor?.individualServices ?? [];
  const visibleServiceGroups = configuredServices.length
    ? serviceGroups.filter((group) => configuredServices.includes(group.title))
    : serviceGroups;
  const socialLinks = [
    ["LinkedIn", profile.socials.linkedin],
    ["Facebook", profile.socials.facebook],
    ["Instagram", profile.socials.instagram],
    ["YouTube", profile.socials.youtube],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const activeServiceGroup = visibleServiceGroups.some((group) => group.title === activeGroup)
    ? activeGroup
    : visibleServiceGroups[0]?.title ?? serviceGroups[0].title;
  const vcard = savedAdvisor
    ? ["BEGIN:VCARD", "VERSION:3.0", `FN:${profile.name} - ${profile.brand}`, `ORG:${profile.brand}`, `TITLE:${profile.title}`, `TEL;TYPE=CELL:${profile.phoneHref}`, `EMAIL:${profile.email}`, `URL:${profile.website}`, `ADR;TYPE=WORK:;;;;;${profile.location}`, "END:VCARD"].join("\n")
    : buildVCard();
  const selectedGroup = useMemo(
    () => visibleServiceGroups.find((group) => group.title === activeServiceGroup) ?? serviceGroups[0],
    [activeServiceGroup, visibleServiceGroups],
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#050506] text-white">
      <div className="fe-ambient" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-4 sm:gap-9 sm:px-6 sm:py-6">
        <header className="flex items-center justify-between gap-4">
          <a className="flex items-center gap-3" href="/">
            <img src="/branding/foundational-expressions-logo.png" alt="Foundational Expressions" className="h-14 w-14 rounded-2xl border border-white/10 object-cover shadow-[0_0_34px_rgba(179,77,204,0.2)]" />
            <span>
              <span className="block text-sm font-semibold tracking-[0.18em] text-white">
                FOUNDATIONAL
              </span>
              <span className="block text-xs tracking-[0.26em] text-white/55">
                EXPRESSIONS
              </span>
            </span>
          </a>
          <a
            className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70 transition hover:bg-white/[0.06] sm:px-4 sm:text-xs sm:tracking-[0.16em]"
            href={`/${slug}/request-callback`}
          >
            Request Callback
          </a>
        </header>

        <section className="grid gap-5 sm:gap-7">
          <div className="pt-2 sm:pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c368d7]">
              {profile.tagline}
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-[0.98] tracking-normal text-white min-[390px]:text-5xl sm:text-7xl">
              {profile.brand}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/66 sm:text-lg">
              {profile.intro}
            </p>
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-3 lg:max-w-2xl">
              <PrimaryAction href={`tel:${profile.phoneHref}`} icon={<Phone className="h-4 w-4" />} label={`Call ${profile.name.split(" ")[0]}`} />
              <PrimaryAction href={profile.whatsappHref} icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" variant="secondary" />
              <PrimaryAction href={`mailto:${profile.email}`} icon={<Mail className="h-4 w-4" />} label="Email" variant="secondary" />
              <PrimaryAction onClick={() => downloadContact(vcard)} icon={<Download className="h-4 w-4" />} label="Save Contact" variant="secondary" />
            </div>
          </div>

          <aside className="fe-card order-first rounded-[1.5rem] border border-white/12 bg-white/[0.055] p-3 shadow-2xl sm:rounded-[2rem] sm:p-5">
            <div className="rounded-[1.25rem] border border-white/10 bg-black/45 p-4 sm:rounded-[1.5rem] sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#d979ef]">Advisor Card</p>
                  <h2 className="mt-3 text-2xl font-semibold">{profile.name}</h2>
                  <p className="mt-2 text-sm leading-5 text-white/58">{profile.title}</p>
                </div>
                {profile.profilePicUrl ? (
                  <img className="h-20 w-20 rounded-2xl border border-white/10 object-cover" src={profile.profilePicUrl} alt={profile.name} />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#b34dcc]/16 font-serif text-4xl text-[#d979ef]">
                    {profile.name.slice(0, 1)}
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-3 text-sm text-white/68">
                <a className="flex items-center gap-3" href={`tel:${profile.phoneHref}`}>
                  <Phone className="h-4 w-4 text-[#d979ef]" />
                  {profile.phoneDisplay}
                </a>
                <a className="flex items-center gap-3" href={`mailto:${profile.email}`}>
                  <Mail className="h-4 w-4 text-[#d979ef]" />
                  {profile.email}
                </a>
                <a className="flex items-center gap-3" href={profile.website}>
                  <Globe className="h-4 w-4 text-[#d979ef]" />
                  foundationalexpressions.com
                </a>
                <span className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-[#d979ef]" />
                  {profile.location}
                </span>
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {socialLinks.map(([label, url]) => (
                    <a key={label} href={url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 transition hover:bg-white/[0.06] hover:text-white">
                      {label}
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 min-[380px]:flex-row min-[380px]:items-center">
                <div className="rounded-xl bg-white p-2">
                  <QRCodeSVG value={`${window.location.origin}/${slug}`} size={92} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Scan to connect</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">
                    NFC, QR and save-contact ready.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-3 min-[420px]:grid-cols-3 sm:gap-4">
          {[
            ["Protection", ShieldCheck],
            ["Financial Growth", WalletCards],
            ["Life and Wellness", Sparkles],
          ].map(([label, Icon]) => (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5" key={String(label)}>
              <Icon className="h-5 w-5 text-[#d979ef]" />
              <p className="mt-4 text-sm font-semibold text-white">{String(label)}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 sm:p-6">
          <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleServiceGroups.map((group) => (
              <button
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                  group.title === activeGroup
                    ? "bg-[#b34dcc] text-white"
                    : "border border-white/10 bg-black/25 text-white/62 hover:text-white"
                }`}
                key={group.title}
                onClick={() => setActiveGroup(group.title)}
                type="button"
              >
                {group.title}
              </button>
            ))}
          </div>
          <div className="mt-8">
            <ServicePanel group={selectedGroup} />
          </div>
        </section>

        <section className="grid gap-5 rounded-[2rem] border border-[#b34dcc]/25 bg-[#b34dcc]/10 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d979ef]">
              Start with a conversation
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Not sure which service fits yet?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
              The first step can simply be a callback to understand where you are and what kind of support would help most.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <a className="fe-action bg-white text-black hover:bg-white/90" href={`/${slug}/request-callback`}>
              <CalendarClock className="h-4 w-4" />
              <span>Request Callback</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a className="fe-action border border-white/15 bg-black/20 text-white hover:bg-white/[0.07]" href={`/${slug}/referrals`}>
              <span>Refer Someone</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
