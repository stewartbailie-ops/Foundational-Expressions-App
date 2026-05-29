import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Phone, Heart, AlertTriangle, Shield, User, Building2, Stethoscope, BookOpen } from "lucide-react";
import { EMERGENCY_CONTACTS } from "@shared/schema";

type BolData = {
  clientName: string;
  bloodType?: string;
  allergies?: string;
  chronicMedications?: string;
  medicalConditions?: string;
  ec1Name?: string;
  ec1Relation?: string;
  ec1Phone?: string;
  ec2Name?: string;
  ec2Relation?: string;
  ec2Phone?: string;
  medicalAidScheme?: string;
  medicalAidNumber?: string;
  medicalAidPlan?: string;
  medicalAidEmergencyLine?: string;
  gpName?: string;
  gpPhone?: string;
  hospitalPreference?: string;
  paramedicNotes?: string;
  updatedAt?: string;
};

function Section({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}33` }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: color + "18" }}>
        <Icon className="h-4 w-4 shrink-0" style={{ color }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{title}</span>
      </div>
      <div className="px-4 py-3 space-y-2.5 bg-white">{children}</div>
    </div>
  );
}

function Row({ label, value, phone }: { label: string; value?: string | null; phone?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-500 shrink-0 pt-0.5">{label}</span>
      {phone ? (
        <a href={`tel:${value.replace(/\s/g, "")}`} className="text-sm font-semibold text-right flex items-center gap-1.5" style={{ color: "#1d4ed8" }}>
          <Phone className="h-3.5 w-3.5 shrink-0" />
          {value}
        </a>
      ) : (
        <span className="text-sm font-semibold text-right text-gray-900">{value}</span>
      )}
    </div>
  );
}

export default function BookOfLifePage() {
  const params = useParams<{ token: string }>();
  const { data, isLoading, isError } = useQuery<BolData>({
    queryKey: [`/api/bol/${params.token}`],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0f172a" }}>
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-white/60 text-sm">Loading emergency information…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#0f172a" }}>
        <div className="text-center space-y-4 max-w-xs">
          <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#ef444433" }}>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Record Not Found</p>
            <p className="text-white/50 text-sm mt-1">This Book of Life link is invalid or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const d = data;
  const hasEmergencyContacts = d.ec1Name || d.ec2Name;
  const hasMedical = d.bloodType || d.allergies || d.chronicMedications || d.medicalConditions;
  const hasMedicalAid = d.medicalAidScheme || d.medicalAidEmergencyLine;
  const hasGP = d.gpName || d.gpPhone;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      {/* Emergency header */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: "#dc2626" }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-white fill-white" />
            <span className="text-white font-black text-sm tracking-widest uppercase">Emergency Info</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-white/70" />
            <span className="text-white/70 text-[11px] font-medium">Book of Life</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Name card */}
        <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: "#0f172a" }}>
          <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#dc262633", border: "2px solid #dc262655" }}>
            <User className="h-8 w-8 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white">{d.clientName}</div>
          {d.updatedAt && (
            <div className="text-white/40 text-[11px] mt-1">
              Updated {new Date(d.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          )}
        </div>

        {/* Medical critical info */}
        {hasMedical && (
          <Section icon={AlertTriangle} title="Critical Medical Info" color="#dc2626">
            {d.bloodType && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Blood Type</span>
                <span className="text-2xl font-black" style={{ color: "#dc2626" }}>{d.bloodType}</span>
              </div>
            )}
            <Row label="Allergies" value={d.allergies} />
            <Row label="Chronic Medications" value={d.chronicMedications} />
            <Row label="Medical Conditions" value={d.medicalConditions} />
          </Section>
        )}

        {/* Emergency contacts */}
        {hasEmergencyContacts && (
          <Section icon={Phone} title="Emergency Contacts" color="#2563eb">
            {d.ec1Name && (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-gray-900">{d.ec1Name}</span>
                  {d.ec1Relation && <span className="text-[11px] text-gray-400">{d.ec1Relation}</span>}
                </div>
                {d.ec1Phone && (
                  <a href={`tel:${d.ec1Phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#2563eb" }}>
                    <Phone className="h-3.5 w-3.5" />{d.ec1Phone}
                  </a>
                )}
              </div>
            )}
            {d.ec2Name && (
              <>
                {d.ec1Name && <div className="border-t border-gray-100" />}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-gray-900">{d.ec2Name}</span>
                    {d.ec2Relation && <span className="text-[11px] text-gray-400">{d.ec2Relation}</span>}
                  </div>
                  {d.ec2Phone && (
                    <a href={`tel:${d.ec2Phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#2563eb" }}>
                      <Phone className="h-3.5 w-3.5" />{d.ec2Phone}
                    </a>
                  )}
                </div>
              </>
            )}
          </Section>
        )}

        {/* Medical aid */}
        {hasMedicalAid && (
          <Section icon={Shield} title="Medical Aid" color="#059669">
            <Row label="Scheme" value={d.medicalAidScheme} />
            <Row label="Plan" value={d.medicalAidPlan} />
            <Row label="Membership No." value={d.medicalAidNumber} />
            {d.medicalAidEmergencyLine && (
              <Row label="Emergency Line" value={d.medicalAidEmergencyLine} phone />
            )}
          </Section>
        )}

        {/* GP */}
        {hasGP && (
          <Section icon={Stethoscope} title="Family Doctor (GP)" color="#7c3aed">
            <Row label="Name" value={d.gpName} />
            {d.gpPhone && <Row label="Phone" value={d.gpPhone} phone />}
          </Section>
        )}

        {/* Hospital preference */}
        {d.hospitalPreference && (
          <Section icon={Building2} title="Preferred Hospital" color="#0891b2">
            <div className="text-sm font-semibold text-gray-900">{d.hospitalPreference}</div>
          </Section>
        )}

        {/* Paramedic notes */}
        {d.paramedicNotes && (
          <Section icon={AlertTriangle} title="Paramedic Notes" color="#d97706">
            <p className="text-sm text-gray-800 leading-relaxed">{d.paramedicNotes}</p>
          </Section>
        )}

        {/* SA Emergency Numbers */}
        <Section icon={Phone} title="SA Emergency Numbers" color="#dc2626">
          <div className="grid grid-cols-1 gap-1.5">
            {EMERGENCY_CONTACTS.map(c => (
              <a
                key={c.key}
                href={`tel:${c.number}`}
                className="flex items-center justify-between py-1.5 px-1 rounded-lg active:bg-gray-50"
              >
                <span className="text-xs text-gray-600">{c.label}</span>
                <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: "#dc2626" }}>
                  <Phone className="h-3 w-3" />{c.number}
                </span>
              </a>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="rounded-2xl p-4 text-center space-y-1" style={{ backgroundColor: "#0f172a" }}>
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-4 w-4 text-red-400 fill-red-400" />
            <span className="text-white text-xs font-semibold">Advisory Connect</span>
          </div>
          <p className="text-white/40 text-[11px]">This emergency profile is maintained by a licensed financial advisor.</p>
        </div>
      </div>
    </div>
  );
}
