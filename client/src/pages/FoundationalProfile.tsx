import { useMemo, useState } from "react";
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

function downloadContact() {
  const blob = new Blob([buildVCard()], { type: "text/vcard;charset=utf-8" });
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
    <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#c368d7]">
          Service Focus
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
          {group.title}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/62">{group.intro}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
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
  const [activeGroup, setActiveGroup] = useState(serviceGroups[0].title);
  const selectedGroup = useMemo(
    () => serviceGroups.find((group) => group.title === activeGroup) ?? serviceGroups[0],
    [activeGroup],
  );

  return (
    <main className="min-h-screen overflow-hidden bg-[#050506] text-white">
      <div className="fe-ambient" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-6 sm:px-8 lg:py-10">
        <header className="flex items-center justify-between gap-4">
          <a className="flex items-center gap-3" href="/">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#b34dcc]/35 bg-[#b34dcc]/12 font-serif text-2xl text-[#d979ef] shadow-[0_0_34px_rgba(179,77,204,0.25)]">
              J
            </span>
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
            className="hidden rounded-full border border-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 transition hover:bg-white/[0.06] sm:block"
            href="/request-callback"
          >
            Request Callback
          </a>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-center">
          <div className="pt-6 sm:pt-10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c368d7]">
              {foundationalProfile.tagline}
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[0.98] tracking-normal text-white sm:text-7xl">
              {foundationalProfile.brand}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/66 sm:text-lg">
              {foundationalProfile.intro}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
              <PrimaryAction href={`tel:${foundationalProfile.phoneHref}`} icon={<Phone className="h-4 w-4" />} label="Call Erika" />
              <PrimaryAction href={foundationalProfile.whatsappHref} icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" variant="secondary" />
              <PrimaryAction href={`mailto:${foundationalProfile.email}`} icon={<Mail className="h-4 w-4" />} label="Email" variant="secondary" />
              <PrimaryAction onClick={downloadContact} icon={<Download className="h-4 w-4" />} label="Save Contact" variant="secondary" />
            </div>
          </div>

          <aside className="fe-card rounded-[2rem] border border-white/12 bg-white/[0.055] p-5 shadow-2xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/45 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#d979ef]">Advisor Card</p>
                  <h2 className="mt-3 text-2xl font-semibold">{foundationalProfile.name}</h2>
                  <p className="mt-2 text-sm leading-5 text-white/58">{foundationalProfile.title}</p>
                </div>
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#b34dcc]/16 font-serif text-4xl text-[#d979ef]">
                  J
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-white/68">
                <a className="flex items-center gap-3" href={`tel:${foundationalProfile.phoneHref}`}>
                  <Phone className="h-4 w-4 text-[#d979ef]" />
                  {foundationalProfile.phoneDisplay}
                </a>
                <a className="flex items-center gap-3" href={`mailto:${foundationalProfile.email}`}>
                  <Mail className="h-4 w-4 text-[#d979ef]" />
                  {foundationalProfile.email}
                </a>
                <a className="flex items-center gap-3" href={foundationalProfile.website}>
                  <Globe className="h-4 w-4 text-[#d979ef]" />
                  foundationalexpressions.com
                </a>
                <span className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-[#d979ef]" />
                  {foundationalProfile.location}
                </span>
              </div>

              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="rounded-xl bg-white p-2">
                  <QRCodeSVG value={foundationalProfile.profileUrl} size={92} />
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

        <section className="grid gap-4 sm:grid-cols-3">
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
          <div className="flex flex-wrap gap-2">
            {serviceGroups.map((group) => (
              <button
                className={`rounded-full px-4 py-2 text-sm transition ${
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

        <section className="grid gap-5 rounded-[2rem] border border-[#b34dcc]/25 bg-[#b34dcc]/10 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
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
          <a className="fe-action bg-white text-black hover:bg-white/90" href="/request-callback">
            <CalendarClock className="h-4 w-4" />
            <span>Request Callback</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </div>
    </main>
  );
}
