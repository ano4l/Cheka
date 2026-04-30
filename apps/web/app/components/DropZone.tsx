"use client";

import { useCallback, useRef, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  selectedFile?: File | null;
  onClear?: () => void;
  accept?: string;
  disabled?: boolean;
}

const acceptDefault = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileInitial(fileName: string) {
  const extension = fileName.split(".").pop()?.slice(0, 3).toUpperCase();
  return extension || "DOC";
}

export function DropZone({ onFile, selectedFile, onClear, accept = acceptDefault, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = event.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="label">Document</p>
        <span className="rounded-full border border-slate-200 bg-white/75 px-2.5 py-1 text-[11px] font-medium text-muted">
          PDF, DOCX, image / 8 MB max
        </span>
      </div>
      <label
        className={`group relative block cursor-pointer overflow-hidden rounded-xl border p-1 transition no-tap-highlight ${
          isDragging
            ? "border-accent bg-accent/10 shadow-elevated"
            : selectedFile
              ? "border-emerald-200 bg-emerald-50/75"
              : "border-slate-200/90 bg-white/80 hover:border-accent/45 hover:bg-white"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !isDragging) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
          ref={inputRef}
          type="file"
        />

        <div
          className={`relative rounded-lg border border-dashed px-5 py-7 text-center transition sm:px-6 sm:py-9 ${
            isDragging
              ? "border-accent bg-white/80"
              : selectedFile
                ? "border-emerald-300/80 bg-white/70"
                : "border-slate-300/80 bg-gradient-to-br from-slate-50 via-white to-teal-50/55"
          }`}
        >
          {!selectedFile ? (
            <>
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-accent shadow-soft transition group-hover:-translate-y-0.5 group-hover:shadow-elevated">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V4m0 0L8 8m4-4 4 4M5 16.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5" />
                </svg>
              </div>
              <div className="mx-auto mt-4 max-w-sm">
                <p className="text-base font-semibold text-ink">Drop your contract here</p>
                <p className="mt-1 text-sm text-muted">
                  or <span className="font-semibold text-accent">browse files</span> from your computer
                </p>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["Lease", "Employment", "NDA", "Service"].map((type) => (
                  <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-muted" key={type}>
                    {type}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold tracking-wide text-white shadow-soft">
                {getFileInitial(selectedFile.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <p className="max-w-full truncate text-base font-semibold text-ink">{selectedFile.name}</p>
                  <span className="badge border-emerald-200 bg-emerald-50 text-emerald-800">Ready</span>
                </div>
                <p className="mt-1 text-sm text-muted">{formatBytes(selectedFile.size)} / prepared for analysis</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={(event) => {
                    event.preventDefault();
                    inputRef.current?.click();
                  }}
                >
                  Replace
                </button>
                {onClear ? (
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-700"
                    onClick={(event) => {
                      event.preventDefault();
                      onClear();
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
