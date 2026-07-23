"use client";

import type { DocMeta, DocStatus } from "@/lib/types";

const DEFAULT_FORMATS = "PDF, PNG, or JPG";

export function acceptedFormatsForDoc(key: string): string {
  if (key === "selfie") return "Live camera · JPG or PNG";
  return DEFAULT_FORMATS;
}

export function UploadBox({
  label,
  filename,
  status = "not_started",
  formats = DEFAULT_FORMATS,
  meta,
  onClick,
}: {
  label: string;
  filename?: string;
  status?: DocStatus;
  formats?: string;
  meta?: DocMeta;
  onClick: () => void;
}) {
  const uploaded = status === "uploaded" || status === "accepted" || status === "under_review";
  const needsReupload = status === "rejected" || status === "expired";
  const processing = !!meta?.processing;
  const lowConfidence = typeof meta?.ocrConfidence === "number" && meta.ocrConfidence < 0.7;
  const blurry = !!meta?.blurry;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-center justify-center gap-4 rounded-[16px] border-2 border-dashed px-4 py-8 transition motion-list-item ${
        needsReupload || blurry || lowConfidence
          ? "border-[#C9A227] bg-[#F5E6A8]/40"
          : uploaded
            ? "animate-pop-in border-lime bg-lime-soft/40"
            : "border-border bg-white hover:border-black"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          uploaded && !processing ? "bg-lime animate-check-pop" : needsReupload || blurry || lowConfidence ? "bg-[#C9A227]" : "bg-lime"
        }`}
      >
        {uploaded && !processing ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 13l4 4L19 7"
              stroke="#111"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 16V8M12 8l-3.5 3.5M12 8l3.5 3.5M5 19h14"
              stroke="#111"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {processing ? (
        <div className="text-center">
          <p className="text-[16px] font-semibold text-text animate-pulse-soft">OCR processing…</p>
          <p className="text-[16px] font-normal text-text-muted">{label}</p>
        </div>
      ) : blurry ? (
        <div className="text-center">
          <p className="text-[16px] font-semibold text-text">Blurry document — tap to re-upload</p>
          <p className="text-[16px] font-normal text-text-muted">{label}</p>
        </div>
      ) : lowConfidence ? (
        <div className="text-center">
          <p className="text-[16px] font-semibold text-text">
            Low OCR confidence ({Math.round((meta?.ocrConfidence ?? 0) * 100)}%) — re-upload
          </p>
          <p className="text-[16px] font-normal text-text-muted">{label}</p>
        </div>
      ) : needsReupload ? (
        <div className="text-center">
          <p className="text-[16px] font-semibold text-text">
            {status === "rejected" ? "Rejected — tap to re-upload" : "Expired — tap to re-upload"}
          </p>
          <p className="text-[16px] font-normal text-text-muted">{label}</p>
          {meta?.reasonCode && (
            <p className="mt-1 text-[16px] text-text-muted">{meta.reasonCode}</p>
          )}
        </div>
      ) : uploaded ? (
        <div className="text-center">
          <p className="text-[16px] font-semibold text-text">
            {filename ?? `${label.replace(/\s+/g, "_").toLowerCase()}.jpg`}
          </p>
          <p className="text-[16px] font-normal text-text-muted">Tap to remove</p>
          {typeof meta?.ocrConfidence === "number" && (
            <p className="mt-1 text-[16px] text-text-secondary">
              OCR {Math.round(meta.ocrConfidence * 100)}%
            </p>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-[16px] font-semibold text-text">Upload {label}</p>
          <p className="text-[16px] text-text-secondary">Accepted: {formats}</p>
        </div>
      )}
    </button>
  );
}

export function StatusChip({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, { label: string; className: string; motion: string }> = {
    not_started: { label: "Not started", className: "bg-bg text-text-secondary", motion: "" },
    uploaded: {
      label: "Uploaded",
      className: "bg-lime-soft text-text",
      motion: "animate-badge-in animate-check-pop",
    },
    under_review: {
      label: "Under review",
      className: "bg-black/5 text-text",
      motion: "animate-badge-in animate-pulse-soft",
    },
    accepted: {
      label: "Accepted",
      className: "bg-lime text-black",
      motion: "animate-badge-in animate-check-pop",
    },
    rejected: {
      label: "Rejected · re-upload",
      className: "bg-[#F5E6A8] text-text",
      motion: "animate-badge-in",
    },
    expired: {
      label: "Expired · re-upload",
      className: "bg-bg text-text-secondary",
      motion: "animate-badge-in",
    },
  };
  const item = map[status];
  return (
    <span
      key={status}
      className={`rounded-full px-[8px] py-1 text-[16px] font-semibold leading-none ${item.className} ${item.motion}`}
    >
      {item.label}
    </span>
  );
}
