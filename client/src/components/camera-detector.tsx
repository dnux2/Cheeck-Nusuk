import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, Loader2, AlertCircle, Users } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface Detection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
}

type CocoModel = {
  detect: (input: HTMLVideoElement) => Promise<Detection[]>;
};

export function CameraDetector() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const modelRef = useRef<CocoModel | null>(null);

  const [status, setStatus] = useState<"idle" | "loading-model" | "requesting-camera" | "active" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [personCount, setPersonCount] = useState(0);
  const [fps, setFps] = useState(0);
  const fpsRef = useRef({ count: 0, last: performance.now() });

  const labels = {
    start: ar ? "تشغيل الكاميرا والكشف" : "Start Camera & Detection",
    stop: ar ? "إيقاف الكاميرا" : "Stop Camera",
    loadingModel: ar ? "تحميل نموذج الذكاء الاصطناعي..." : "Loading AI model...",
    requestingCam: ar ? "طلب الوصول إلى الكاميرا..." : "Requesting camera access...",
    active: ar ? "الكشف نشط" : "Detection Active",
    personsDetected: ar ? "أشخاص مكتشفون" : "Persons Detected",
    camError: ar ? "تعذّر الوصول إلى الكاميرا" : "Cannot access camera",
    modelError: ar ? "فشل تحميل النموذج" : "Failed to load AI model",
    permissionDenied: ar ? "تم رفض إذن الكاميرا. يرجى السماح بالوصول في إعدادات المتصفح." : "Camera permission denied. Please allow camera access in browser settings.",
    hint: ar ? "سيتم رسم مربع أخضر حول كل شخص مكتشف" : "A green box will be drawn around each detected person",
  };

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setStatus("idle");
    setPersonCount(0);
    setFps(0);
  }, []);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const model = modelRef.current;
    if (!video || !canvas || !model || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    const W = video.videoWidth;
    const H = video.videoHeight;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d")!;

    model.detect(video).then((predictions) => {
      ctx.clearRect(0, 0, W, H);

      const persons = predictions.filter(p => p.class === "person");
      setPersonCount(persons.length);

      persons.forEach(p => {
        const [x, y, w, h] = p.bbox;
        const confidence = Math.round(p.score * 100);
        const isHighConf = p.score > 0.7;
        const boxColor = isHighConf ? "#22C55E" : "#EAB308";

        // Bounding box
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        // Corner accents
        const corner = 16;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y + corner); ctx.lineTo(x, y); ctx.lineTo(x + corner, y);
        ctx.moveTo(x + w - corner, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + corner);
        ctx.moveTo(x + w, y + h - corner); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - corner, y + h);
        ctx.moveTo(x + corner, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - corner);
        ctx.stroke();
        ctx.lineWidth = 1;

        // Label background
        const label = `${ar ? "شخص" : "PERSON"} ${confidence}%`;
        ctx.font = "bold 13px monospace";
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = boxColor;
        ctx.fillRect(x, y - 24, tw + 12, 22);

        // Label text
        ctx.fillStyle = "#000";
        ctx.fillText(label, x + 6, y - 7);

        // Semi-transparent fill
        ctx.fillStyle = `${boxColor}18`;
        ctx.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
      });

      // HUD overlay — scan line
      const scanY = (Date.now() / 8) % H;
      const grad = ctx.createLinearGradient(0, scanY - 8, 0, scanY + 8);
      grad.addColorStop(0, "rgba(34,197,94,0)");
      grad.addColorStop(0.5, "rgba(34,197,94,0.25)");
      grad.addColorStop(1, "rgba(34,197,94,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 8, W, 16);

      // FPS counter
      fpsRef.current.count++;
      const now = performance.now();
      if (now - fpsRef.current.last >= 1000) {
        setFps(fpsRef.current.count);
        fpsRef.current.count = 0;
        fpsRef.current.last = now;
      }

      animFrameRef.current = requestAnimationFrame(detect);
    });
  }, [ar]);

  const startCamera = useCallback(async () => {
    try {
      setStatus("loading-model");

      if (!modelRef.current) {
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        await import("@tensorflow/tfjs");
        modelRef.current = await cocoSsd.load() as CocoModel;
      }

      setStatus("requesting-camera");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();

      setStatus("active");
      detect();
    } catch (err: any) {
      const msg = err?.name === "NotAllowedError"
        ? labels.permissionDenied
        : err?.message?.includes("model")
        ? labels.modelError
        : labels.camError;
      setErrorMsg(msg);
      setStatus("error");
      stopCamera();
    }
  }, [detect, labels.camError, labels.modelError, labels.permissionDenied, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const isLoading = status === "loading-model" || status === "requesting-camera";

  return (
    <div className="flex flex-col gap-4">
      {/* Camera viewport */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
        {/* Video element */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${status === "active" ? "opacity-100" : "opacity-0"}`}
          muted
          playsInline
        />

        {/* Canvas overlay for detections */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Idle / placeholder state */}
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/60">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
              <Camera className="w-9 h-9 opacity-50" />
            </div>
            <p className="text-sm font-medium">{labels.hint}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-emerald-400 bg-black/60">
            <Loader2 className="w-12 h-12 animate-spin" />
            <p className="text-sm font-bold font-mono tracking-wider">
              {status === "loading-model" ? labels.loadingModel : labels.requestingCam}
            </p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-red-400 p-6 text-center">
            <AlertCircle className="w-12 h-12" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Active HUD overlay */}
        {status === "active" && (
          <>
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg font-mono text-xs" dir="ltr">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold">REC</span>
              <span className="text-white/70">// AI DETECTION</span>
            </div>
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg font-mono text-xs text-emerald-400 font-bold" dir="ltr">
              {fps} FPS
            </div>
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg font-mono text-xs text-white/80 space-y-0.5" dir="ltr">
              <div>MODEL: <span className="text-emerald-400">COCO-SSD</span></div>
              <div>DETECTED: <span className="text-emerald-400 font-bold">{personCount}</span></div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {status !== "active" ? (
          <button
            onClick={startCamera}
            disabled={isLoading}
            data-testid="button-start-camera"
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" />{status === "loading-model" ? (ar ? "تحميل النموذج..." : "Loading model...") : (ar ? "تشغيل الكاميرا..." : "Starting camera...")}</>
              : <><Camera className="w-4 h-4" />{labels.start}</>
            }
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              data-testid="button-stop-camera"
              className="flex items-center gap-2 px-6 py-3 bg-destructive hover:bg-destructive/80 text-white font-bold rounded-xl transition-colors"
            >
              <CameraOff className="w-4 h-4" />
              {labels.stop}
            </button>

            {/* Live person count badge */}
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold">
              <Users className="w-5 h-5" />
              <span className="text-xl">{personCount}</span>
              <span className="text-sm font-medium">{labels.personsDetected}</span>
            </div>

            <div className="flex items-center gap-2 text-emerald-500 text-sm font-semibold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              {labels.active}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
