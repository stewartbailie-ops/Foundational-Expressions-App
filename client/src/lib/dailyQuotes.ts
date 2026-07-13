export type QuoteSet = "general" | "investment";

export type Quote = { text: string; author: string };

const GENERAL: Quote[] = [
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "What we think, we become.", author: "Buddha" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "The harder I work, the luckier I get.", author: "Samuel Goldwyn" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Patience is bitter, but its fruit is sweet.", author: "Aristotle" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
  { text: "If you can dream it, you can do it.", author: "Walt Disney" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Great things never come from comfort zones.", author: "Roy T. Bennett" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "Limit your 'always' and your 'nevers.'", author: "Amy Poehler" },
  { text: "The best revenge is massive success.", author: "Frank Sinatra" },
  { text: "If opportunity doesn't knock, build a door.", author: "Milton Berle" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "George Lorimer" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", author: "Charles R. Swindoll" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "There is no substitute for hard work.", author: "Thomas Edison" },
  { text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "Doing the best at this moment puts you in the best place for the next moment.", author: "Oprah Winfrey" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "The road to success is always under construction.", author: "Lily Tomlin" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
  { text: "A real entrepreneur is somebody who has no safety net underneath them.", author: "Henry Kravis" },
  { text: "Courage doesn't always roar. Sometimes it's the quiet voice at the end of the day saying 'I will try again tomorrow.'", author: "Mary Anne Radmacher" },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
  { text: "Today's accomplishments were yesterday's impossibilities.", author: "Robert H. Schuller" },
];

const INVESTMENT: Quote[] = [
  { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
  { text: "Be fearful when others are greedy and greedy when others are fearful.", author: "Warren Buffett" },
  { text: "Price is what you pay. Value is what you get.", author: "Warren Buffett" },
  { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
  { text: "Our favorite holding period is forever.", author: "Warren Buffett" },
  { text: "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.", author: "Warren Buffett" },
  { text: "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.", author: "Warren Buffett" },
  { text: "The most important investment you can make is in yourself.", author: "Warren Buffett" },
  { text: "Someone is sitting in the shade today because someone planted a tree a long time ago.", author: "Warren Buffett" },
  { text: "Time is the friend of the wonderful company, the enemy of the mediocre.", author: "Warren Buffett" },
  { text: "The best investment you can make is an investment in yourself. The more you learn, the more you'll earn.", author: "Warren Buffett" },
  { text: "Investing should be more like watching paint dry or watching grass grow.", author: "Paul Samuelson" },
  { text: "The four most dangerous words in investing are: 'this time it's different.'", author: "Sir John Templeton" },
  { text: "If you have trouble imagining a 20% loss in the stock market, you shouldn't be in stocks.", author: "John Bogle" },
  { text: "Don't look for the needle in the haystack. Just buy the haystack!", author: "John Bogle" },
  { text: "Time is your friend; impulse is your enemy.", author: "John Bogle" },
  { text: "The investor's chief problem — and his worst enemy — is likely to be himself.", author: "Benjamin Graham" },
  { text: "In the short run, the market is a voting machine, but in the long run, it is a weighing machine.", author: "Benjamin Graham" },
  { text: "The intelligent investor is a realist who sells to optimists and buys from pessimists.", author: "Benjamin Graham" },
  { text: "Successful investing is about managing risk, not avoiding it.", author: "Benjamin Graham" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Compound interest is the eighth wonder of the world. He who understands it, earns it; he who doesn't, pays it.", author: "Albert Einstein" },
  { text: "Wide diversification is only required when investors do not understand what they are doing.", author: "Warren Buffett" },
  { text: "Never invest in a business you cannot understand.", author: "Warren Buffett" },
  { text: "The big money is not in the buying and selling, but in the waiting.", author: "Charlie Munger" },
  { text: "It is remarkable how much long-term advantage people like us have gotten by trying to be consistently not stupid.", author: "Charlie Munger" },
  { text: "Invert, always invert.", author: "Charlie Munger" },
  { text: "The first rule of compounding: Never interrupt it unnecessarily.", author: "Charlie Munger" },
  { text: "Know what you own, and know why you own it.", author: "Peter Lynch" },
  { text: "In this business, if you're good, you're right six times out of ten.", author: "Peter Lynch" },
  { text: "Far more money has been lost by investors preparing for corrections than has been lost in the corrections themselves.", author: "Peter Lynch" },
  { text: "The real key to making money in stocks is not to get scared out of them.", author: "Peter Lynch" },
  { text: "Bull markets are born on pessimism, grown on skepticism, mature on optimism, and die on euphoria.", author: "Sir John Templeton" },
  { text: "The time of maximum pessimism is the best time to buy.", author: "Sir John Templeton" },
  { text: "How many millionaires do you know who have become wealthy by investing in savings accounts?", author: "Robert G. Allen" },
  { text: "Don't gamble; take all your savings and buy some good stock and hold it till it goes up, then sell it. If it don't go up, don't buy it.", author: "Will Rogers" },
  { text: "October: This is one of the peculiarly dangerous months to speculate in stocks. The others are July, January, September…", author: "Mark Twain" },
  { text: "I will tell you how to become rich. Close the doors. Be fearful when others are greedy. Be greedy when others are fearful.", author: "Warren Buffett" },
  { text: "Markets can remain irrational longer than you can remain solvent.", author: "John Maynard Keynes" },
  { text: "The individual investor should act consistently as an investor and not as a speculator.", author: "Benjamin Graham" },
  { text: "Behind every stock is a company. Find out what it's doing.", author: "Peter Lynch" },
  { text: "Diversification is a protection against ignorance. It makes little sense if you know what you are doing.", author: "Warren Buffett" },
  { text: "Risk and reward are usually proportional.", author: "Sallie Krawcheck" },
  { text: "It's not whether you're right or wrong, but how much money you make when you're right and how much you lose when you're wrong.", author: "George Soros" },
  { text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.", author: "Philip Fisher" },
  { text: "Investing without research is like playing stud poker and never looking at the cards.", author: "Peter Lynch" },
  { text: "Wealth consists not in having great possessions, but in having few wants.", author: "Epictetus" },
  { text: "Beware of little expenses; a small leak will sink a great ship.", author: "Benjamin Franklin" },
  { text: "Do not save what is left after spending; instead spend what is left after saving.", author: "Warren Buffett" },
  { text: "Every time you borrow money, you're robbing your future self.", author: "Nathan W. Morris" },
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  { text: "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.", author: "Dave Ramsey" },
  { text: "It's not your salary that makes you rich, it's your spending habits.", author: "Charles A. Jaffe" },
  { text: "The habit of saving is itself an education.", author: "T.T. Munger" },
  { text: "Wealth is the ability to fully experience life.", author: "Henry David Thoreau" },
  { text: "Money is a terrible master but an excellent servant.", author: "P.T. Barnum" },
  { text: "Never spend your money before you have it.", author: "Thomas Jefferson" },
  { text: "Time in the market beats timing the market.", author: "Ken Fisher" },
  { text: "The goal of retirement is to live off your assets, not on them.", author: "Frank Eberhart" },
  { text: "If you don't find a way to make money while you sleep, you will work until you die.", author: "Warren Buffett" },
  { text: "Wealth, like happiness, is never attained when sought after directly.", author: "Henry David Thoreau" },
];

// Expand the curated pool into a fixed 365-entry per-day array. Each day of
// the year (1 Jan = index 0 … 31 Dec = index 364) gets a deterministic quote.
// Day 366 in a leap year reuses index 0 (acceptable; same quote as 1 Jan).
function buildYearArray(pool: Quote[]): Quote[] {
  const out: Quote[] = new Array(365);
  for (let i = 0; i < 365; i++) out[i] = pool[i % pool.length];
  return Object.freeze(out) as Quote[];
}

export const GENERAL_YEAR: Quote[] = buildYearArray(GENERAL);
export const INVESTMENT_YEAR: Quote[] = buildYearArray(INVESTMENT);

export function getQuoteForToday(set: QuoteSet, date: Date = new Date()): Quote {
  const start = Date.UTC(date.getFullYear(), 0, 1);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndex = Math.max(0, Math.floor((today - start) / 86400000)); // 0 = 1 Jan
  const arr = set === "investment" ? INVESTMENT_YEAR : GENERAL_YEAR;
  return arr[dayIndex % arr.length];
}

// Render the Quote-of-the-Day to a PNG and share via Web Share API (or fall back
// to download). Mirrors the Daily Financial Facts share UX — square card, brand
// footer baked with foundationalexpressions.com/privacy-policy.
export async function shareQuoteAsPng(opts: {
  quote: Quote;
  set: QuoteSet;
  advisorName?: string;
}): Promise<"shared" | "downloaded" | "cancelled"> {
  const { quote, set, advisorName } = opts;
  const W = 1080, H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");

  // Background — corporate black gradient.
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0b0b");
  bg.addColorStop(1, "#1f1f1f");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Accent bar (top).
  ctx.fillStyle = "#d4af37"; // gold
  ctx.fillRect(64, 88, 80, 6);

  // Eyebrow.
  ctx.fillStyle = "#d4af37";
  ctx.font = "600 22px Inter, Arial, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(set === "investment" ? "INVESTMENT WISDOM" : "QUOTE OF THE DAY", 64, 120);

  // Big opening quote glyph.
  ctx.fillStyle = "rgba(212,175,55,0.18)";
  ctx.font = "bold 320px Georgia, serif";
  ctx.textBaseline = "top";
  ctx.fillText("\u201C", 60, 160);

  // Word-wrap the quote text.
  const maxW = W - 128;
  const fontSize = quote.text.length > 220 ? 36 : quote.text.length > 140 ? 42 : 48;
  ctx.fillStyle = "#ffffff";
  ctx.font = `500 ${fontSize}px Georgia, serif`;
  const words = quote.text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(trial).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = trial;
  }
  if (cur) lines.push(cur);
  const lineH = Math.round(fontSize * 1.35);
  const blockH = lines.length * lineH;
  const startY = Math.max(280, (H - blockH) / 2 - 60);
  ctx.textBaseline = "top";
  lines.forEach((ln, i) => {
    const prefix = i === 0 ? "\u201C" : "";
    const suffix = i === lines.length - 1 ? "\u201D" : "";
    ctx.fillText(prefix + ln + suffix, 64, startY + i * lineH);
  });

  // Author.
  ctx.fillStyle = "#d4af37";
  ctx.font = "600 32px Inter, Arial, sans-serif";
  ctx.fillText(`— ${quote.author}`, 64, startY + blockH + 32);

  // Optional advisor attribution.
  if (advisorName) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "500 22px Inter, Arial, sans-serif";
    ctx.fillText(`Shared by ${advisorName}`, 64, startY + blockH + 90);
  }

  // Footer.
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, H - 96, W, 96);
  ctx.fillStyle = "rgba(212,175,55,0.9)";
  ctx.fillRect(0, H - 96, W, 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Inter, Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("Powered by Foundational Expressions", 64, H - 56);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 18px Inter, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("foundationalexpressions.com/privacy-policy", W - 64, H - 56);
  ctx.textAlign = "left";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("encode failed")), "image/png", 0.95);
  });
  const filename = `quote-of-the-day-${new Date().toISOString().slice(0, 10)}.png`;
  const file = new File([blob], filename, { type: "image/png" });

  const nav = navigator as any;
  if (
    typeof nav !== "undefined" &&
    typeof nav.canShare === "function" &&
    nav.canShare({ files: [file] }) &&
    typeof nav.share === "function"
  ) {
    try {
      await nav.share({ files: [file], title: "Quote of the Day", text: `"${quote.text}" — ${quote.author}` });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "downloaded";
}
