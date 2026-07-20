"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export function SelfieCapturePage({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setError(null);
      setReady(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setError("Camera unavailable — use demo capture instead.");
          setReady(true);
        }
      }
    }

    if (!snapshot) start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [snapshot, stopCamera]);

  const capture = () => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        setSnapshot(canvas.toDataURL("image/jpeg", 0.9));
        stopCamera();
        return;
      }
    }
    // Demo fallback when camera denied
    setSnapshot("demo");
    stopCamera();
  };

  const retake = () => setSnapshot(null);

  const confirm = () => {
    stopCamera();
    onComplete();
  };

  return (
    <div className="animate-fade-in space-y-4 pb-1">
      <button
        type="button"
        onClick={() => {
          stopCamera();
          onBack();
        }}
        className="inline-flex items-center gap-1 text-[16px] font-semibold text-text-secondary hover:text-text"
      >
        <span aria-hidden>←</span> Back
      </button>

      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.02em]">Live selfie</h2>
        <p className="text-[16px] text-text-secondary">
          Center your face in good light. JPG or PNG from camera.
        </p>
      </div>

      <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-black">
        {snapshot && snapshot !== "demo" ? (
          // Captured frame from getUserMedia
          <img src={snapshot} alt="Captured selfie" className="h-full w-full object-cover" />
        ) : snapshot === "demo" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 px-8 text-center text-white">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-lime text-[32px] font-semibold text-black animate-check-pop">
              ✓
            </div>
            <p className="text-[16px] font-semibold">Demo selfie captured</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full scale-x-[-1] object-cover"
            />
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[16px] text-white">
                Starting camera…
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-neutral-900 px-8 text-center">
                <p className="text-[16px] text-white/80">{error}</p>
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[58%] w-[62%] rounded-full border-2 border-white/70 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
            </div>
          </>
        )}
      </div>

      <ul className="space-y-1 text-[16px] text-text-secondary">
        <li>· Remove glasses and look straight at the camera</li>
        <li>· Keep your full face inside the oval</li>
      </ul>

      {snapshot ? (
        <div className="space-y-4">
          <Button onClick={confirm}>Use this selfie</Button>
          <Button variant="secondary" onClick={retake}>
            Retake
          </Button>
        </div>
      ) : (
        <Button onClick={capture} disabled={!ready && !error}>
          {error ? "Capture demo selfie" : "Capture selfie"}
        </Button>
      )}
    </div>
  );
}
