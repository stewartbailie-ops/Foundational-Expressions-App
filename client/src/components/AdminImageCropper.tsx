import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
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
  const CONTAINER = 320;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
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
      onConfirm(canvas.toDataURL("image/jpeg", 0.92));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      data-testid="admin-image-cropper"
    >
      <div className="rounded-2xl bg-white p-6 space-y-4 w-full max-w-sm border border-border shadow-xl">
        <div>
          <h3 className="text-base font-semibold">Crop Profile Picture</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drag to reposition · pinch or use slider to zoom
          </p>
        </div>
        <div
          className="relative mx-auto rounded-full overflow-hidden bg-black"
          style={{ width: CONTAINER, height: CONTAINER }}
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
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-muted-foreground">Zoom</span>
            <span className="text-xs font-medium">{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={4}
            step={0.02}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full"
            data-testid="input-admin-cropper-zoom"
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Rotation</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">{rotation}°</span>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="inline-flex items-center justify-center h-6 w-6 rounded border border-border hover:bg-muted"
                aria-label="Rotate 90 degrees"
                data-testid="button-admin-cropper-rotate-90"
              >
                <RotateCw className="h-3 w-3" />
              </button>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value, 10))}
            className="w-full"
            data-testid="input-admin-cropper-rotation"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={busy}
            data-testid="button-admin-cropper-cancel"
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleConfirm}
            disabled={busy || !croppedAreaPixels}
            data-testid="button-admin-cropper-apply"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Apply & Save
          </Button>
        </div>
      </div>
    </div>
  );
}
