import { useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { foundationalProfile, serviceGroups } from "@/data/foundationalProfile";

export default function FoundationalCallback() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    time: "Any time",
    area: "Not sure yet",
    message: "",
  });

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const subject = encodeURIComponent("Callback request - Foundational Expressions");
  const body = encodeURIComponent(
    [
      "New callback request",
      "",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      `Preferred time: ${form.time}`,
      `Area of interest: ${form.area}`,
      "",
      "Message:",
      form.message,
    ].join("\n"),
  );
  const canSend = Boolean(foundationalProfile.email && form.name.trim() && form.phone.trim());

  return (
    <main className="min-h-screen bg-[#050506] px-5 py-6 text-white sm:px-8">
      <div className="fe-ambient" aria-hidden="true" />
      <div className="relative mx-auto max-w-3xl">
        <a className="inline-flex items-center gap-2 text-sm text-white/58 hover:text-white" href="/">
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </a>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d979ef]">
            Request Callback
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
            Let Erica know where to start.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/62">
            Share a few details and open a ready-to-send email request. Your information stays on your device until you choose to send it.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="fe-field">
                <span>Name</span>
                <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Your name" />
              </label>
              <label className="fe-field">
                <span>Phone</span>
                <input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+27..." />
              </label>
            </div>

            <label className="fe-field">
              <span>Email</span>
              <input value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="you@example.com" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="fe-field">
                <span>Preferred time</span>
                <select value={form.time} onChange={(event) => update("time", event.target.value)}>
                  <option>Any time</option>
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                </select>
              </label>
              <label className="fe-field">
                <span>Area of interest</span>
                <select value={form.area} onChange={(event) => update("area", event.target.value)}>
                  <option>Not sure yet</option>
                  {serviceGroups.map((group) => (
                    <option key={group.title}>{group.title}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="fe-field">
              <span>Message</span>
              <textarea value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="A short note about what you need help with..." rows={5} />
            </label>

            <a
              aria-disabled={!canSend}
              className={`fe-action justify-center ${
                canSend ? "bg-[#b34dcc] text-white hover:bg-[#c767df]" : "pointer-events-none bg-white/10 text-white/35"
              }`}
              href={foundationalProfile.email ? `mailto:${foundationalProfile.email}?subject=${subject}&body=${body}` : undefined}
            >
              <Send className="h-4 w-4" />
              Send request
            </a>

            {foundationalProfile.email && <a className="inline-flex items-center justify-center gap-2 text-sm text-white/55 hover:text-white" href={`mailto:${foundationalProfile.email}`}>
              <Mail className="h-4 w-4" />
              Or email directly
            </a>}
          </form>
        </section>
      </div>
    </main>
  );
}
