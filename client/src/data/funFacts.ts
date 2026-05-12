export type FunFactCategory =
  | "Tax"
  | "Retirement"
  | "Wills & Estate"
  | "Investment"
  | "Budgeting & Saving"
  | "Insurance"
  | "Property"
  | "Medical Aid";

export interface FunFact {
  id: number;
  category: FunFactCategory;
  fact: string;
}

export const FUN_FACTS: FunFact[] = [
  // ── TAX (1–45) ────────────────────────────────────────────────────────────
  { id: 1,  category: "Tax", fact: "South Africa's tax year runs from 1 March to 28 February — not the calendar year." },
  { id: 2,  category: "Tax", fact: "You must submit a tax return if you earn more than R500,000 per year from a single employer." },
  { id: 3,  category: "Tax", fact: "The first R40,000 of capital gains per year is exempt from tax for individuals." },
  { id: 4,  category: "Tax", fact: "Interest income up to R23,800 (under 65) or R34,500 (65+) is tax-free per year." },
  { id: 5,  category: "Tax", fact: "Contributions to a retirement annuity are tax-deductible up to 27.5% of your taxable income." },
  { id: 6,  category: "Tax", fact: "South Africa uses a progressive tax system — the more you earn, the higher your marginal rate." },
  { id: 7,  category: "Tax", fact: "The top marginal income tax rate in South Africa is 45%." },
  { id: 8,  category: "Tax", fact: "Dividends received from South African companies are taxed at a flat 20% dividends withholding tax." },
  { id: 9,  category: "Tax", fact: "Estate duty is 20% on dutiable estates up to R30 million, and 25% on amounts above that." },
  { id: 10, category: "Tax", fact: "The estate duty abatement is R3.5 million — estates below this threshold pay no estate duty." },
  { id: 11, category: "Tax", fact: "A surviving spouse inherits the unused portion of their partner's R3.5 million estate duty abatement." },
  { id: 12, category: "Tax", fact: "Donating more than R100,000 per year triggers donations tax at 20% — 25% above R30 million." },
  { id: 13, category: "Tax", fact: "SARS can audit your tax returns for up to five years after submission." },
  { id: 14, category: "Tax", fact: "Working from home? You may be able to claim a portion of rent, electricity, and internet as a tax deduction." },
  { id: 15, category: "Tax", fact: "Capital Gains Tax is not a separate tax — gains are included in your income at a 40% inclusion rate for individuals." },
  { id: 16, category: "Tax", fact: "The effective CGT rate for an individual at the top bracket is 18% — calculated as 40% × 45%." },
  { id: 17, category: "Tax", fact: "Your primary residence CGT exclusion is R2 million — the first R2m of gain on your home is tax-free." },
  { id: 18, category: "Tax", fact: "Medical aid contributions give a tax credit of R364/month for the main member and R246 for the first dependant." },
  { id: 19, category: "Tax", fact: "Retirement annuity contributions made before 28 February can reduce your taxable income for that tax year." },
  { id: 20, category: "Tax", fact: "SARS's eFiling portal lets you file returns, check refund status, and manage your tax affairs online." },
  { id: 21, category: "Tax", fact: "If you are under 65 and earn below R95,750 per year, you pay no income tax." },
  { id: 22, category: "Tax", fact: "South African tax bracket thresholds are adjusted every year in the February Budget Speech." },
  { id: 23, category: "Tax", fact: "A tax directive from SARS is required before any lump sum from a retirement fund is paid out." },
  { id: 24, category: "Tax", fact: "Severance packages above R500,000 are taxed — the first R500,000 is tax-free, once in a lifetime." },
  { id: 25, category: "Tax", fact: "Provisional tax applies to anyone who earns income not subject to PAYE — such as rental or freelance income." },
  { id: 26, category: "Tax", fact: "Provisional taxpayers must pay in August and February each year." },
  { id: 27, category: "Tax", fact: "Underestimating your provisional tax by more than 20% can attract a penalty from SARS." },
  { id: 28, category: "Tax", fact: "Travel allowances are only deductible for business kilometres — a logbook is required as proof." },
  { id: 29, category: "Tax", fact: "SARS uses third-party data from banks, employers, and medical aids to pre-populate your tax return." },
  { id: 30, category: "Tax", fact: "Living annuity income is fully taxable — it is not treated as a capital drawdown." },
  { id: 31, category: "Tax", fact: "If you emigrate from South Africa, you may trigger an 'exit tax' on deemed disposal of your worldwide assets." },
  { id: 32, category: "Tax", fact: "South Africa taxes on a residency basis — if you are a tax resident, your worldwide income is taxable." },
  { id: 33, category: "Tax", fact: "The foreign income exemption of R1.25 million applies to qualifying employment income earned abroad for 183+ days." },
  { id: 34, category: "Tax", fact: "You have three years to claim a tax refund from SARS before the claim lapses." },
  { id: 35, category: "Tax", fact: "Tax-free savings accounts (TFSAs) allow you to invest up to R36,000 per year with zero tax on growth or withdrawals." },
  { id: 36, category: "Tax", fact: "The lifetime TFSA contribution limit is R500,000 — exceeding it attracts a 40% penalty tax." },
  { id: 37, category: "Tax", fact: "TFSA contributions cannot be replaced once withdrawn — you lose that contribution room permanently." },
  { id: 38, category: "Tax", fact: "You can have more than one TFSA, but the annual and lifetime limits apply across all accounts combined." },
  { id: 39, category: "Tax", fact: "South Africa has double taxation agreements with more than 80 countries to prevent being taxed twice on the same income." },
  { id: 40, category: "Tax", fact: "SARS can issue a garnishee order on your salary if you have outstanding tax debt." },
  { id: 41, category: "Tax", fact: "Penalty interest on late tax payments is charged at the prime rate plus a fixed percentage." },
  { id: 42, category: "Tax", fact: "A tax clearance certificate — now called Compliance Status from SARS — is required for large transactions and tenders." },
  { id: 43, category: "Tax", fact: "Wear and tear deductions are available on assets used in your business or trade." },
  { id: 44, category: "Tax", fact: "Medical out-of-pocket expenses above four times the medical tax credit may be deductible if you are over 65." },
  { id: 45, category: "Tax", fact: "Keeping detailed records of all income and deductions for at least five years is a legal requirement." },

  // ── RETIREMENT (46–90) ────────────────────────────────────────────────────
  { id: 46, category: "Retirement", fact: "South Africa's two-pot retirement system came into effect on 1 September 2024 — changing how all retirement funds work." },
  { id: 47, category: "Retirement", fact: "Under the two-pot system, one-third of new contributions go into an accessible savings pot and two-thirds into a preserved retirement pot." },
  { id: 48, category: "Retirement", fact: "You can make one withdrawal per tax year from your savings pot — the minimum withdrawal is R2,000." },
  { id: 49, category: "Retirement", fact: "Withdrawals from the savings pot are taxed at your marginal income tax rate — they are not tax-free." },
  { id: 50, category: "Retirement", fact: "The retirement pot can only be accessed at retirement and must be used to purchase an annuity." },
  { id: 51, category: "Retirement", fact: "The vested pot holds all retirement savings accumulated before 1 September 2024 — the old rules apply to this portion." },
  { id: 52, category: "Retirement", fact: "A retirement annuity (RA) is one of the most tax-efficient savings vehicles available in South Africa." },
  { id: 53, category: "Retirement", fact: "RA funds are protected from creditors — they cannot be attached in insolvency proceedings." },
  { id: 54, category: "Retirement", fact: "You can start drawing from your retirement annuity from age 55, even if you are still working." },
  { id: 55, category: "Retirement", fact: "At retirement, you can take up to one-third of your RA as a lump sum — the remainder must purchase an annuity." },
  { id: 56, category: "Retirement", fact: "The first R550,000 of a retirement lump sum is tax-free — this is a once-in-a-lifetime benefit across all funds." },
  { id: 57, category: "Retirement", fact: "Withdrawing from a pension or provident fund before retirement triggers tax — often at a rate higher than waiting." },
  { id: 58, category: "Retirement", fact: "A living annuity lets you draw between 2.5% and 17.5% of your capital per year — you choose the drawdown rate." },
  { id: 59, category: "Retirement", fact: "A guaranteed life annuity pays a fixed income for life — you cannot outlive your money." },
  { id: 60, category: "Retirement", fact: "The average South African lives 20–30 years after retiring — investment returns in retirement are as important as before." },
  { id: 61, category: "Retirement", fact: "Only 6% of South Africans can afford to retire comfortably — financial planning makes a significant difference." },
  { id: 62, category: "Retirement", fact: "You need roughly 15–17 times your final annual salary saved to maintain your lifestyle in retirement." },
  { id: 63, category: "Retirement", fact: "Inflation erodes purchasing power — your retirement income must grow at least in line with CPI." },
  { id: 64, category: "Retirement", fact: "Starting to save at 25 instead of 35 can more than double your retirement outcome due to compound interest." },
  { id: 65, category: "Retirement", fact: "Emigration before age 55 may allow you to withdraw RA funds — but tax applies and advice is essential." },
  { id: 66, category: "Retirement", fact: "South Africa's SASSA old-age grant is around R2,180/month — not sufficient to sustain most retirement lifestyles." },
  { id: 67, category: "Retirement", fact: "Preservation funds allow you to park your pension or provident fund when changing jobs without cashing out." },
  { id: 68, category: "Retirement", fact: "Employer contributions to a retirement fund are a valuable benefit — often undervalued in salary negotiations." },
  { id: 69, category: "Retirement", fact: "On death before retirement, your fund pays out to your nominated beneficiaries or dependants — not your estate." },
  { id: 70, category: "Retirement", fact: "The retirement fund trustee decides how to distribute death benefits — nominations guide but do not bind the trustees." },
  { id: 71, category: "Retirement", fact: "Keep your retirement fund beneficiary nominations updated after every major life event." },
  { id: 72, category: "Retirement", fact: "A retirement annuity has no set maturity date — you choose when to retire, from age 55 onwards." },
  { id: 73, category: "Retirement", fact: "The fees on a retirement product can erode up to 30% of your total returns over 30 years — always check the TER." },
  { id: 74, category: "Retirement", fact: "A total expense ratio (TER) below 1% per year is generally considered reasonable for a retirement fund." },
  { id: 75, category: "Retirement", fact: "Regulation 28 limits how much of your retirement fund can be invested in equities (75%) and offshore (45%)." },
  { id: 76, category: "Retirement", fact: "Offshore exposure in retirement funds provides rand-hedging and access to global growth." },
  { id: 77, category: "Retirement", fact: "Group retirement schemes offered by employers often have lower fees than individual products." },
  { id: 78, category: "Retirement", fact: "Divorce can affect your retirement fund — a court order can award a portion to your ex-spouse." },
  { id: 79, category: "Retirement", fact: "A clean-break divorce order allows immediate payment from a retirement fund to the non-member spouse." },
  { id: 80, category: "Retirement", fact: "Disability before retirement can be financially devastating without income protection insurance in place." },
  { id: 81, category: "Retirement", fact: "You can switch living annuity providers without triggering tax — the fund transfers in-specie." },
  { id: 82, category: "Retirement", fact: "Joint life annuities cover both spouses — the survivor continues to receive income after the first death." },
  { id: 83, category: "Retirement", fact: "Inflation-linked annuities increase income annually in line with CPI — important for long retirements." },
  { id: 84, category: "Retirement", fact: "A guaranteed period on a life annuity ensures payments continue to your estate even if you die early." },
  { id: 85, category: "Retirement", fact: "Annuity rates depend on your age, gender, health, and interest rates at retirement — shop around before committing." },
  { id: 86, category: "Retirement", fact: "Phased retirement — gradually reducing hours before fully stopping — is increasingly common and financially beneficial." },
  { id: 87, category: "Retirement", fact: "Dread disease cover pays a lump sum on diagnosis of a serious illness — it is separate from disability cover." },
  { id: 88, category: "Retirement", fact: "Regular reviews of your retirement plan are essential — at least once a year with your financial advisor." },
  { id: 89, category: "Retirement", fact: "Balanced funds are commonly used in retirement portfolios, spreading risk across equities, bonds, and cash." },
  { id: 90, category: "Retirement", fact: "Phased drawdown strategies in retirement — reducing withdrawals in poor market years — help your capital last longer." },

  // ── WILLS & ESTATE (91–130) ───────────────────────────────────────────────
  { id: 91,  category: "Wills & Estate", fact: "More than 70% of South Africans die without a valid will — known as dying intestate." },
  { id: 92,  category: "Wills & Estate", fact: "When you die intestate, your assets are distributed according to the Intestate Succession Act — not your wishes." },
  { id: 93,  category: "Wills & Estate", fact: "Under intestate succession, a surviving spouse and children share the estate equally." },
  { id: 94,  category: "Wills & Estate", fact: "A will must be signed in front of two witnesses who are not beneficiaries and are over 14 years old." },
  { id: 95,  category: "Wills & Estate", fact: "Witnesses do not need to know the contents of your will — they only need to witness your signature." },
  { id: 96,  category: "Wills & Estate", fact: "Your will can be changed or revoked at any time while you are alive and mentally competent." },
  { id: 97,  category: "Wills & Estate", fact: "Getting married automatically revokes your existing will in South Africa — make a new one after marriage." },
  { id: 98,  category: "Wills & Estate", fact: "A will made before a divorce remains valid in South Africa — update it immediately after any divorce." },
  { id: 99,  category: "Wills & Estate", fact: "The executor of your estate administers and distributes your assets — choose someone trustworthy and capable." },
  { id: 100, category: "Wills & Estate", fact: "An executor is entitled to a fee of 3.5% (plus VAT) of the gross value of your estate." },
  { id: 101, category: "Wills & Estate", fact: "Your estate can take 12–24 months to wind up — beneficiaries may have no access to funds during this period." },
  { id: 102, category: "Wills & Estate", fact: "Liquid assets — cash and life policies — can provide immediate funds to dependants while the estate is wound up." },
  { id: 103, category: "Wills & Estate", fact: "Life insurance paid to a named beneficiary bypasses the estate entirely — it is not subject to estate duty." },
  { id: 104, category: "Wills & Estate", fact: "Funeral policies are separate from life insurance — they provide quick cash for burial costs, often within 48 hours." },
  { id: 105, category: "Wills & Estate", fact: "A testamentary trust in your will protects assets for minor children or vulnerable beneficiaries." },
  { id: 106, category: "Wills & Estate", fact: "Minor children cannot inherit directly — a guardian's fund or testamentary trust must hold assets until they reach majority." },
  { id: 107, category: "Wills & Estate", fact: "The Office of the Master of the High Court oversees estate administration in South Africa." },
  { id: 108, category: "Wills & Estate", fact: "A living will records your medical wishes if you become incapacitated — it is separate from your last will." },
  { id: 109, category: "Wills & Estate", fact: "An enduring power of attorney allows someone to manage your affairs if you become mentally incapacitated." },
  { id: 110, category: "Wills & Estate", fact: "Digital assets — crypto, online accounts, intellectual property — should be documented and included in estate planning." },
  { id: 111, category: "Wills & Estate", fact: "Immovable property in another country is governed by that country's succession laws, not South Africa's." },
  { id: 112, category: "Wills & Estate", fact: "Business interests should be addressed in your will — a buy-and-sell agreement protects co-owners on death." },
  { id: 113, category: "Wills & Estate", fact: "A buy-and-sell agreement funds the surviving business partner to buy out the deceased's share." },
  { id: 114, category: "Wills & Estate", fact: "Retirement funds and living annuities do NOT form part of your deceased estate — they pass directly to beneficiaries." },
  { id: 115, category: "Wills & Estate", fact: "Keeping your estate liquid is critical — illiquid estates force the sale of assets to pay debts and taxes." },
  { id: 116, category: "Wills & Estate", fact: "Estate planning is not only for the wealthy — everyone with dependants needs a valid will." },
  { id: 117, category: "Wills & Estate", fact: "Charitable bequests in your will reduce the dutiable value of your estate for estate duty purposes." },
  { id: 118, category: "Wills & Estate", fact: "A spousal bequest rollover defers estate duty until the surviving spouse passes away." },
  { id: 119, category: "Wills & Estate", fact: "Marriage in community of property means your estates are merged — all assets and debts are shared equally." },
  { id: 120, category: "Wills & Estate", fact: "Marriage out of community of property with accrual entitles each spouse to half the other's estate growth." },
  { id: 121, category: "Wills & Estate", fact: "An antenuptial contract (ANC) defines your matrimonial property regime — it must be registered before marriage." },
  { id: 122, category: "Wills & Estate", fact: "An ANC must be executed by a notary before the wedding — it cannot be backdated after marriage." },
  { id: 123, category: "Wills & Estate", fact: "Family trusts can protect assets from creditors and manage inter-generational wealth transfer." },
  { id: 124, category: "Wills & Estate", fact: "Section 4(q) of the Estate Duty Act: bequests to a surviving spouse are fully deductible for estate duty." },
  { id: 125, category: "Wills & Estate", fact: "Review your will every three to five years — or immediately after any major life event." },
  { id: 126, category: "Wills & Estate", fact: "Many South Africans discover after a loved one's death that their will was not correctly witnessed — making it invalid." },
  { id: 127, category: "Wills & Estate", fact: "A lost will can cause significant delays and legal costs — keep the original in a safe, known location." },
  { id: 128, category: "Wills & Estate", fact: "Telling your executor and a trusted family member where your will is kept is as important as making the will itself." },
  { id: 129, category: "Wills & Estate", fact: "Multiple funeral policies are common in South Africa — consolidating can save money and simplify the claims process." },
  { id: 130, category: "Wills & Estate", fact: "The cost of making a will is a fraction of the legal fees your estate will incur if you die without one." },

  // ── INVESTMENT (131–170) ──────────────────────────────────────────────────
  { id: 131, category: "Investment", fact: "The Johannesburg Stock Exchange (JSE) is Africa's largest stock exchange by market capitalisation." },
  { id: 132, category: "Investment", fact: "ETFs (Exchange-Traded Funds) offer low-cost, diversified market exposure — ideal for long-term passive investors." },
  { id: 133, category: "Investment", fact: "The JSE All Share Index has returned approximately 12–14% per year on average over the last two decades." },
  { id: 134, category: "Investment", fact: "Diversification reduces risk — spread investments across asset classes, geographies, and sectors." },
  { id: 135, category: "Investment", fact: "Time in the market beats timing the market — consistent investing outperforms trying to predict highs and lows." },
  { id: 136, category: "Investment", fact: "Rand-cost averaging — investing a fixed amount regularly — reduces the impact of market volatility on your portfolio." },
  { id: 137, category: "Investment", fact: "Unit trusts pool money from multiple investors to buy a professionally managed portfolio." },
  { id: 138, category: "Investment", fact: "Most active fund managers underperform their benchmark index over a 10-year period after fees." },
  { id: 139, category: "Investment", fact: "The MSCI World Index tracks large and mid-cap companies across 23 developed markets — a benchmark for global exposure." },
  { id: 140, category: "Investment", fact: "Inflation is the silent thief — an investment returning less than inflation loses real value every year." },
  { id: 141, category: "Investment", fact: "South Africa's long-term inflation average is around 5–6% per year — your investments must consistently beat this." },
  { id: 142, category: "Investment", fact: "A real return is your investment return minus inflation — this is what actually grows your wealth." },
  { id: 143, category: "Investment", fact: "The Rule of 72: divide 72 by your annual return to find how many years it takes to double your money. At 8%, that's 9 years." },
  { id: 144, category: "Investment", fact: "Compound interest grows your money exponentially — reinvesting your returns is the key to long-term wealth." },
  { id: 145, category: "Investment", fact: "Risk and return are always related — higher potential returns come with higher potential for loss." },
  { id: 146, category: "Investment", fact: "Your investment time horizon determines how much risk you can afford to take." },
  { id: 147, category: "Investment", fact: "Equities outperform all other asset classes over the long run — but are highly volatile in the short term." },
  { id: 148, category: "Investment", fact: "Bonds are loans to governments or companies — they pay regular interest and carry lower risk than equities." },
  { id: 149, category: "Investment", fact: "REITs (Real Estate Investment Trusts) allow you to invest in property through the stock market with full liquidity." },
  { id: 150, category: "Investment", fact: "Gold has historically been a safe-haven asset during economic uncertainty and periods of rand weakness." },
  { id: 151, category: "Investment", fact: "Offshore investing protects against rand depreciation and gives access to global growth opportunities." },
  { id: 152, category: "Investment", fact: "South African residents can invest up to R11 million offshore per year via a tax clearance from SARS." },
  { id: 153, category: "Investment", fact: "An additional R1 million per year can be invested offshore without a tax clearance — the single discretionary allowance." },
  { id: 154, category: "Investment", fact: "A 3–6 month emergency fund in a liquid, interest-bearing account is the foundation of any financial plan." },
  { id: 155, category: "Investment", fact: "Money market funds offer better returns than a cheque account and remain highly liquid — ideal for emergency funds." },
  { id: 156, category: "Investment", fact: "Never invest money you cannot afford to lose in high-risk assets — protect your emergency fund first." },
  { id: 157, category: "Investment", fact: "The Sharpe ratio measures return per unit of risk — a higher Sharpe ratio indicates better risk-adjusted performance." },
  { id: 158, category: "Investment", fact: "Past performance does not guarantee future results — this is a legal disclosure for a very good reason." },
  { id: 159, category: "Investment", fact: "Financial advisors in South Africa are legally required to act in your best interest under the FAIS Act." },
  { id: 160, category: "Investment", fact: "A fee-based advisor charges for advice directly — a commission-based advisor earns from the products they sell." },
  { id: 161, category: "Investment", fact: "Always read the minimum disclosure document (MDD) before investing in a unit trust or ETF." },
  { id: 162, category: "Investment", fact: "ESG investing (Environmental, Social, Governance) allows you to align your portfolio with your values." },
  { id: 163, category: "Investment", fact: "A balanced fund typically holds 60% equities and 40% bonds and cash — lower volatility than a pure equity fund." },
  { id: 164, category: "Investment", fact: "Never concentrate all your investment in a single company — not even one you work for or believe in strongly." },
  { id: 165, category: "Investment", fact: "Dollar-cost averaging into global ETFs is one of the most proven long-term wealth-building strategies available." },
  { id: 166, category: "Investment", fact: "Investing in your children's education is one of the highest-returning investments you will ever make." },
  { id: 167, category: "Investment", fact: "Liquidity means how quickly an asset can be converted to cash — property is illiquid, equities are liquid." },
  { id: 168, category: "Investment", fact: "Section 12B tax deductions are available for qualifying renewable energy investments — ask your advisor." },
  { id: 169, category: "Investment", fact: "The JSE has circuit breakers that halt trading if prices move too quickly — protecting investors from flash crashes." },
  { id: 170, category: "Investment", fact: "Reviewing your investment portfolio at least annually ensures your asset allocation still matches your goals." },

  // ── BUDGETING & SAVING (171–210) ──────────────────────────────────────────
  { id: 171, category: "Budgeting & Saving", fact: "The 50/30/20 rule: 50% of income on needs, 30% on wants, and 20% on savings and debt repayment." },
  { id: 172, category: "Budgeting & Saving", fact: "Paying yourself first — saving before spending — is the single most effective saving habit you can build." },
  { id: 173, category: "Budgeting & Saving", fact: "An emergency fund should be in a separate account so you are not tempted to dip into it for everyday spending." },
  { id: 174, category: "Budgeting & Saving", fact: "South Africa's household savings rate is among the lowest in the world — most South Africans spend more than they save." },
  { id: 175, category: "Budgeting & Saving", fact: "Credit card debt is among the most expensive forms of borrowing — interest rates can exceed 20% per year." },
  { id: 176, category: "Budgeting & Saving", fact: "Paying only the minimum amount on a credit card can take years to clear even a small balance." },
  { id: 177, category: "Budgeting & Saving", fact: "Store credit and retail accounts often carry the highest interest rates — use them sparingly and always pay in full." },
  { id: 178, category: "Budgeting & Saving", fact: "A budget is not a punishment — it is a plan that tells your money where to go before you spend it." },
  { id: 179, category: "Budgeting & Saving", fact: "Zero-based budgeting allocates every rand of income to a specific purpose — nothing is left unaccounted for." },
  { id: 180, category: "Budgeting & Saving", fact: "Tracking your spending for just one month reveals habits and patterns you did not know you had." },
  { id: 181, category: "Budgeting & Saving", fact: "Subscriptions add up fast — audit yours every six months and cancel anything you no longer use." },
  { id: 182, category: "Budgeting & Saving", fact: "Meal planning and buying in bulk can reduce your monthly grocery bill by 20–30%." },
  { id: 183, category: "Budgeting & Saving", fact: "Financing a car over 72 months can cost you almost double the original purchase price in total." },
  { id: 184, category: "Budgeting & Saving", fact: "A new car is not an asset — it depreciates the moment it leaves the showroom floor." },
  { id: 185, category: "Budgeting & Saving", fact: "Avoid lifestyle inflation — as your income grows, resist the urge to upgrade every aspect of your life at once." },
  { id: 186, category: "Budgeting & Saving", fact: "High-interest debt should be paid off before you start investing — no investment consistently returns 20%+ risk-free." },
  { id: 187, category: "Budgeting & Saving", fact: "The debt snowball method: pay off your smallest debt first for quick wins and psychological momentum." },
  { id: 188, category: "Budgeting & Saving", fact: "The debt avalanche method: pay off the highest-interest debt first to save the most money mathematically." },
  { id: 189, category: "Budgeting & Saving", fact: "Compound interest works against you in debt just as powerfully as it works for you in savings." },
  { id: 190, category: "Budgeting & Saving", fact: "Automating savings and debit orders removes the temptation to spend money before it is saved." },
  { id: 191, category: "Budgeting & Saving", fact: "A sinking fund is money set aside monthly for known future expenses — car services, school fees, annual premiums." },
  { id: 192, category: "Budgeting & Saving", fact: "The total interest paid on a 20-year home loan often equals 50–80% of the original purchase price." },
  { id: 193, category: "Budgeting & Saving", fact: "Paying an extra R500 per month into your home loan can reduce a 20-year bond term by three to five years." },
  { id: 194, category: "Budgeting & Saving", fact: "A child costs an estimated R1–2 million to raise to age 18 in South Africa — plan for this early." },
  { id: 195, category: "Budgeting & Saving", fact: "Financial stress is the leading cause of relationship breakdown in South Africa — talk openly about money." },
  { id: 196, category: "Budgeting & Saving", fact: "Teaching children about money through pocket money and budgeting sets them up for lifelong financial success." },
  { id: 197, category: "Budgeting & Saving", fact: "Budget for irregular expenses — annual premiums, car licences, school registration — they are predictable, not surprises." },
  { id: 198, category: "Budgeting & Saving", fact: "The rand has lost significant purchasing power over the past 20 years — keeping all savings in cash is risky." },
  { id: 199, category: "Budgeting & Saving", fact: "Comparison shopping before major purchases can save thousands — especially for electronics and appliances." },
  { id: 200, category: "Budgeting & Saving", fact: "Financial freedom is not about earning more — it is about spending less than you earn, consistently." },
  { id: 201, category: "Budgeting & Saving", fact: "Short-term insurance (car, home, contents) is often undervalued — one claim can save years of savings." },
  { id: 202, category: "Budgeting & Saving", fact: "Comparing short-term insurance quotes annually can save hundreds of rands per month without reducing cover." },
  { id: 203, category: "Budgeting & Saving", fact: "Travel insurance is often overlooked — one medical emergency abroad can cost more than a year's salary." },
  { id: 204, category: "Budgeting & Saving", fact: "Buy experiences, not things — research shows experiences provide more lasting happiness than possessions." },
  { id: 205, category: "Budgeting & Saving", fact: "Starting a side income stream can significantly accelerate your path to financial independence." },
  { id: 206, category: "Budgeting & Saving", fact: "Frugality is not being cheap — it is about maximising the value you get from every rand you spend." },
  { id: 207, category: "Budgeting & Saving", fact: "Net worth = assets minus liabilities. Tracking this monthly is one of the clearest measures of financial progress." },
  { id: 208, category: "Budgeting & Saving", fact: "A financial plan does not need to be complicated — a simple written budget you stick to beats a complex one you ignore." },
  { id: 209, category: "Budgeting & Saving", fact: "Renegotiating your gym membership, insurance premiums, and internet contract annually is worthwhile — ask for a better rate." },
  { id: 210, category: "Budgeting & Saving", fact: "Building wealth is more about discipline than income — consistent small actions compound into significant results over time." },

  // ── INSURANCE (211–245) ───────────────────────────────────────────────────
  { id: 211, category: "Insurance", fact: "Life insurance pays a lump sum to your dependants on your death — it replaces your income-earning ability." },
  { id: 212, category: "Insurance", fact: "Term life insurance provides cover for a fixed period — ideal to cover a bond or until children are independent." },
  { id: 213, category: "Insurance", fact: "Whole life insurance has no end date — premiums are higher but cover is guaranteed for life." },
  { id: 214, category: "Insurance", fact: "Income protection insurance pays a monthly benefit if you are unable to work due to illness or injury." },
  { id: 215, category: "Insurance", fact: "Disability cover pays a lump sum if you are permanently and totally disabled and unable to work." },
  { id: 216, category: "Insurance", fact: "Own-occupation disability cover is more comprehensive than any-occupation cover — the definitions matter greatly." },
  { id: 217, category: "Insurance", fact: "Dread disease (critical illness) cover pays a lump sum on diagnosis of serious conditions like cancer or stroke." },
  { id: 218, category: "Insurance", fact: "Gap cover bridges the shortfall between what your medical aid pays and what specialists actually charge." },
  { id: 219, category: "Insurance", fact: "Life insurance premiums are not tax-deductible in South Africa — but the payout to your beneficiaries is tax-free." },
  { id: 220, category: "Insurance", fact: "Underinsurance is common — most South Africans are covered for far less than their actual income replacement need." },
  { id: 221, category: "Insurance", fact: "A financial needs analysis ensures you are neither over- nor under-insured for your specific circumstances." },
  { id: 222, category: "Insurance", fact: "Waiting periods apply to most insurance policies — pre-existing conditions may be excluded for an initial period." },
  { id: 223, category: "Insurance", fact: "Business assurance protects companies against the financial impact of losing a key person or director." },
  { id: 224, category: "Insurance", fact: "Keyman insurance compensates a business for revenue loss following the death or disability of a critical employee." },
  { id: 225, category: "Insurance", fact: "Many South Africans hold multiple funeral policies — consolidating them can save money and simplify claims." },
  { id: 226, category: "Insurance", fact: "Home loan protection insurance pays off your bond on death — it is sometimes a condition of the home loan." },
  { id: 227, category: "Insurance", fact: "Credit life insurance is often added automatically to loans — cheaper alternatives exist, so shop around." },
  { id: 228, category: "Insurance", fact: "Surrendering a life policy early typically results in significant financial loss — explore all alternatives first." },
  { id: 229, category: "Insurance", fact: "Disability cover typically replaces 75% of your gross income — structure your finances to live on this if needed." },
  { id: 230, category: "Insurance", fact: "Income protection has a waiting period of 1–3 months before it pays out — your emergency fund must bridge this gap." },
  { id: 231, category: "Insurance", fact: "Review your insurance needs after every major life event — marriage, children, home purchase, or job change." },
  { id: 232, category: "Insurance", fact: "Group life cover through your employer disappears when you leave — portable individual policies follow you." },
  { id: 233, category: "Insurance", fact: "Smokers pay significantly higher life and disability premiums — quitting can save thousands of rands per year." },
  { id: 234, category: "Insurance", fact: "Non-disclosure on an insurance application — failing to declare medical history — can lead to claims being rejected." },
  { id: 235, category: "Insurance", fact: "The FSCA (Financial Sector Conduct Authority) regulates all insurance companies operating in South Africa." },
  { id: 236, category: "Insurance", fact: "Complaints about insurance companies can be lodged with the Ombudsman for Long-term or Short-term Insurance." },
  { id: 237, category: "Insurance", fact: "Reviewing your car insurance when your vehicle's value drops significantly can reduce your monthly premium." },
  { id: 238, category: "Insurance", fact: "An insurance excess is the amount you pay before the insurer pays — a higher excess lowers your premium." },
  { id: 239, category: "Insurance", fact: "All-risk cover (contents and portable possessions) protects items you take outside your home." },
  { id: 240, category: "Insurance", fact: "Some insurers offer wellness programme benefits and premium discounts for healthy lifestyle choices." },
  { id: 241, category: "Insurance", fact: "A policy schedule is your legal insurance contract — always read the exclusions section carefully." },
  { id: 242, category: "Insurance", fact: "Cession of a life policy as security for a business loan is common — understand what you are giving up." },
  { id: 243, category: "Insurance", fact: "Disability insurance is often the most overlooked cover — yet you are statistically more likely to be disabled than to die early." },
  { id: 244, category: "Insurance", fact: "Critical illness cover can be structured as an accelerated benefit on a life policy — or as a standalone policy." },
  { id: 245, category: "Insurance", fact: "A nominated beneficiary on a life policy receives the payout directly — it bypasses the estate and probate entirely." },

  // ── PROPERTY (246–275) ────────────────────────────────────────────────────
  { id: 246, category: "Property", fact: "A home loan in South Africa typically runs over 20 years — the total interest paid often exceeds the purchase price." },
  { id: 247, category: "Property", fact: "The prime lending rate is the benchmark for home loan interest in South Africa — it moves with the repo rate." },
  { id: 248, category: "Property", fact: "A 1% drop in your home loan rate on a R1.5 million bond saves approximately R15,000 per year in interest." },
  { id: 249, category: "Property", fact: "Transfer duty is paid by the buyer — properties below R1,100,000 are currently exempt from transfer duty." },
  { id: 250, category: "Property", fact: "Estate agent commission — typically 5–7% plus VAT — is paid by the seller at transfer." },
  { id: 251, category: "Property", fact: "Bond registration costs and transfer costs are separate fees — budget for both when buying a property." },
  { id: 252, category: "Property", fact: "A pre-approval from a bank tells you your exact buying power before you start house hunting." },
  { id: 253, category: "Property", fact: "Sectional title ownership comes with monthly levies and body corporate rules — understand both before buying." },
  { id: 254, category: "Property", fact: "Homeowners' association levies in security estates can add significant amounts to your monthly housing cost." },
  { id: 255, category: "Property", fact: "Renting out a room or flatlet can substantially subsidise your monthly home loan repayments." },
  { id: 256, category: "Property", fact: "Capital Gains Tax applies when you sell a property that is not your primary residence." },
  { id: 257, category: "Property", fact: "Your primary residence CGT exclusion is R2 million — gains above this are included in your taxable income at 40%." },
  { id: 258, category: "Property", fact: "Property is highly illiquid — it cannot be converted to cash quickly in a financial emergency." },
  { id: 259, category: "Property", fact: "The South African property market is highly localised — values differ dramatically between suburbs and provinces." },
  { id: 260, category: "Property", fact: "Buying in an emerging area rather than a prime area can deliver superior capital growth over 10+ years." },
  { id: 261, category: "Property", fact: "A home inspection before purchase can identify hidden defects that save you from expensive future costs." },
  { id: 262, category: "Property", fact: "The voetstoots clause (sold as-is) is common in private property sales — it limits the seller's liability." },
  { id: 263, category: "Property", fact: "Sectional title owners must insure the building through the body corporate — but contents must be insured separately." },
  { id: 264, category: "Property", fact: "Renovation work rarely returns 100 cents in the rand — improve your home for lifestyle, not as an investment strategy." },
  { id: 265, category: "Property", fact: "A buy-to-let property should be evaluated on both rental yield and capital growth — not just one of these." },
  { id: 266, category: "Property", fact: "Gross rental yield = annual rent ÷ property purchase price × 100. A yield above 8% is generally considered healthy." },
  { id: 267, category: "Property", fact: "Vacancy periods and maintenance costs reduce the net yield of a rental property significantly — account for both." },
  { id: 268, category: "Property", fact: "A reputable rental agent typically charges 8–10% of monthly rent to manage a property on your behalf." },
  { id: 269, category: "Property", fact: "Inherited property may attract Capital Gains Tax — seek professional advice before selling." },
  { id: 270, category: "Property", fact: "Off-plan properties carry development risk — the completed product may differ from what was sold on plan." },
  { id: 271, category: "Property", fact: "A second property is not always the best investment — compare it honestly against a diversified portfolio." },
  { id: 272, category: "Property", fact: "Agricultural land investment is a niche requiring specialist knowledge and understanding of planning permission rules." },
  { id: 273, category: "Property", fact: "Paying extra into your home loan creates an access bond facility — a powerful emergency fund with no interest cost." },
  { id: 274, category: "Property", fact: "The Consumer Protection Act limits the voetstoots clause for sellers who are not private individuals." },
  { id: 275, category: "Property", fact: "Property syndications pool investor funds to buy commercial or industrial property — check regulatory compliance carefully." },

  // ── MEDICAL AID (276–300) ─────────────────────────────────────────────────
  { id: 276, category: "Medical Aid", fact: "Medical aid is not the same as health insurance — medical aid provides comprehensive in- and out-of-hospital cover." },
  { id: 277, category: "Medical Aid", fact: "Gap cover only works alongside a medical aid scheme — it is not a stand-alone health product." },
  { id: 278, category: "Medical Aid", fact: "Hospital plans are entry-level medical aids — they cover hospitalisation but not day-to-day medical expenses." },
  { id: 279, category: "Medical Aid", fact: "Prescribed minimum benefits (PMBs) are conditions all medical aids must cover in full — regardless of your plan." },
  { id: 280, category: "Medical Aid", fact: "PMBs include 270 diagnosis-treatment pairs and 26 chronic conditions — you cannot be turned away for these." },
  { id: 281, category: "Medical Aid", fact: "Open medical aid schemes accept any member regardless of employer — closed schemes are restricted to specific groups." },
  { id: 282, category: "Medical Aid", fact: "Joining a medical aid young and staying on it locks in more favourable age-based premium structures." },
  { id: 283, category: "Medical Aid", fact: "Medical savings accounts (MSAs) hold your day-to-day benefits and roll over to the next year if unspent." },
  { id: 284, category: "Medical Aid", fact: "The medical aid tax credit of R364/month per main member and R246/month per first dependant reduces your tax bill." },
  { id: 285, category: "Medical Aid", fact: "Waiting periods apply to new medical aid members — typically 3 months general and 12 months for pre-existing conditions." },
  { id: 286, category: "Medical Aid", fact: "The late joiner penalty increases your premium if you join a medical aid after age 35 without continuous prior cover." },
  { id: 287, category: "Medical Aid", fact: "Chronic medication under PMBs must be approved by your scheme — ensure your doctor submits the correct paperwork." },
  { id: 288, category: "Medical Aid", fact: "Specialists in South Africa often charge at 200–400% of medical aid rates — gap cover bridges this shortfall." },
  { id: 289, category: "Medical Aid", fact: "Always check if a hospital or specialist is on your scheme's designated service provider (DSP) network before booking." },
  { id: 290, category: "Medical Aid", fact: "Using a non-DSP provider without pre-authorisation can result in significant co-payments or total claim rejection." },
  { id: 291, category: "Medical Aid", fact: "Pre-authorisation is required for most elective procedures — always get it in writing before you go in." },
  { id: 292, category: "Medical Aid", fact: "Medical inflation in South Africa consistently runs above general CPI — medical aid increases reflect this reality." },
  { id: 293, category: "Medical Aid", fact: "Dental and optical benefits are often funded from the savings account on lower plans — budget for these separately." },
  { id: 294, category: "Medical Aid", fact: "Maternity cover limits are an important consideration for young families — check them before falling pregnant." },
  { id: 295, category: "Medical Aid", fact: "Many medical aids offer wellness programmes with chronic disease management, gym benefits, and health screenings — use them." },
  { id: 296, category: "Medical Aid", fact: "Changing medical aids is easiest during the open enrolment period — this minimises waiting periods on your new scheme." },
  { id: 297, category: "Medical Aid", fact: "If you are unemployed, you can continue your medical aid as a direct payer rather than losing your cover." },
  { id: 298, category: "Medical Aid", fact: "Medical aid schemes cannot refuse a member based on health status — but they can apply waiting periods and exclusions." },
  { id: 299, category: "Medical Aid", fact: "The Council for Medical Schemes (CMS) regulates all registered medical aid schemes in South Africa." },
  { id: 300, category: "Medical Aid", fact: "A financial advisor can help you compare medical aid options objectively — they earn no commission on medical aid advice." },
];

/**
 * Returns 6 unique facts for today. Picks are fully random per day and
 * cached in localStorage under today's date so refreshes return the same
 * set within the day, but a new random 6 are drawn at midnight.
 */
const FACTS_STORAGE_KEY = "ac:daily-facts:today";
function factsTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
export function getDailyFacts(): FunFact[] {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(FACTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { date: string; ids: number[] };
        if (parsed.date === factsTodayKey() && Array.isArray(parsed.ids) && parsed.ids.length === 6) {
          const byId = new Map(FUN_FACTS.map((f) => [f.id, f] as const));
          const resolved = parsed.ids.map((id) => byId.get(id)).filter(Boolean) as FunFact[];
          if (resolved.length === 6) return resolved;
        }
      }
    } catch {
      // ignore
    }
  }
  const pool = [...FUN_FACTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, 6);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        FACTS_STORAGE_KEY,
        JSON.stringify({ date: factsTodayKey(), ids: picked.map((f) => f.id) })
      );
    } catch {
      // ignore
    }
  }
  return picked;
}
