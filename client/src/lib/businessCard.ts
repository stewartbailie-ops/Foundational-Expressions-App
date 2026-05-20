import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Advisor } from "@shared/schema";
import { getInitialsBadgeColors } from "./themeUtils";

export type CardVariant = "portrait" | "square";

export const CARD_DIMENSIONS: Record<CardVariant, { w: number; h: number; label: string }> = {
  portrait: { w: 1080, h: 1920, label: "Portrait · 1080×1920 (Stories)" },
  square:   { w: 1080, h: 1080, label: "Square · 1080×1080 (Feed)" },
};

function getInitials(name: string): string {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map(p => p[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function loadImage(src: string, withCors = true): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (withCors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function svgStringToImage(svg: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    // Ensure the SVG carries an xmlns — without it, Safari/iOS refuse to
    // decode the image and silently fire `onerror`, leaving the QR off the
    // canvas. renderToStaticMarkup does not always include it.
    let normalised = svg;
    if (!/\sxmlns\s*=/.test(normalised)) {
      normalised = normalised.replace(/<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // Use a base64 data URL rather than a blob URL. Blob URLs created in one
    // microtask and revoked after `onload` have caused intermittent QR drops
    // in production builds; data URLs are fully self-contained and decode
    // synchronously from the Image's perspective.
    const dataUrl = `data:image/svg+xml;base64,${typeof window !== "undefined" && window.btoa
      ? window.btoa(unescape(encodeURIComponent(normalised)))
      : ""}`;
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      // eslint-disable-next-line no-console
      console.error("[businessCard] QR SVG failed to decode");
      resolve(null);
    };
    img.src = dataUrl;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines = 2): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(trial).width > maxW && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else cur = trial;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  // If we still have leftover words, truncate the last line.
  return lines;
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + "…").width <= maxW) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + "…";
}

function drawCoverPhoto(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, img: HTMLImageElement) {
  const aspect = img.naturalWidth / img.naturalHeight;
  const tgt = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (aspect > tgt) {
    sw = Math.round(sh * tgt);
    sx = Math.round((img.naturalWidth - sw) / 2);
  } else {
    sh = Math.round(sw / tgt);
    sy = Math.round((img.naturalHeight - sh) / 2);
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawInitialsBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, from: string, to: string, initials: string) {
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  // Subtle highlight shim across the top — matches the on-profile badge look.
  const shim = ctx.createLinearGradient(x, y, x, y + h / 2);
  shim.addColorStop(0, "rgba(255,255,255,0.18)");
  shim.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shim;
  ctx.fillRect(x, y, w, h / 2);
  // Initials — must be visibly white. Old opacity of 0.22 rendered as a
  // ghost on the downloaded PNGs; reference design (Chris Zeeman) shows
  // clearly legible white letters.
  const letters = ((initials[0] || "") + (initials[1] || "")) || "AC";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const fontSize = Math.min(w, h) * 0.45;
  ctx.font = `bold ${fontSize}px Georgia, "Times New Roman", serif`;
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = Math.round(fontSize * 0.08);
  ctx.shadowOffsetY = Math.round(fontSize * 0.04);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(letters, x + w / 2, y + h / 2);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function drawFooter(ctx: CanvasRenderingContext2D, W: number, H: number, logoImg: HTMLImageElement | null) {
  const FOOTER_H = Math.round(H * 0.07);
  const ICON = Math.round(FOOTER_H * 0.42);
  const fontSize = Math.round(FOOTER_H * 0.22);
  const linkSize = Math.round(FOOTER_H * 0.18);
  ctx.fillStyle = "#f6f6f6";
  ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H);
  ctx.fillStyle = "#eaeaea";
  ctx.fillRect(0, H - FOOTER_H, W, 2);
  ctx.fillStyle = "#3a3a3a";
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const label = "Powered by Advisory Connect";
  const labelW = ctx.measureText(label).width;
  const GAP = Math.round(FOOTER_H * 0.18);
  const totalW = (logoImg ? ICON + GAP : 0) + labelW;
  const startX = (W - totalW) / 2;
  const topRowY = H - FOOTER_H + FOOTER_H * 0.36;
  if (logoImg) {
    ctx.drawImage(logoImg, startX, topRowY - ICON / 2, ICON, ICON);
    ctx.textAlign = "left";
    ctx.fillText(label, startX + ICON + GAP, topRowY);
  } else {
    ctx.fillText(label, W / 2, topRowY);
  }
  ctx.fillStyle = "#5a5a5a";
  ctx.font = `${linkSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("advisoryconnect.pro/privacy-policy", W / 2, H - FOOTER_H + FOOTER_H * 0.72);
}

type DrawCtx = {
  advisor: Advisor;
  from: string;
  to: string;
  photoImg: HTMLImageElement | null;
  logoImg: HTMLImageElement | null;
  qrImg: HTMLImageElement | null;
};

function drawPortrait(ctx: CanvasRenderingContext2D, W: number, H: number, c: DrawCtx) {
  const { advisor, from, to, photoImg, logoImg, qrImg } = c;
  const PHOTO_H = Math.round(H * 0.55); // ~1056
  const initials = getInitials(advisor.name);

  if (photoImg) {
    drawCoverPhoto(ctx, 0, 0, W, PHOTO_H, photoImg);
    const grad = ctx.createLinearGradient(0, PHOTO_H - 420, 0, PHOTO_H);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.82)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, PHOTO_H - 420, W, 420);
  } else {
    drawInitialsBlock(ctx, 0, 0, W, PHOTO_H, from, to, initials);
  }

  // Name + Title on photo
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 70px Arial, sans-serif`;
  const nameLines = wrapText(ctx, advisor.name, W - 120, 2);
  let ny = PHOTO_H - 150 - (nameLines.length - 1) * 38;
  for (const line of nameLines) { ctx.fillText(line, W / 2, ny); ny += 78; }
  if (advisor.title) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `600 30px Arial, sans-serif`;
    ctx.fillText(advisor.title.toUpperCase(), W / 2, PHOTO_H - 64);
  }

  // White body
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, PHOTO_H, W, H - PHOTO_H);

  // Contact list
  const phone = (advisor as any).contactNumber || "";
  const workingHours = (advisor as any).workingHours || "";
  const location = (advisor as any).location || "";
  const items: [string, string][] = [];
  if (phone) items.push(["Tel", phone]);
  if (advisor.email) items.push(["Email", advisor.email]);
  if (location) items.push(["Office", location]);
  if (workingHours) items.push(["Hours", workingHours]);
  if ((advisor as any).advisorCode) items.push(["Code", (advisor as any).advisorCode]);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  let y = PHOTO_H + 100;
  for (const [label, text] of items) {
    ctx.fillStyle = "#909090";
    ctx.font = `bold 24px Arial, sans-serif`;
    ctx.fillText(label.toUpperCase(), 80, y);
    ctx.fillStyle = "#1f1f1f";
    ctx.font = `500 32px Arial, sans-serif`;
    ctx.fillText(truncateToWidth(ctx, text, W - 280), 220, y);
    y += 64;
  }

  // QR
  if (qrImg) {
    const QR = 340;
    const qrY = Math.max(y + 50, H - 620);
    const qrX = (W - QR) / 2;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX - 18, qrY - 18, QR + 36, QR + 36);
    ctx.drawImage(qrImg, qrX, qrY, QR, QR);
    ctx.fillStyle = "#666"; ctx.textAlign = "center";
    ctx.font = `500 26px Arial, sans-serif`;
    ctx.fillText("Scan to view full profile", W / 2, qrY + QR + 44);
    ctx.fillStyle = "#999"; ctx.font = `22px Arial, sans-serif`;
    ctx.fillText(`advisoryconnect.pro/${advisor.profileSlug}`, W / 2, qrY + QR + 80);
  }

  drawFooter(ctx, W, H, logoImg);
}

function drawSquare(ctx: CanvasRenderingContext2D, W: number, H: number, c: DrawCtx) {
  const { advisor, from, to, photoImg, logoImg, qrImg } = c;
  const initials = getInitials(advisor.name);
  const LEFT_W = Math.round(W * 0.42);
  const RIGHT_X = LEFT_W;
  const RIGHT_W = W - LEFT_W;
  const FOOTER_H = Math.round(H * 0.07);
  const BODY_H = H - FOOTER_H;

  if (photoImg) {
    drawCoverPhoto(ctx, 0, 0, LEFT_W, BODY_H, photoImg);
  } else {
    drawInitialsBlock(ctx, 0, 0, LEFT_W, BODY_H, from, to, initials);
  }

  // Right pane background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(RIGHT_X, 0, RIGHT_W, BODY_H);

  // Accent stripe at top of right pane
  const stripe = ctx.createLinearGradient(RIGHT_X, 0, W, 0);
  stripe.addColorStop(0, from);
  stripe.addColorStop(1, to);
  ctx.fillStyle = stripe;
  ctx.fillRect(RIGHT_X, 0, RIGHT_W, 12);

  const padX = RIGHT_X + 48;
  const maxW = RIGHT_W - 96;
  let y = 110;

  // Name
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#111";
  ctx.font = `bold 52px Arial, sans-serif`;
  const nameLines = wrapText(ctx, advisor.name, maxW, 2);
  for (const line of nameLines) { ctx.fillText(line, padX, y); y += 62; }

  if (advisor.title) {
    y += 4;
    ctx.fillStyle = "#666";
    ctx.font = `600 22px Arial, sans-serif`;
    const titleLines = wrapText(ctx, advisor.title.toUpperCase(), maxW, 2);
    for (const line of titleLines) { ctx.fillText(line, padX, y); y += 32; }
  }

  y += 24;
  ctx.fillStyle = "#eee";
  ctx.fillRect(padX, y, maxW, 2);
  y += 28;

  const phone = (advisor as any).contactNumber || "";
  const workingHours = (advisor as any).workingHours || "";
  const items: [string, string][] = [];
  if (phone) items.push(["Tel", phone]);
  if (advisor.email) items.push(["Email", advisor.email]);
  if (workingHours) items.push(["Hours", workingHours]);
  if ((advisor as any).advisorCode) items.push(["Code", (advisor as any).advisorCode]);

  for (const [label, text] of items) {
    ctx.fillStyle = "#8a8a8a";
    ctx.font = `bold 18px Arial, sans-serif`;
    ctx.fillText(label.toUpperCase(), padX, y);
    y += 26;
    ctx.fillStyle = "#1f1f1f";
    ctx.font = `500 26px Arial, sans-serif`;
    ctx.fillText(truncateToWidth(ctx, text, maxW), padX, y);
    y += 40;
  }

  // QR bottom-right of right pane
  if (qrImg) {
    const QR = 240;
    const qrX = W - QR - 48;
    const qrY = BODY_H - QR - 70;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(qrX - 12, qrY - 12, QR + 24, QR + 24);
    ctx.drawImage(qrImg, qrX, qrY, QR, QR);
    ctx.fillStyle = "#777"; ctx.font = `500 18px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Scan to view profile", qrX + QR / 2, qrY + QR + 30);
    ctx.fillStyle = "#aaa"; ctx.font = `16px Arial, sans-serif`;
    ctx.fillText(`advisoryconnect.pro/${advisor.profileSlug}`, qrX + QR / 2, qrY + QR + 54);
  }

  drawFooter(ctx, W, H, logoImg);
}

export async function renderBusinessCard(opts: { advisor: Advisor; variant: CardVariant }): Promise<Blob> {
  const { advisor, variant } = opts;
  const { w, h } = CARD_DIMENSIONS[variant];
  const { from, to } = getInitialsBadgeColors(advisor.theme || "blue", (advisor as any).themeColor);

  const qrSvg = renderToStaticMarkup(
    createElement(QRCodeSVG as any, {
      value: `https://app.advisoryconnect.pro/${advisor.profileSlug}`,
      size: 320,
      level: "M",
      includeMargin: false,
    })
  );

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const [photoImg, logoImg, qrImg] = await Promise.all([
    advisor.profilePicUrl ? loadImage(advisor.profilePicUrl, true) : Promise.resolve(null),
    loadImage("/logo/icon-64.png", false),
    svgStringToImage(qrSvg),
  ]);

  const draw = variant === "portrait" ? drawPortrait : drawSquare;
  draw(ctx, w, h, { advisor, from, to, photoImg, logoImg, qrImg });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode card PNG"))),
      "image/png",
      0.95
    );
  });
}

export async function shareOrDownloadCard(opts: {
  advisor: Advisor;
  variant: CardVariant;
  mode: "share" | "download";
}): Promise<"shared" | "downloaded" | "cancelled"> {
  const blob = await renderBusinessCard(opts);
  const slug = opts.advisor.profileSlug || "advisor";
  const filename = `${slug}-business-card-${opts.variant}.png`;
  const file = new File([blob], filename, { type: "image/png" });

  const nav = navigator as any;
  if (
    opts.mode === "share" &&
    typeof nav !== "undefined" &&
    typeof nav.canShare === "function" &&
    nav.canShare({ files: [file] }) &&
    typeof nav.share === "function"
  ) {
    try {
      await nav.share({
        files: [file],
        title: `${opts.advisor.name} — Digital Business Card`,
        text: `View ${opts.advisor.name}'s advisor profile.`,
      });
      return "shared";
    } catch (e: any) {
      if (e?.name === "AbortError") return "cancelled";
      // fall through to download on share failure
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "downloaded";
}

export function canShareCardNatively(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as any;
  if (typeof nav.canShare !== "function" || typeof nav.share !== "function") return false;
  try {
    // Use a dummy 1-byte PNG-typed file to test capability without rendering.
    const probe = new File([new Uint8Array([0])], "probe.png", { type: "image/png" });
    return !!nav.canShare({ files: [probe] });
  } catch {
    return false;
  }
}
