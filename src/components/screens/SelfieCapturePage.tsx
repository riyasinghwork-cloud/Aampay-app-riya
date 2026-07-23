"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { FacePhase } from "@/lib/types";

type CaptureStage = "camera" | "liveness" | "match" | "passed" | "failed";

export function SelfieCapturePage({
  onBack,
  onComplete,
  onFacePhase,
  forceOutcome,
}: {
  onBack: () => void;
  onComplete: (result: { passed: boolean; score: number; deepfake?: boolean; mismatch?: boolean }) => void;
  onFacePhase?: (phase: FacePhase) => void;
  /** Seedable demo outcome from StateMachineNav */
  forceOutcome?: "pass" | "mismatch" | "deepfake" | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [stage, setStage] = useState<CaptureStage>("camera");

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

    if (!snapshot && stage === "camera") start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [snapshot, stage, stopCamera]);

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
    setSnapshot("demo");
    stopCamera();
  };

  const retake = () => {
    setSnapshot(null);
    setStage("camera");
    onFacePhase?.("selfie");
  };

  const runLivenessAndMatch = () => {
    setStage("liveness");
    onFacePhase?.("liveness");
    window.setTimeout(() => {
      setStage("match");
      onFacePhase?.("match");
          window.setTimeout(() => {
            const outcome = forceOutcome ?? "pass";
            if (outcome === "mismatch") {
              setStage("failed");
              onFacePhase?.("failed");
            } else if (outcome === "deepfake") {
              setStage("failed");
              onFacePhase?.("failed");
            } else {
              setStage("passed");
              onFacePhase?.("passed");
            }
          }, 900);
    }, 900);
  };

  const confirm = () => {
    stopCamera();
    runLivenessAndMatch();
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
        <h2 className="text-[20px] font-semibold tracking-[-0.02em]">
          {stage === "liveness"
            ? "Liveness check"
            : stage === "match"
              ? "Face match"
              : stage === "passed"
                ? "Face verified"
                : stage === "failed"
                  ? "Face check failed"
                  : "Live selfie"}
        </h2>
        <p className="text-[16px] text-text-secondary">
          {stage === "liveness"
            ? "Simulating blink / turn-head liveness…"
            : stage === "match"
              ? "Matching selfie to identity photo…"
              : stage === "failed"
                ? "Retake selfie or escalate to Video KYC."
                : "Center your face in good light. JPG or PNG from camera."}
        </p>
      </div>

      <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-black">
        {stage === "liveness" || stage === "match" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-900 px-8 text-center text-white">
            <div className="h-12 w-12 animate-pulse-soft rounded-full bg-lime" />
            <p className="text-[16px] font-semibold">
              {stage === "liveness" ? "Checking liveness…" : "Running face match…"}
            </p>
          </div>
        ) : stage === "passed" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 px-8 text-center text-white">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-lime text-[32px] font-semibold text-black animate-check-pop">
              ✓
            </div>
            <p className="text-[16px] font-semibold">Liveness + face match passed</p>
          </div>
        ) : stage === "failed" ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 px-8 text-center text-white">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#C9A227] text-[32px] font-semibold text-black">
              !
            </div>
            <p className="text-[16px] font-semibold">
              {forceOutcome === "deepfake" ? "Deepfake / spoof suspected" : "Face mismatch"}
            </p>
          </div>
        ) : snapshot && snapshot !== "demo" ? (
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

      {stage === "camera" && (
        <ul className="space-y-1 text-[16px] text-text-secondary">
          <li>· Remove glasses and look straight at the camera</li>
          <li>· Keep your full face inside the oval</li>
        </ul>
      )}

      {stage === "passed" || stage === "failed" ? (
        <div className="space-y-4">
          {stage === "failed" && (
            <Button variant="secondary" onClick={retake}>
              Retake selfie
            </Button>
          )}
          <Button
            onClick={() => {
              stopCamera();
              const outcome = forceOutcome ?? "pass";
              if (outcome === "mismatch") {
                onComplete({ passed: false, score: 0.42, mismatch: true });
              } else if (outcome === "deepfake") {
                onComplete({ passed: false, score: 0.18, deepfake: true });
              } else {
                onComplete({ passed: true, score: 0.94 });
              }
            }}
          >
            {stage === "passed" ? "Use verified selfie" : "Close"}
          </Button>
        </div>
      ) : stage === "liveness" || stage === "match" ? null : snapshot ? (
        <div className="space-y-4">
          <Button onClick={confirm}>Run liveness & face match</Button>
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
