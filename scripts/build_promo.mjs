import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdirSync, existsSync } from "node:fs";

const run = promisify(execFile);

const SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf";
const SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const GOLD = "0xD4AF37";
const WHITE = "0xF5F5F5";
const GRAY = "0xB8B8B8";

const CLIPS = "attached_assets/generated_videos";
const FR = "exports/promo_frames";
const TMP = "tmp/promo";
mkdirSync(TMP, { recursive: true });

const XF = 0.6; // crossfade seconds

// Fade-in/out alpha for a caption over a segment of length D
// Single-quoted expression -> commas are literal, no backslash escaping.
const alpha = (D) =>
  `'if(lt(t,0.45),t/0.45,if(gt(t,${D - 0.45}),(${D}-t)/0.45,1))'`;

// drawtext piece
function dt({ text, font = SANS, size, color = WHITE, y, D, box = false }) {
  const parts = [
    `drawtext=fontfile=${font}`,
    `text='${text}'`,
    `fontsize=${size}`,
    `fontcolor=${color}`,
    `x='(w-text_w)/2'`,
    `y='${y}'`,
    `alpha=${alpha(D)}`,
  ];
  if (box) parts.push(`box=1`, `boxcolor=black@0.45`, `boxborderw=30`);
  return parts.join(":");
}

const BASE = "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30";

// Build a clip segment (AI mp4) with captions
function clipSeg(src, D, texts) {
  const vf = [BASE, ...texts, "format=yuv420p"].join(",");
  return ["-y", "-i", src, "-t", String(D), "-vf", vf, "-an",
    "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-r", "30"];
}

// Build a still segment (jpg) with slow Ken Burns zoom + captions
function stillSeg(src, D, texts) {
  const N = Math.round(D * 30);
  const kb = `zoompan=z='min(zoom+0.00055\\,1.10)':d=${N}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30`;
  const vf = ["scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1", kb, ...texts, "format=yuv420p"].join(",");
  return ["-y", "-loop", "1", "-i", src, "-frames:v", String(N), "-vf", vf, "-an",
    "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-r", "30"];
}

// Build a text card on dark background
function cardSeg(D, texts, accentY = null) {
  const filters = [];
  if (accentY !== null) {
    filters.push(`drawbox=x='(w-260)/2':y=${accentY}:w=260:h=4:color=${GOLD}:t=fill`);
  }
  filters.push(...texts, "format=yuv420p");
  const vf = filters.join(",");
  return ["-y", "-f", "lavfi", "-i", `color=c=0x0a0a0c:s=1920x1080:d=${D}:r=30`,
    "-vf", vf, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-r", "30"];
}

const D = [8, 5, 6, 7, 7, 6, 5, 7, 7, 7];

const segs = [
  // 0 intro
  { out: `${TMP}/s0.mp4`, args: clipSeg(`${CLIPS}/promo_intro_black_gold.mp4`, D[0], [
    dt({ text: "ADVISORY CONNECT", font: SERIF, size: 96, color: WHITE, y: "h/2-70", D: D[0] }),
    dt({ text: "Your advisory presence, elevated", font: SANS, size: 40, color: GOLD, y: "h/2+40", D: D[0] }),
  ]) },
  // 1 hook card
  { out: `${TMP}/s1.mp4`, args: cardSeg(D[1], [
    dt({ text: "Still handing out paper business cards?", size: 54, color: WHITE, y: "h/2-70", D: D[1] }),
    dt({ text: "Your practice deserves better.", size: 60, color: GOLD, y: "h/2+30", D: D[1] }),
  ], null) },
  // 2 register still
  { out: `${TMP}/s2.mp4`, args: stillSeg(`${FR}/register.jpg`, D[2], [
    dt({ text: "A professional profile, live in minutes", size: 46, color: WHITE, y: "h-150", D: D[2], box: true }),
  ]) },
  // 3 profile still
  { out: `${TMP}/s3.mp4`, args: stillSeg(`${FR}/profile.jpg`, D[3], [
    dt({ text: "A stunning, mobile-first profile", size: 46, color: WHITE, y: "h-150", D: D[3], box: true }),
  ]) },
  // 4 callback still
  { out: `${TMP}/s4.mp4`, args: stillSeg(`${FR}/callback.jpg`, D[4], [
    dt({ text: "Every lead captured and auto-graded", size: 46, color: WHITE, y: "h-200", D: D[4], box: true }),
    dt({ text: "Gold \u00b7 Silver \u00b7 Bronze", size: 40, color: GOLD, y: "h-130", D: D[4], box: true }),
  ]) },
  // 5 security clip
  { out: `${TMP}/s5.mp4`, args: clipSeg(`${CLIPS}/promo_security_vault.mp4`, D[5], [
    dt({ text: "Bank-grade encryption", size: 58, color: WHITE, y: "h/2-60", D: D[5] }),
    dt({ text: "POPIA-compliant by design", size: 44, color: GOLD, y: "h/2+30", D: D[5] }),
  ]) },
  // 6 privacy still
  { out: `${TMP}/s6.mp4`, args: stillSeg(`${FR}/privacy.jpg`, D[6], [
    dt({ text: "Compliance built in", size: 46, color: WHITE, y: "h-150", D: D[6], box: true }),
  ]) },
  // 7 growth clip
  { out: `${TMP}/s7.mp4`, args: clipSeg(`${CLIPS}/promo_growth_outro.mp4`, D[7], [
    dt({ text: "Grow your practice", size: 68, color: WHITE, y: "h/2-30", D: D[7] }),
  ]) },
  // 8 pricing card
  { out: `${TMP}/s8.mp4`, args: cardSeg(D[8], [
    dt({ text: "R299 Basic      R499 Premium", font: SERIF, size: 72, color: WHITE, y: "h/2-70", D: D[8] }),
    dt({ text: "14-day free trial", size: 44, color: GOLD, y: "h/2+50", D: D[8] }),
  ], null) },
  // 9 cta card
  { out: `${TMP}/s9.mp4`, args: cardSeg(D[9], [
    dt({ text: "Advisory Connect", font: SERIF, size: 88, color: WHITE, y: "h/2-110", D: D[9] }),
    dt({ text: "advisoryconnect.pro", size: 52, color: GOLD, y: "h/2+10", D: D[9] }),
    dt({ text: "Start today", size: 40, color: GRAY, y: "h/2+100", D: D[9] }),
  ], "h/2+70") },
];

async function main() {
  for (const s of segs) {
    process.stdout.write(`rendering ${s.out} ... `);
    await run("ffmpeg", [...s.args, s.out], { maxBuffer: 1 << 26 });
    console.log("done");
  }

  // Build xfade chain
  const inputs = [];
  for (const s of segs) inputs.push("-i", s.out);

  let filter = "";
  let prev = "0:v";
  let acc = D[0];
  for (let k = 1; k < segs.length; k++) {
    const off = (acc - XF).toFixed(3);
    const label = k === segs.length - 1 ? "vx" : `v${k}`;
    filter += `[${prev}][${k}:v]xfade=transition=fade:duration=${XF}:offset=${off}[${label}];`;
    acc = acc + D[k] - XF;
    prev = label;
  }
  const total = acc;
  filter += `[vx]fade=t=in:st=0:d=0.6,fade=t=out:st=${(total - 0.8).toFixed(3)}:d=0.8[final]`;

  const out = "exports/advisory_connect_promo.mp4";
  console.log(`\nassembling final (~${total.toFixed(1)}s) -> ${out}`);
  await run("ffmpeg", [
    "-y", ...inputs,
    "-filter_complex", filter,
    "-map", "[final]",
    "-c:v", "libx264", "-crf", "19", "-preset", "veryfast",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-r", "30",
    out,
  ], { maxBuffer: 1 << 27 });
  console.log("FINAL DONE:", out);
}

main().catch((e) => { console.error("FAILED:", e.stderr || e.message); process.exit(1); });
