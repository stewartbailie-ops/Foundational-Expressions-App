export type ServiceGroup = {
  title: string;
  intro: string;
  services: Array<{
    name: string;
    description: string;
  }>;
};

export const foundationalProfile = {
  name: "Erica",
  initials: "FE",
  brand: "Foundational Expressions",
  title: "Financial Planning, Coaching and Wellness Guidance",
  tagline: "Building your financial foundation",
  intro:
    "A calm, human-first profile for people who want practical support with money decisions, personal growth, financial habits and long-term planning.",
  phoneDisplay: import.meta.env.VITE_PROFILE_PHONE_DISPLAY?.trim() ?? "",
  phoneHref: import.meta.env.VITE_PROFILE_PHONE?.replace(/[^+\d]/g, "") ?? "",
  email: import.meta.env.VITE_PROFILE_EMAIL?.trim() ?? "",
  location: "South Africa",
  website: import.meta.env.VITE_PROFILE_WEBSITE?.trim() ?? "",
  profileUrl: import.meta.env.VITE_PROFILE_URL?.trim() || window.location.origin,
  whatsappHref: import.meta.env.VITE_PROFILE_WHATSAPP?.trim() ?? "",
  socials: {
    linkedin: "",
    facebook: "",
    instagram: "",
    youtube: "",
  },
};

export const serviceGroups: ServiceGroup[] = [
  {
    title: "Financial Planning",
    intro:
      "Structured advice across protection, retirement, investment planning and estate conversations, with the goal of helping clients make clear and confident decisions.",
    services: [
      {
        name: "Personal Cover",
        description:
          "Life, disability, illness, bond cover and buy-and-sell planning for personal protection and family continuity.",
      },
      {
        name: "Business Assurance",
        description:
          "Contingent liability and key person cover for business owners who need practical continuity and protection planning.",
      },
      {
        name: "Risk Planning",
        description:
          "A guided look at personal and business risk so the right protection is in place before life becomes complicated.",
      },
      {
        name: "Investment Solutions",
        description:
          "Support with investment products and long-term wealth planning, aligned to goals, time horizon and risk comfort.",
      },
      {
        name: "Retirement Planning",
        description:
          "Savings, retirement annuity builders, living annuities, life annuities and post-retirement planning conversations.",
      },
      {
        name: "Corporate Group Benefits",
        description:
          "Pension, provident and group-risk benefit conversations for teams and business structures.",
      },
      {
        name: "Wills and Estates",
        description:
          "Guidance around wills, estates and the practical steps needed to protect family intent and reduce uncertainty.",
      },
    ],
  },
  {
    title: "Financial Coaching",
    intro:
      "Practical, non-judgemental coaching for people who want to understand their money, build better habits and reduce financial stress.",
    services: [
      {
        name: "Budgeting and Organising Finances",
        description:
          "Create a clearer money picture with budgeting, expense tracking, savings planning and debt-management habits.",
      },
      {
        name: "Debt Freedom Planning",
        description:
          "Build a workable path toward living debt free, saving consistently and protecting momentum with an emergency buffer.",
      },
      {
        name: "Psychology of Spending",
        description:
          "Explore the emotions, beliefs and patterns that influence spending so money decisions become more intentional.",
      },
      {
        name: "Financial Health",
        description:
          "Review the bigger picture: income, expenses, debt, net worth, goals and the next practical step forward.",
      },
    ],
  },
  {
    title: "Life Coaching",
    intro:
      "Support for clients who want to set direction, overcome limiting patterns and build the confidence to follow through.",
    services: [
      {
        name: "Money Habits and Beliefs",
        description:
          "Take control of finance-related beliefs and habits through reflection, coaching and practical accountability.",
      },
      {
        name: "Goals and Direction",
        description:
          "Clarify goals, choose priorities and translate future ideas into grounded next actions.",
      },
      {
        name: "Overcoming Obstacles",
        description:
          "Work through the blocks that slow progress, including motivation dips, uncertainty and negative patterns.",
      },
      {
        name: "Personal Growth",
        description:
          "A development-focused space for limiting beliefs, emotional awareness, confidence and personal momentum.",
      },
      {
        name: "Motivation and Accountability",
        description:
          "Ongoing check-ins and support to help clients stay consistent while they build new patterns.",
      },
    ],
  },
  {
    title: "Wellness Coaching",
    intro:
      "Wellness support for people who want a healthier relationship with stress, boundaries, lifestyle choices and burnout prevention.",
    services: [
      {
        name: "Break Barriers",
        description:
          "Identify negative personal patterns that hold progress back and replace them with healthier choices.",
      },
      {
        name: "Manage Stress",
        description:
          "Tools and routines for managing stress in a way that supports work, family, money and personal wellbeing.",
      },
      {
        name: "Prevent Burnout",
        description:
          "Build realistic balance, recovery habits and boundaries before exhaustion becomes the default.",
      },
      {
        name: "Lifestyle Choices",
        description:
          "Support with informed lifestyle decisions that strengthen overall wellbeing and day-to-day resilience.",
      },
    ],
  },
];

export function buildVCard() {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${foundationalProfile.name} - ${foundationalProfile.brand}`,
    `ORG:${foundationalProfile.brand}`,
    `TITLE:${foundationalProfile.title}`,
    foundationalProfile.phoneHref && `TEL;TYPE=CELL:${foundationalProfile.phoneHref}`,
    foundationalProfile.email && `EMAIL:${foundationalProfile.email}`,
    foundationalProfile.website && `URL:${foundationalProfile.website}`,
    `ADR;TYPE=WORK:;;;;;${foundationalProfile.location}`,
    "END:VCARD",
  ].filter(Boolean).join("\r\n");
}
