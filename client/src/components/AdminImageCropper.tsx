import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2, RotateCw } from "lucide-react";

export function AdminImageCropper({
  src,
  onConfirm,
  onCancel,
}: {
  src: string;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const CONTAINER = 280;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [posterize, setPosterize] = useState(0);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = src;
      });
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const bboxW = img.width * cos + img.height * sin;
      const bboxH = img.width * sin + img.height * cos;
      const work = document.createElement("canvas");
      work.width = bboxW;
      work.height = bboxH;
      const wctx = work.getContext("2d");
      if (!wctx) return;
      wctx.translate(bboxW / 2, bboxH / 2);
      wctx.rotate(rad);
      wctx.drawImage(img, -img.width / 2, -img.height / 2);
      const OUT = 400;
      const canvas = document.createElement("canvas");
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(
        work,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        OUT,
        OUT,
      );
      ctx.filter = "none";
      if (posterize > 0) {
        const levels = posterize;
        const imageData = ctx.getImageData(0, 0, OUT, OUT);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i]   = Math.round(d[i]   / 255 * levels) / levels * 255;
          d[i+1] = Math.round(d[i+1] / 255 * levels) / levels * 255;
          d[i+2] = Math.round(d[i+2] / 255 * levels) / levels * 255;
        }
        ctx.putImageData(imageData, 0, 0);
      }
      onConfirm(canvas.toDataURL("image/jpeg", 0.92));
    } finally {
      setBusy(false);
    }
  };

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="rounded-2xl bg-[#111] border border-white/10 p-5 space-y-4 w-full max-w-xs shadow-2xl overflow-y-auto max-h-[90vh]">
        <div>
          <h3 className="text-sm font-semibold text-white">Crop Profile Picture</h3>
          <p className="text-xs text-white/40 mt-0.5">Drag to reposition · pinch or use slider to zoom</p>
        </div>

        {/* Crop area */}
        <div
          className="relative mx-auto"
          style={{ width: CONTAINER, height: CONTAINER, borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(59,130,246,0.6)", backgroundColor: "#000" }}
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            minZoom={1}
            maxZoom={4}
            zoomSpeed={0.5}
            objectFit="cover"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, p) => setCroppedAreaPixels(p)}
            style={{
              containerStyle: { width: "100%", height: "100%", position: "absolute", backgroundColor: "#000" },
              mediaStyle: { filter: filterStyle },
              cropAreaStyle: { border: "none", boxShadow: "none", color: "rgba(0,0,0,0.4)" },
            }}
          />
        </div>

        {/* Zoom */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-white/40">Zoom</span>
            <span className="text-xs font-medium text-blue-400">{Math.round(zoom * 100)}%</span>
          </div>
          <input type="range" min={1} max={4} step={0.02} value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Rotation */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Rotation</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-blue-400">{rotation}°</span>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="inline-flex items-center justify-center h-6 w-6 rounded border border-white/15 text-white/40 hover:bg-white/5"
                aria-label="Rotate 90 degrees"
              >
                <RotateCw className="h-3 w-3" />
              </button>
            </div>
          </div>
          <input type="range" min={0} max={360} step={1} value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value, 10))}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Artistic Filters */}
        <div className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-medium text-white/60">Artistic Filters</p>
          {[
            { label: "Brightness", value: brightness, set: setBrightness, min: 30,  max: 200 },
            { label: "Contrast",   value: contrast,   set: setContrast,   min: 50,  max: 250 },
            { label: "Saturation", value: saturation, set: setSaturation, min: 0,   max: 300 },
          ].map(f => (
            <div key={f.label} className="space-y-0.5">
              <div className="flex justify-between">
                <span className="text-xs text-white/40">{f.label}</span>
                <span className="text-xs font-medium text-blue-400">{f.value}%</span>
              </div>
              <input type="range" min={f.min} max={f.max} step={1} value={f.value}
                onChange={(e) => f.set(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          ))}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Posterize</span>
              <span className="text-xs font-medium text-blue-400">{posterize === 0 ? "Off" : `${posterize} levels`}</span>
            </div>
            <input type="range" min={0} max={8} step={1} value={posterize}
              onChange={(e) => setPosterize(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
          {(brightness !== 100 || contrast !== 100 || saturation !== 100 || posterize !== 0) && (
            <button onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); setPosterize(0); }}
              className="text-xs text-white/30 underline hover:text-white/50">
              Reset filters
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-white/15 text-white/60 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !croppedAreaPixels}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
}
