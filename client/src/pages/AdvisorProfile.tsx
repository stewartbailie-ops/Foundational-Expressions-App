import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, AlertCircle, ChevronDown, ChevronUp, Linkedin, Globe, Phone, Users } from "lucide-react";
import type { Advisor } from "@shared/schema";
import { BIO_OPTIONS, INDIVIDUAL_SERVICES, CORPORATE_SERVICES } from "@shared/schema";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ServiceDropdown({
  service,
  isDark,
  accentColor,
}: {
  service: { key: string; name: string; description: string };
  isDark: boolean;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{
        borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(190,24,93,0.2)",
        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
      }}
      data-testid={`service-${service.key}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ color: isDark ? "#ffffff" : "#1a1a1a" }}
        data-testid={`button-toggle-${service.key}`}
      >
        <span className="font-medium text-sm">{service.name}</span>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </button>
      {open && (
        <div
          className="px-4 pb-3 text-sm leading-relaxed"
          style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)" }}
          data-testid={`description-${service.key}`}
        >
          {service.description}
        </div>
      )}
    </div>
  );
}

export default function AdvisorProfile() {
  const [, params] = useRoute("/profile/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug || "";

  const { data: advisor, isLoading, error } = useQuery<Advisor>({
    queryKey: [`/api/advisors/slug/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (error || !advisor) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold" data-testid="text-not-found">Advisor Not Found</h2>
          <p className="text-muted-foreground text-sm" data-testid="text-not-found-message">
            The advisor profile you're looking for doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  if (!advisor.active) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold" data-testid="text-unavailable">Advisor Unavailable</h2>
          <p className="text-muted-foreground text-sm" data-testid="text-unavailable-message">
            This advisor's profile is not currently active.
          </p>
        </div>
      </div>
    );
  }

  const isDark = advisor.theme !== "pink";
  const accentColor = isDark ? "#ffffff" : "#be185d";
  const bgColor = isDark ? "#0a0a0a" : "#fff0f5";
  const cardBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)";
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const mutedText = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const sectionTitle = isDark ? "rgba(255,255,255,0.85)" : "#be185d";

  const bioText =
    advisor.bioOption === "custom"
      ? advisor.customBio
      : BIO_OPTIONS[advisor.bioOption || "a"] || "";

  const individualServices = INDIVIDUAL_SERVICES.filter((s) =>
    advisor.individualServices?.includes(s.key)
  );
  const corporateServices = CORPORATE_SERVICES.filter((s) =>
    advisor.corporateServices?.includes(s.key)
  );

  const profileUrl = `advisoryconnect.pro/${advisor.profileSlug}`;
  const initials = getInitials(advisor.name);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: bgColor, color: textColor }}
      data-testid="profile-container"
    >
      <div className="max-w-md mx-auto px-5 py-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4" data-testid="profile-header">
          {advisor.profilePicUrl ? (
            <img
              src={advisor.profilePicUrl}
              alt={advisor.name}
              className="w-28 h-28 rounded-full object-cover border-2"
              style={{ borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(190,24,93,0.3)" }}
              data-testid="img-profile-pic"
            />
          ) : (
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(190,24,93,0.15)",
                color: accentColor,
                border: `2px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(190,24,93,0.3)"}`,
              }}
              data-testid="icon-initials"
            >
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-advisor-name">
              {advisor.name}
            </h1>
            {advisor.title && (
              <p className="text-sm mt-1" style={{ color: mutedText }} data-testid="text-advisor-title">
                {advisor.title}
              </p>
            )}
          </div>
        </div>

        {bioText && (
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: cardBg }}
            data-testid="section-bio"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: sectionTitle }}>
              Introduction
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: mutedText }} data-testid="text-bio">
              {bioText}
            </p>
          </div>
        )}

        {individualServices.length > 0 && (
          <div data-testid="section-individual-services">
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
              style={{ color: sectionTitle }}
            >
              Individual Services
            </h2>
            <div className="space-y-2">
              {individualServices.map((s) => (
                <ServiceDropdown key={s.key} service={s} isDark={isDark} accentColor={accentColor} />
              ))}
            </div>
          </div>
        )}

        {corporateServices.length > 0 && (
          <div data-testid="section-corporate-services">
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
              style={{ color: sectionTitle }}
            >
              Corporate Services
            </h2>
            <div className="space-y-2">
              {corporateServices.map((s) => (
                <ServiceDropdown key={s.key} service={s} isDark={isDark} accentColor={accentColor} />
              ))}
            </div>
          </div>
        )}

        {advisor.linkedinUrl && (
          <div data-testid="section-socials">
            <a
              href={advisor.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(190,24,93,0.12)",
                color: accentColor,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(190,24,93,0.2)"}`,
              }}
              data-testid="link-linkedin"
            >
              <Linkedin className="h-4 w-4" />
              Connect on LinkedIn
            </a>
          </div>
        )}

        {advisor.websiteUrl && (
          <a
            href={advisor.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium text-sm transition-opacity hover:opacity-80"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(190,24,93,0.12)",
              color: accentColor,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(190,24,93,0.2)"}`,
            }}
            data-testid="link-website"
          >
            <Globe className="h-4 w-4" />
            Visit Website
          </a>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate(`/profile/${slug}/request-callback`)}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            style={{
              backgroundColor: isDark ? "#ffffff" : "#be185d",
              color: isDark ? "#000000" : "#ffffff",
            }}
            data-testid="button-request-callback"
          >
            <Phone className="h-4 w-4" />
            Request a Call Back
          </button>
          <button
            onClick={() => navigate(`/profile/${slug}/referrals`)}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            style={{
              backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(190,24,93,0.15)",
              color: accentColor,
              border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(190,24,93,0.3)"}`,
            }}
            data-testid="button-refer-friends"
          >
            <Users className="h-4 w-4" />
            Refer Friends & Family
          </button>
        </div>

        <div className="flex flex-col items-center pt-4 space-y-3" data-testid="section-qr">
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: "#ffffff" }}
          >
            <QRCodeSVG
              value={`https://${profileUrl}`}
              size={200}
              level="M"
              data-testid="qr-code"
            />
          </div>
          <p className="text-xs" style={{ color: mutedText }} data-testid="text-profile-url">
            {profileUrl}
          </p>
        </div>

        <p className="text-center text-xs pt-4 pb-2" style={{ color: mutedText }}>
          Powered by Advisory Connect
        </p>
      </div>
    </div>
  );
}